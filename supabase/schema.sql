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
  images TEXT[] DEFAULT '{}', -- Liste de photos pour l'article
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Si la table existe déjà, exécutez ces commandes pour mettre à jour la structure :
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

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

-- 12. DONNÉES DE DÉMONSTRATION RÉELLES (SEED ARESSTORE DZD)
INSERT INTO public.products (name, description, price, category, image_url, stock)
VALUES
  (
    'Samsung Galaxy S24 Ultra (512 Go - Gris Titane)',
    '<!--PROMO:225000-->
Le fleuron ultime de Samsung avec processeur Snapdragon 8 Gen 3, écran Dynamic AMOLED 2X 120Hz, capteur photo 200 MP, stylet S-Pen intégré et cadre en titane ultra-résistant.',
    195000,
    'Smartphones & Tech',
    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    8
  ),
  (
    'Apple iPhone 15 Pro Max (256 Go - Titane Naturel)',
    '<!--PROMO:260000-->
Puce A17 Pro gravée en 3nm, téléobjectif x5 périscopique, bouton Action personnalisable, port USB-C ultra-rapide et écran Super Retina XDR toujours activé.',
    235000,
    'Smartphones & Tech',
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    5
  ),
  (
    'Casque Sans Fil Sony WH-1000XM5 ANC',
    '<!--PROMO:58000-->
La référence mondiale de la réduction de bruit active avec 8 micros, son Hi-Res sans fil LDAC, autonomie 30h avec charge ultra-rapide et confort exceptionnel.',
    49500,
    'Smartphones & Tech',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    14
  ),
  (
    'Friteuse Sans Huile Philips Airfryer XXL 7.2L',
    '<!--PROMO:42000-->
Cuisine saine et croustillante avec jusqu''à 90% d''huile en moins grâce à la technologie Rapid Air. Capacité familiale XXL de 7.2L, écran tactile et 16 programmes automatiques.',
    34000,
    'Électroménager',
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80',
    11
  ),
  (
    'Robot Pétrin Moulinex Masterchef Grande 1500W',
    '<!--PROMO:54000-->
Moteur puissant 1500W avec bol inox grande capacité 6.7L. Mouvement planétaire avec pétrin, batteur et fouet pour pains, brioches et pâtisseries maison impeccables.',
    46000,
    'Électroménager',
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80',
    6
  ),
  (
    'Machine à Café Espresso DeLonghi Dedica Deluxe',
    'Corps ultra-compact tout en acier inoxydable, pression 15 bars professionnelle, buse vapeur Cappuccino ajustable et système Thermoblock de chauffe rapide en 35 secondes.',
    29500,
    'Maison & Cuisine',
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80',
    9
  ),
  (
    'Aspirateur Balai Sans Fil Dyson V12 Detect Slim',
    '<!--PROMO:115000-->
Moteur numérique Dyson Hyperdymium puissant avec brosse optique révélant la poussière invisible, filtration HEPA à 99.99% et écran LCD affichant l''autonomie en temps réel.',
    98000,
    'Électroménager',
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80',
    4
  ),
  (
    'Baskets Nike Air Max 270 (Noir & Blanc)',
    '<!--PROMO:23000-->
L''iconique coussin d''air Air Max 270 offrant un amorti moelleux inégalé toute la journée. Tige en mesh aéré respirant et semelle extérieure en caoutchouc durable.',
    18500,
    'Mode & Chaussures',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    16
  ),
  (
    'Montre Homme Fossil Neutra Chronographe Cuir Brun',
    'Boîtier en acier inoxydable 44mm avec cadran bleu soleillé, mouvement chronographe à quartz précis et bracelet en cuir véritable avec surpiqûres élégantes.',
    17000,
    'Mode & Chaussures',
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
    7
  ),
  (
    'Lunettes de Soleil Ray-Ban Aviator Classic Polarized',
    '<!--PROMO:18500-->
Modèle légendaire RB3025 avec monture dorée ultralégère, verres minéraux polarisés G-15 offrant une protection UV400 totale et un contraste visuel parfait.',
    14500,
    'Mode & Chaussures',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    12
  ),
  (
    'Parfum Sauvage Dior Eau de Parfum 100ml',
    '<!--PROMO:31000-->
Sillage puissant et noble aux accords de bergamote de Calabre, poivre de Sichuan et absolu vanille de Papouasie. Flacon luxueux 100% authentique.',
    26500,
    'Beauté & Parfums',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
    15
  ),
  (
    'Tondeuse Cheveux & Barbe Philips Série 7000 Métal',
    'Lames DualCut en acier auto-affûtées, 14 sabots et accessoires précis pour barbe, cheveux et corps. Étanche à 100% avec autonomie 120 minutes.',
    8900,
    'Beauté & Parfums',
    'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&q=80',
    20
  ),
  (
    'Perceuse Visseuse Sans Fil Bosch Professional 18V',
    '<!--PROMO:33500-->
Moteur Brushless sans charbon endurant, couple max 50 Nm, fonction percussion pour béton et brique, livrée dans coffret L-BOXX avec 2 batteries et chargeur rapide.',
    28000,
    'Bricolage & Auto',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
    8
  ),
  (
    'Compresseur d''Air Portatif Électrique Xiaomi 2',
    'Gonflage rapide des pneus de voiture, moto, vélo et ballons. Pression jusqu''à 150 PSI avec arrêt automatique, écran numérique et lampe LED intégrée.',
    7800,
    'Bricolage & Auto',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
    18
  ),
  (
    'Enceinte Bluetooth JBL Charge 5 Étanche IP67',
    '<!--PROMO:26000-->
Son Pro original JBL puissant avec haut-parleur de graves séparé, autonomie 20 heures, certification étanche eau et poussière IP67, et fonction powerbank.',
    22500,
    'Smartphones & Tech',
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
    10
  ),
  (
    'Tapis de Course Pliable Motorisé ProForm City L6',
    '<!--PROMO:99000-->
Vitesse réglable jusqu''à 14 km/h, moteur 2.0 CHP silencieux, amorti ProShox protégeant les articulations et système de pliage compact SpaceSaver à plat.',
    85000,
    'Sport & Loisirs',
    'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80',
    2
  ),
  (
    'Montre Connectée Apple Watch Series 9 GPS 45mm',
    'Puce S9 SiP puissante, écran ultra-lumineux 2000 nits, geste Toucher deux fois, ECG certifié, capteur d''oxygène sanguin et détection des chutes.',
    68000,
    'Smartphones & Tech',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    0
  ),
  (
    'Gourde Isotherme Inox 1L Alpine Pro',
    '<!--PROMO:3800-->
Double paroi en acier inoxydable sous vide, garde les boissons froides 24h et chaudes 12h, sans BPA avec bouchon sport antifuite.',
    2900,
    'Maison & Cuisine',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    0
  )
ON CONFLICT DO NOTHING;

-- Exemple d'instructions pour promouvoir un compte admin :
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@votredomaine.com';
