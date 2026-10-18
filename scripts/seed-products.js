const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://osljdnfertcrkunnavpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbGpkbmZlcnRjcmt1bm5hdnB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjMwOTcwNSwiZXhwIjoyMTA3ODg1NzA1fQ._SJLT8DYubFK60J7Wovw5O7_FO3s-CdfViRKjiwSAUY';

const client = createClient(supabaseUrl, supabaseKey);

const REAL_PRODUCTS = [
  {
    name: 'Samsung Galaxy S24 Ultra (512 Go - Gris Titane)',
    category: 'Smartphones & Tech',
    price: 195000,
    original_price: 225000,
    description: 'Le fleuron ultime de Samsung avec processeur Snapdragon 8 Gen 3, écran Dynamic AMOLED 2X 120Hz, capteur photo 200 MP, stylet S-Pen intégré et cadre en titane ultra-résistant.',
    image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    stock: 8
  },
  {
    name: 'Apple iPhone 15 Pro Max (256 Go - Titane Naturel)',
    category: 'Smartphones & Tech',
    price: 235000,
    original_price: 260000,
    description: 'Puce A17 Pro gravée en 3nm, téléobjectif x5 périscopique, bouton Action personnalisable, port USB-C ultra-rapide et écran Super Retina XDR toujours activé.',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    stock: 5
  },
  {
    name: 'Casque Sans Fil Sony WH-1000XM5 ANC',
    category: 'Smartphones & Tech',
    price: 49500,
    original_price: 58000,
    description: 'La référence mondiale de la réduction de bruit active avec 8 micros, son Hi-Res sans fil LDAC, autonomie 30h avec charge ultra-rapide et confort exceptionnel.',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    stock: 14
  },
  {
    name: 'Friteuse Sans Huile Philips Airfryer XXL 7.2L',
    category: 'Électroménager',
    price: 34000,
    original_price: 42000,
    description: 'Cuisine saine et croustillante avec jusqu\'à 90% d\'huile en moins grâce à la technologie Rapid Air. Capacité familiale XXL de 7.2L, écran tactile et 16 programmes automatiques.',
    image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80',
    stock: 11
  },
  {
    name: 'Robot Pétrin Moulinex Masterchef Grande 1500W',
    category: 'Électroménager',
    price: 46000,
    original_price: 54000,
    description: 'Moteur puissant 1500W avec bol inox grande capacité 6.7L. Mouvement planétaire avec pétrin, batteur et fouet pour pains, brioches et pâtisseries maison impeccables.',
    image_url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&q=80',
    stock: 6
  },
  {
    name: 'Machine à Café Espresso DeLonghi Dedica Deluxe',
    category: 'Maison & Cuisine',
    price: 29500,
    original_price: null,
    description: 'Corps ultra-compact tout en acier inoxydable, pression 15 bars professionnelle, buse vapeur Cappuccino ajustable et système Thermoblock de chauffe rapide en 35 secondes.',
    image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80',
    stock: 9
  },
  {
    name: 'Aspirateur Balai Sans Fil Dyson V12 Detect Slim',
    category: 'Électroménager',
    price: 98000,
    original_price: 115000,
    description: 'Moteur numérique Dyson Hyperdymium puissant avec brosse optique révélant la poussière invisible, filtration HEPA à 99.99% et écran LCD affichant l\'autonomie en temps réel.',
    image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&q=80',
    stock: 4
  },
  {
    name: 'Baskets Nike Air Max 270 (Noir & Blanc)',
    category: 'Mode & Chaussures',
    price: 18500,
    original_price: 23000,
    description: 'L\'iconique coussin d\'air Air Max 270 offrant un amorti moelleux inégalé toute la journée. Tige en mesh aéré respirant et semelle extérieure en caoutchouc durable.',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    stock: 16
  },
  {
    name: 'Montre Homme Fossil Neutra Chronographe Cuir Brun',
    category: 'Mode & Chaussures',
    price: 17000,
    original_price: null,
    description: 'Boîtier en acier inoxydable 44mm avec cadran bleu soleillé, mouvement chronographe à quartz précis et bracelet en cuir véritable avec surpiqûres élégantes.',
    image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
    stock: 7
  },
  {
    name: 'Lunettes de Soleil Ray-Ban Aviator Classic Polarized',
    category: 'Mode & Chaussures',
    price: 14500,
    original_price: 18500,
    description: 'Modèle légendaire RB3025 avec monture dorée ultralégère, verres minéraux polarisés G-15 offrant une protection UV400 totale et un contraste visuel parfait.',
    image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
    stock: 12
  },
  {
    name: 'Parfum Sauvage Dior Eau de Parfum 100ml',
    category: 'Beauté & Parfums',
    price: 26500,
    original_price: 31000,
    description: 'Sillage puissant et noble aux accords de bergamote de Calabre, poivre de Sichuan et absolu vanille de Papouasie. Flacon luxueux 100% authentique.',
    image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
    stock: 15
  },
  {
    name: 'Tondeuse Cheveux & Barbe Philips Série 7000 Métal',
    category: 'Beauté & Parfums',
    price: 8900,
    original_price: null,
    description: 'Lames DualCut en acier auto-affûtées, 14 sabots et accessoires précis pour barbe, cheveux et corps. Étanche à 100% avec autonomie 120 minutes.',
    image_url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&q=80',
    stock: 20
  },
  {
    name: 'Perceuse Visseuse Sans Fil Bosch Professional 18V',
    category: 'Bricolage & Auto',
    price: 28000,
    original_price: 33500,
    description: 'Moteur Brushless sans charbon endurant, couple max 50 Nm, fonction percussion pour béton et brique, livrée dans coffret L-BOXX avec 2 batteries et chargeur rapide.',
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
    stock: 8
  },
  {
    name: 'Compresseur d\'Air Portatif Électrique Xiaomi 2',
    category: 'Bricolage & Auto',
    price: 7800,
    original_price: null,
    description: 'Gonflage rapide des pneus de voiture, moto, vélo et ballons. Pression jusqu\'à 150 PSI avec arrêt automatique, écran numérique et lampe LED intégrée.',
    image_url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
    stock: 18
  },
  {
    name: 'Enceinte Bluetooth JBL Charge 5 Étanche IP67',
    category: 'Smartphones & Tech',
    price: 22500,
    original_price: 26000,
    description: 'Son Pro original JBL puissant avec haut-parleur de graves séparé, autonomie 20 heures, certification étanche eau et poussière IP67, et fonction powerbank.',
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
    stock: 10
  },
  {
    name: 'Tapis de Course Pliable Motorisé ProForm City L6',
    category: 'Sport & Loisirs',
    price: 85000,
    original_price: 99000,
    description: 'Vitesse réglable jusqu\'à 14 km/h, moteur 2.0 CHP silencieux, amorti ProShox protégeant les articulations et système de pliage compact SpaceSaver à plat.',
    image_url: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80',
    stock: 2
  },
  {
    name: 'Montre Connectée Apple Watch Series 9 GPS 45mm',
    category: 'Smartphones & Tech',
    price: 68000,
    original_price: null,
    description: 'Puce S9 SiP puissante, écran ultra-lumineux 2000 nits, geste Toucher deux fois, ECG certifié, capteur d\'oxygène sanguin et détection des chutes.',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    stock: 0
  },
  {
    name: 'Gourde Isotherme Inox 1L Alpine Pro',
    category: 'Maison & Cuisine',
    price: 2900,
    original_price: 3800,
    description: 'Double paroi en acier inoxydable sous vide, garde les boissons froides 24h et chaudes 12h, sans BPA avec bouchon sport antifuite.',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    stock: 0
  }
];

async function seed() {
  console.log('1. Nettoyage des anciens produits de démonstration...');
  const { error: delErr } = await client.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) {
    console.warn('Avertissement suppression:', delErr.message);
  } else {
    console.log('Anciens produits supprimés avec succès.');
  }

  console.log('2. Insertion des 18 vrais produits dans Supabase...');
  const rowsToInsert = REAL_PRODUCTS.map(p => {
    let desc = p.description;
    if (p.original_price && p.original_price > p.price) {
      desc = '<!--PROMO:' + p.original_price + '-->\n' + desc;
    }
    return {
      name: p.name,
      description: desc,
      price: p.price,
      category: p.category,
      image_url: p.image_url,
      stock: p.stock
    };
  });

  const { data, error } = await client.from('products').insert(rowsToInsert).select();
  if (error) {
    console.error('Erreur insertion Supabase:', error);
  } else {
    console.log(`Succès : ${data.length} vrais produits insérés dans Supabase !`);
  }
}

seed();
