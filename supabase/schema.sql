-- ==============================================================================
-- SCHEMA SUPABASE : E-COMMERCE MODERNE (Next.js + Supabase)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE PROFILES (Gestion des rôles : 'admin' ou 'user')
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger pour créer automatiquement un profil lors de l'inscription Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction utilitaire pour vérifier si l'utilisateur courant est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TABLE PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10, 2) CHECK (original_price >= 0), -- Prix avant promotion (barré)
  category TEXT NOT NULL,
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Si la table existe déjà, exécutez cette commande pour ajouter le support des promotions :
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);

-- 4. TABLE ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT,
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'En attente' CHECK (status IN ('En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Si la table orders existe déjà, vous pouvez ajouter les colonnes wilaya et commune :
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS wilaya TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commune TEXT;

-- 5. TABLE ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 6. GESTION DU STOCK EN CAS D'ANNULATION OU RÉACTIVATION DE COMMANDE
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la commande passe à 'Annulée', on remet les articles en stock
  IF NEW.status = 'Annulée' AND OLD.status != 'Annulée' THEN
    UPDATE public.products p
    SET stock = p.stock + oi.quantity,
        updated_at = timezone('utc'::text, now())
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;

  -- Si une commande annulée est réactivée, on redécrémente le stock
  ELSIF OLD.status = 'Annulée' AND NEW.status != 'Annulée' THEN
    UPDATE public.products p
    SET stock = GREATEST(0, p.stock - oi.quantity),
        updated_at = timezone('utc'::text, now())
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_update ON public.orders;
CREATE TRIGGER on_order_status_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_change();

-- 7. FONCTION RPC TRANSACTIONNELLE: create_order
-- Vérifie le stock en verrouillant les lignes (FOR UPDATE), calcule le total,
-- décrémente le stock et enregistre la commande et ses items atomiquement.
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_address TEXT,
  p_city TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_calculated_total NUMERIC(10, 2) := 0;
  v_item_count INTEGER := 0;
BEGIN
  -- Vérification des paramètres obligatoires
  IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Le nom du client est obligatoire';
  END IF;

  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RAISE EXCEPTION 'Le numéro de téléphone est obligatoire';
  END IF;

  IF p_address IS NULL OR trim(p_address) = '' THEN
    RAISE EXCEPTION 'L''adresse de livraison est obligatoire';
  END IF;

  IF p_city IS NULL OR trim(p_city) = '' THEN
    RAISE EXCEPTION 'La ville est obligatoire';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Le panier ne peut pas être vide';
  END IF;

  -- 1. Vérification du stock et calcul du total sécurisé côté serveur
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER)
  LOOP
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Quantité invalide pour le produit %', v_item.product_id;
    END IF;

    -- Verrouillage de la ligne du produit pour éviter toute condition de course (race condition)
    SELECT id, name, price, stock INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produit introuvable : %', v_item.product_id;
    END IF;

    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuffisant pour "%" (restant : %, demandé : %)', 
        v_product.name, v_product.stock, v_item.quantity;
    END IF;

    v_calculated_total := v_calculated_total + (v_product.price * v_item.quantity);
    v_item_count := v_item_count + 1;
  END LOOP;

  -- 2. Génération d'un numéro de commande lisible et unique (ex: CMD-261018-AB12)
  v_order_number := 'CMD-' || to_char(timezone('utc'::text, now()), 'YYMMDD') || '-' || 
                    upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  -- 3. Insertion de la commande principale
  INSERT INTO public.orders (
    order_number,
    customer_name,
    phone,
    email,
    address,
    city,
    notes,
    total,
    status
  ) VALUES (
    v_order_number,
    trim(p_customer_name),
    trim(p_phone),
    NULLIF(trim(p_email), ''),
    trim(p_address),
    trim(p_city),
    NULLIF(trim(p_notes), ''),
    v_calculated_total,
    'En attente'
  )
  RETURNING id INTO v_order_id;

  -- 4. Insertion des articles de commande et décrémentation atomique du stock
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INTEGER)
  LOOP
    SELECT id, name, price, stock INTO v_product
    FROM public.products
    WHERE id = v_item.product_id;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      price,
      quantity
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_item.quantity
    );

    UPDATE public.products
    SET stock = stock - v_item.quantity,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_product.id;
  END LOOP;

  -- Retour de la confirmation
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_calculated_total,
    'items_count', v_item_count
  );
END;
$$;

-- Autoriser l'appel de cette fonction aux utilisateurs anonymes et authentifiés
GRANT EXECUTE ON FUNCTION public.create_order TO anon, authenticated, service_role;

-- 8. FONCTION RPC DASHBOARD ANALYTICS
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue NUMERIC(10, 2);
  v_total_orders INTEGER;
  v_average_order NUMERIC(10, 2);
  v_today_orders INTEGER;
  v_out_of_stock INTEGER;
  v_low_stock INTEGER;
  v_revenue_by_day JSONB;
  v_top_products JSONB;
  v_orders_by_status JSONB;
BEGIN
  -- Seuls les admins ou service_role peuvent voir les analytics
  IF NOT (public.is_admin() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Accès refusé. Rôle administrateur requis.';
  END IF;

  -- Total Chiffre d'affaires (hors commandes annulées)
  SELECT COALESCE(SUM(total), 0) INTO v_total_revenue
  FROM public.orders
  WHERE status != 'Annulée';

  -- Total Commandes
  SELECT COUNT(*) INTO v_total_orders
  FROM public.orders;

  -- Panier moyen
  SELECT COALESCE(ROUND(AVG(total), 2), 0) INTO v_average_order
  FROM public.orders
  WHERE status != 'Annulée';

  -- Commandes du jour
  SELECT COUNT(*) INTO v_today_orders
  FROM public.orders
  WHERE created_at >= date_trunc('day', timezone('utc'::text, now()));

  -- Produits en rupture
  SELECT COUNT(*) INTO v_out_of_stock
  FROM public.products
  WHERE stock = 0;

  -- Produits stock faible (< 5 et > 0)
  SELECT COUNT(*) INTO v_low_stock
  FROM public.products
  WHERE stock > 0 AND stock < 5;

  -- Revenus par jour (30 derniers jours)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(d.day, 'YYYY-MM-DD'),
        'revenue', COALESCE(SUM(o.total), 0),
        'orders_count', COUNT(o.id)
      ) ORDER BY d.day ASC
    ), '[]'::jsonb
  ) INTO v_revenue_by_day
  FROM (
    SELECT generate_series(
      date_trunc('day', timezone('utc'::text, now()) - INTERVAL '29 days'),
      date_trunc('day', timezone('utc'::text, now())),
      INTERVAL '1 day'
    )::date AS day
  ) d
  LEFT JOIN public.orders o 
    ON date_trunc('day', o.created_at) = d.day 
    AND o.status != 'Annulée'
  GROUP BY d.day;

  -- Top 5 produits les plus vendus
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'product_name', sub.product_name,
        'total_sold', sub.total_sold,
        'total_revenue', sub.total_revenue
      )
    ), '[]'::jsonb
  ) INTO v_top_products
  FROM (
    SELECT 
      oi.product_name,
      SUM(oi.quantity) AS total_sold,
      SUM(oi.quantity * oi.price) AS total_revenue
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.status != 'Annulée'
    GROUP BY oi.product_name
    ORDER BY total_sold DESC
    LIMIT 5
  ) sub;

  -- Commandes par statut
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'status', s.status,
        'count', COALESCE(c.count, 0)
      )
    ), '[]'::jsonb
  ) INTO v_orders_by_status
  FROM (
    VALUES ('En attente'), ('Confirmée'), ('Expédiée'), ('Livrée'), ('Annulée')
  ) AS s(status)
  LEFT JOIN (
    SELECT status, COUNT(*) AS count
    FROM public.orders
    GROUP BY status
  ) c ON s.status = c.status;

  RETURN jsonb_build_object(
    'total_revenue', v_total_revenue,
    'total_orders', v_total_orders,
    'average_order', v_average_order,
    'today_orders', v_today_orders,
    'out_of_stock', v_out_of_stock,
    'low_stock', v_low_stock,
    'revenue_by_day', v_revenue_by_day,
    'top_products', v_top_products,
    'orders_by_status', v_orders_by_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_analytics TO authenticated, service_role;

-- 9. CONFIGURATION ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- POLICIES : PROFILES
DROP POLICY IF EXISTS "Lecture profil pour propriétaire ou admin" ON public.profiles;
CREATE POLICY "Lecture profil pour propriétaire ou admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Modification profil par admin ou soi-même" ON public.profiles;
CREATE POLICY "Modification profil par admin ou soi-même"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- POLICIES : PRODUCTS
-- Lecture publique pour le catalogue client
DROP POLICY IF EXISTS "Lecture publique des produits" ON public.products;
CREATE POLICY "Lecture publique des produits"
  ON public.products FOR SELECT
  USING (true);

-- Modifications réservées aux admins
DROP POLICY IF EXISTS "Admin peut insérer des produits" ON public.products;
CREATE POLICY "Admin peut insérer des produits"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin peut modifier des produits" ON public.products;
CREATE POLICY "Admin peut modifier des produits"
  ON public.products FOR UPDATE
  USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin peut supprimer des produits" ON public.products;
CREATE POLICY "Admin peut supprimer des produits"
  ON public.products FOR DELETE
  USING (public.is_admin() OR auth.role() = 'service_role');

-- POLICIES : ORDERS
-- Lecture et modification réservées aux administrateurs
DROP POLICY IF EXISTS "Admin peut lire les commandes" ON public.orders;
CREATE POLICY "Admin peut lire les commandes"
  ON public.orders FOR SELECT
  USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin peut modifier les commandes" ON public.orders;
CREATE POLICY "Admin peut modifier les commandes"
  ON public.orders FOR UPDATE
  USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin peut supprimer les commandes" ON public.orders;
CREATE POLICY "Admin peut supprimer les commandes"
  ON public.orders FOR DELETE
  USING (public.is_admin() OR auth.role() = 'service_role');

-- POLICIES : ORDER_ITEMS
DROP POLICY IF EXISTS "Admin peut lire les items de commande" ON public.order_items;
CREATE POLICY "Admin peut lire les items de commande"
  ON public.order_items FOR SELECT
  USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin peut modifier les items de commande" ON public.order_items;
CREATE POLICY "Admin peut modifier les items de commande"
  ON public.order_items FOR UPDATE
  USING (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin peut supprimer les items de commande" ON public.order_items;
CREATE POLICY "Admin peut supprimer les items de commande"
  ON public.order_items FOR DELETE
  USING (public.is_admin() OR auth.role() = 'service_role');

-- 10. SUPABASE STORAGE : BUCKET PRODUCT-IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies Storage
DROP POLICY IF EXISTS "Lecture publique des images produits" ON storage.objects;
CREATE POLICY "Lecture publique des images produits"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Upload réservé aux admins" ON storage.objects;
CREATE POLICY "Upload réservé aux admins"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND 
    (public.is_admin() OR auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "Modification réservée aux admins" ON storage.objects;
CREATE POLICY "Modification réservée aux admins"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images' AND 
    (public.is_admin() OR auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS "Suppression réservée aux admins" ON storage.objects;
CREATE POLICY "Suppression réservée aux admins"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images' AND 
    (public.is_admin() OR auth.role() = 'service_role')
  );

-- 11. ACTIVATION DE SUPABASE REALTIME
-- Permet à l'interface admin de recevoir instantanément les nouvelles commandes et mises à jour
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- 12. DONNÉES DE DÉMONSTRATION (SEED)
INSERT INTO public.products (name, description, price, category, image_url, stock)
VALUES
  (
    'Casque Audio Sans Fil ANC Nova Pro',
    'Casque circum-aural haut de gamme avec réduction active du bruit hybride, autonomie 40h et coussinets à mémoire de forme.',
    189.99,
    'Audio',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    18
  ),
  (
    'Montre Connectée Horizon Fit 4',
    'Écran AMOLED 1.43", suivi continu du rythme cardiaque et SpO2, GPS intégré, étanchéité 5 ATM et 14 jours d''autonomie.',
    129.50,
    'Accessoires',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    4
  ),
  (
    'Clavier Mécanique Sans Fil Lumina RGB',
    'Switches tactiles lubrifiés d''usine, rétroéclairage RGB personnalisable touche par touche, connectivité Bluetooth & 2.4GHz.',
    94.00,
    'Informatique',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    0
  ),
  (
    'Enceinte Bluetooth Nomade Pulse Bass',
    'Son stéréo à 360 degrés avec radiateurs passifs pour des basses profondes. Certification IPX7 résistante à l''eau, autonomie 20h.',
    69.90,
    'Audio',
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
    12
  ),
  (
    'Souris Ergonomique Haute Précision Aero',
    'Capteur optique 26000 DPI, forme profilée prévenant les TMS, molette débrayable en aluminium et 7 boutons programmables.',
    79.99,
    'Informatique',
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
    3
  ),
  (
    'Lampe de Bureau LED Minimaliste Halo',
    'Éclairage anti-éblouissement avec variateur tactile d''intensité et de température de couleur (2700K à 6500K), port de charge USB-C.',
    45.00,
    'Maison',
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    25
  ),
  (
    'Sac à Dos Urbain Étanche UrbanRoll 24L',
    'Tissu Cordura résistant aux intempéries, compartiment rembourré pour ordinateur 16", fermetures YKK étanches et bandes réfléchissantes.',
    89.00,
    'Mode',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    8
  ),
  (
    'Gourde Isotherme Inox 750ml Alpine',
    'Garde les boissons fraîches 24h et chaudes 12h. Double paroi sous vide sans BPA avec bouchon sport étanche en bambou.',
    28.50,
    'Maison',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    0
  )
ON CONFLICT DO NOTHING;

-- Exemple d'instructions pour promouvoir un compte admin :
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@votredomaine.com';
