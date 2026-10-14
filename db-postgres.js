const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
  }
  return pool;
}

async function initPostgresSchema() {
  const p = getPool();

  console.log('⚡ Initializing Neon PostgreSQL database schema...');

  await p.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY DEFAULT 1,
      store_name TEXT NOT NULL DEFAULT 'SURYA TEXTILES',
      store_tagline TEXT NOT NULL DEFAULT 'Premium Silks, Heritage Weaves & Ready-to-Wear Textiles',
      address TEXT NOT NULL DEFAULT '42 Fashion Promenade, 2nd Floor, Design District',
      phone TEXT NOT NULL DEFAULT '+91 98765 43210',
      email TEXT NOT NULL DEFAULT 'contact@suryatextiles.com',
      gstin TEXT NOT NULL DEFAULT '33AABCT9988C1ZR',
      currency TEXT NOT NULL DEFAULT '₹',
      tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
      invoice_prefix TEXT NOT NULL DEFAULT 'STX',
      receipt_footer TEXT NOT NULL DEFAULT 'Thank you for shopping with Surya Textiles! Exchange within 7 days with original invoice & tag intact.'
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'sparkles',
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category_id INT REFERENCES categories(id) ON DELETE SET NULL,
      gender TEXT NOT NULL,
      fabric TEXT,
      sizes TEXT NOT NULL,
      colors TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      cost_price NUMERIC(10,2) DEFAULT 0,
      stock_quantity INT NOT NULL DEFAULT 0,
      image_url TEXT,
      description TEXT,
      is_featured INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT,
      address TEXT,
      total_orders INT DEFAULT 0,
      total_spent NUMERIC(12,2) DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
      customer_name TEXT,
      customer_phone TEXT,
      subtotal NUMERIC(10,2) NOT NULL,
      discount_type TEXT DEFAULT 'percentage',
      discount_value NUMERIC(10,2) DEFAULT 0,
      discount_amount NUMERIC(10,2) DEFAULT 0,
      tax_rate NUMERIC(5,2) DEFAULT 5.00,
      tax_amount NUMERIC(10,2) DEFAULT 0,
      grand_total NUMERIC(10,2) NOT NULL,
      payment_method TEXT NOT NULL,
      cash_tendered NUMERIC(10,2) DEFAULT 0,
      change_returned NUMERIC(10,2) DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'PAID',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id SERIAL PRIMARY KEY,
      invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
      product_id INT REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      sku TEXT,
      size TEXT,
      color TEXT,
      unit_price NUMERIC(10,2) NOT NULL,
      quantity INT NOT NULL,
      line_total NUMERIC(10,2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure default admin and customer exist
  const userCountRes = await p.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(userCountRes.rows[0].count, 10) === 0) {
    const { hashPassword } = require('./auth-utils');
    const adminHash = hashPassword('admin123');
    const customerHash = hashPassword('customer123');
    await p.query(`
      INSERT INTO users (username, password_hash, name, email, phone, role)
      VALUES 
        ('admin', $1, 'Surya Admin', 'admin@suryatextiles.com', '+91 98765 43210', 'admin'),
        ('customer', $2, 'Aaradhya Sharma', 'aaradhya@example.com', '9876501234', 'customer')
      ON CONFLICT (username) DO NOTHING
    `, [adminHash, customerHash]);
    console.log('✅ Default users seeded in Neon PostgreSQL (admin/admin123, customer/customer123)');
  }

  // Ensure default settings row exists
  const settingsRes = await p.query('SELECT COUNT(*) as count FROM settings');
  if (parseInt(settingsRes.rows[0].count, 10) === 0) {
    await p.query(`
      INSERT INTO settings (id, store_name, store_tagline, address, phone, email, gstin, currency, tax_rate, invoice_prefix)
      VALUES (1, 'SURYA TEXTILES', 'Premium Silks, Heritage Weaves & Ready-to-Wear Textiles', '42 Fashion Promenade, 2nd Floor, Design District', '+91 98765 43210', 'contact@suryatextiles.com', '33AABCT9988C1ZR', '₹', 5.0, 'STX')
    `);
  }

  // Check if categories need seeding
  const catCountRes = await p.query('SELECT COUNT(*) as count FROM categories');
  if (parseInt(catCountRes.rows[0].count, 10) === 0) {
    await seedPostgresData(p);
  }
  await ensurePostgresCuratedProducts(p);

  console.log('✅ Neon PostgreSQL database schema verified and ready.');
}

async function seedPostgresData(p) {
  console.log('Seeding initial dress collections into Neon PostgreSQL...');

  const categories = [
    { name: 'Bridal & Lehengas', slug: 'bridal-lehengas', icon: 'crown', description: 'Exquisite handcrafted bridal wear & designer lehengas' },
    { name: 'Sarees & Ethnic Drapes', slug: 'sarees-ethnic', icon: 'sparkles', description: 'Heritage silk, organza, banarasi, and chiffon sarees' },
    { name: 'Evening Gowns & Western', slug: 'gowns-western', icon: 'gem', description: 'Designer evening gowns, cocktail dresses & formal couture' },
    { name: 'Suits & Anarkalis', slug: 'suits-anarkalis', icon: 'feather', description: 'Embroidered anarkalis, shararas, and designer kurta sets' },
    { name: 'Casual & Sundresses', slug: 'casual-sundresses', icon: 'sun', description: 'Breezy linen, cotton sundresses, and chic daywear' },
    { name: 'Men - Sherwanis & Ethnic', slug: 'men-sherwanis', icon: 'award', description: 'Regal sherwanis, bandhgalas, and silk kurta sets' },
    { name: 'Men - Suits & Formals', slug: 'men-suits', icon: 'briefcase', description: 'Tailored tuxedos, blazers, and luxury linen shirts' },
    { name: 'Kids & Teens Couture', slug: 'kids-couture', icon: 'heart', description: 'Adorable party frocks, festive lehengas, and boys suits' }
  ];

  for (const cat of categories) {
    await p.query(
      'INSERT INTO categories (name, slug, icon, description) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING',
      [cat.name, cat.slug, cat.icon, cat.description]
    );
  }

  const allCats = (await p.query('SELECT id, slug FROM categories')).rows;
  const catMap = {};
  for (const c of allCats) {
    catMap[c.slug] = c.id;
  }

  const dressItems = [
    {
      name: 'Royal Heritage Banarasi Silk Saree',
      sku: 'LUM-SAR-001',
      category_id: catMap['sarees-ethnic'],
      gender: 'Women',
      fabric: 'Pure Katan Silk with Gold Zari',
      sizes: 'Free Size',
      colors: 'Crimson Red, Royal Magenta, Midnight Blue',
      price: 8499,
      cost_price: 5200,
      stock_quantity: 18,
      image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      description: 'Handwoven in Varanasi with antique gold zari work and elaborate floral jaal pattern. Includes unstitched blouse piece.',
      is_featured: 1
    },
    {
      name: 'Zardozi Hand-Embroidered Bridal Lehenga',
      sku: 'LUM-LEH-002',
      category_id: catMap['bridal-lehengas'],
      gender: 'Women',
      fabric: 'Raw Silk & Hand-Dyed Organza',
      sizes: 'S, M, L, XL',
      colors: 'Deep Maroon, Ruby Scarlet, Dusty Rose',
      price: 24500,
      cost_price: 15000,
      stock_quantity: 8,
      image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      description: 'Opulent bridal masterpiece embellished with dabka, sequin, and real zardozi needlework. Comes with dual dupatta set.',
      is_featured: 1
    },
    {
      name: 'Emerald Velvet Floor-Length Evening Gown',
      sku: 'LUM-GWN-003',
      category_id: catMap['gowns-western'],
      gender: 'Women',
      fabric: 'Plush Micro Velvet with Silk Satin Lining',
      sizes: 'XS, S, M, L, XL',
      colors: 'Emerald Green, Wine Red, Onyx Black',
      price: 9999,
      cost_price: 5800,
      stock_quantity: 14,
      image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
      description: 'Dramatic mermaid silhouette with thigh-high slit, cowl neckline, and internal boned corset structure.',
      is_featured: 1
    },
    {
      name: 'Georgette Embroidered Anarkali Gown Set',
      sku: 'LUM-SUIT-004',
      category_id: catMap['suits-anarkalis'],
      gender: 'Women',
      fabric: 'Viscose Georgette with Santoon Lining',
      sizes: 'S, M, L, XL, XXL',
      colors: 'Powder Blue, Sage Green, Champagne Beige',
      price: 4599,
      cost_price: 2600,
      stock_quantity: 22,
      image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
      description: '32-kali flared anarkali suit enriched with tone-on-tone thread embroidery and mirror foil accents.',
      is_featured: 1
    },
    {
      name: 'Pleated Satin Cocktail Midi Dress',
      sku: 'LUM-DRS-005',
      category_id: catMap['gowns-western'],
      gender: 'Women',
      fabric: 'Duchess Satin',
      sizes: 'XS, S, M, L',
      colors: 'Rose Gold, Sapphire Blue, Champagne Gold',
      price: 3699,
      cost_price: 2100,
      stock_quantity: 20,
      image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
      description: 'Chic asymmetrical drape dress with sunburst knife pleating and a removable sash belt.',
      is_featured: 0
    },
    {
      name: 'Pastel Organza Hand-Painted Floral Saree',
      sku: 'LUM-SAR-006',
      category_id: catMap['sarees-ethnic'],
      gender: 'Women',
      fabric: 'Pure Sheer Organza Silk',
      sizes: 'Free Size',
      colors: 'Blush Pink, Mint Green, Lilac Violet',
      price: 5899,
      cost_price: 3300,
      stock_quantity: 12,
      image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
      description: 'Airy, featherlight pure organza saree adorned with handcrafted botanical blooms and scalloped cutwork border.',
      is_featured: 1
    },
    {
      name: 'Bohemian Tiered Ruffle Sundress',
      sku: 'LUM-CAS-007',
      category_id: catMap['casual-sundresses'],
      gender: 'Women',
      fabric: '100% Breathable Mulmul Cotton',
      sizes: 'XS, S, M, L, XL',
      colors: 'Sunflower Yellow, Terracotta Orange, Olive Green',
      price: 2199,
      cost_price: 1100,
      stock_quantity: 35,
      image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
      description: 'Relaxed tiered summer dress with adjustable spaghetti straps, smocked bodice, and tiered ruffle hem.',
      is_featured: 0
    },
    {
      name: 'Chanderi Silk Peplum Kurti with Dhoti Pants',
      sku: 'LUM-SUIT-008',
      category_id: catMap['suits-anarkalis'],
      gender: 'Women',
      fabric: 'Chanderi Silk & Modal Crepe',
      sizes: 'S, M, L, XL',
      colors: 'Mustard Yellow, Coral Peach, Teal',
      price: 3299,
      cost_price: 1750,
      stock_quantity: 16,
      image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80',
      description: 'Contemporary fusion set featuring a peplum cut kurti with zari butti work and draped pleated dhoti.',
      is_featured: 0
    },
    {
      name: 'Bespoke Italian Wool 3-Piece Tuxedo',
      sku: 'LUM-MEN-009',
      category_id: catMap['men-suits'],
      gender: 'Men',
      fabric: 'Super 130s Italian Wool & Satin Lapel',
      sizes: '38, 40, 42, 44, 46',
      colors: 'Midnight Navy, Jet Black, Charcoal Slate',
      price: 16999,
      cost_price: 10500,
      stock_quantity: 10,
      image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
      description: 'Masterfully crafted tuxedo featuring peak satin lapels, single-button closure, tailored vest, and flat-front trousers.',
      is_featured: 1
    },
    {
      name: 'Imperial Raw Silk Groom Sherwani Set',
      sku: 'LUM-MEN-010',
      category_id: catMap['men-sherwanis'],
      gender: 'Men',
      fabric: 'Handwoven Raw Silk with Pure Zari',
      sizes: '38, 40, 42, 44',
      colors: 'Ivory Gold, Royal Cream, Pale Peach',
      price: 18500,
      cost_price: 11200,
      stock_quantity: 6,
      image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
      description: 'Regal groom sherwani with intricate hand-embroidered collar, French knot work, silk stole, and churidar.',
      is_featured: 1
    },
    {
      name: 'French Linen Relaxed Resort Shirt',
      sku: 'LUM-MEN-011',
      category_id: catMap['men-suits'],
      gender: 'Men',
      fabric: '100% Normandy Pure Linen',
      sizes: 'S, M, L, XL, XXL',
      colors: 'Optic White, Sky Blue, Sand Khaki, Sage',
      price: 2299,
      cost_price: 1200,
      stock_quantity: 40,
      image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
      description: 'Pre-washed breathable linen shirt with band collar, mother-of-pearl buttons, and tailored comfort fit.',
      is_featured: 0
    },
    {
      name: 'Lucknowi Hand-Chikankari Men’s Kurta',
      sku: 'LUM-MEN-012',
      category_id: catMap['men-sherwanis'],
      gender: 'Men',
      fabric: 'Fine Cotton Silk with Shadow Work',
      sizes: '38, 40, 42, 44, 46',
      colors: 'Pearl White, Pistachio Green, Pastel Peach',
      price: 3199,
      cost_price: 1800,
      stock_quantity: 25,
      image_url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
      description: 'Intricate shadow work Chikankari hand embroidery along the yoke and sleeves. Pairs seamlessly with churidar.',
      is_featured: 0
    },
    {
      name: 'Princess Fluffy Ruffle Party Frock',
      sku: 'LUM-KID-013',
      category_id: catMap['kids-couture'],
      gender: 'Kids',
      fabric: 'Soft Satin with Multi-Layer French Net',
      sizes: '2-3Y, 4-5Y, 6-7Y, 8-9Y, 10-11Y',
      colors: 'Candy Pink, Baby Blue, Lavender',
      price: 2399,
      cost_price: 1200,
      stock_quantity: 19,
      image_url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80',
      description: 'Multi-tiered ballgown frock lined with pure breathable cotton for sensitive young skin. Features bow detail.',
      is_featured: 1
    },
    {
      name: 'Junior Brocade Kurta & Dhoti Set',
      sku: 'LUM-KID-014',
      category_id: catMap['kids-couture'],
      gender: 'Kids',
      fabric: 'Benarasi Brocade & Silk Dupion',
      sizes: '3-4Y, 5-6Y, 7-8Y, 9-10Y',
      colors: 'Royal Maroon, Golden Yellow, Peacock Blue',
      price: 2499,
      cost_price: 1300,
      stock_quantity: 15,
      image_url: 'https://images.unsplash.com/photo-1503944570908-7f218b66624a?auto=format&fit=crop&w=800&q=80',
      description: 'Festive brocade jacket with matching mandarin collar kurta and pre-stitched elasticated silk dhoti.',
      is_featured: 0
    },
    {
      name: 'Kashmiri Hand-Embroidered Velvet Cape Dress',
      sku: 'LUM-GWN-015',
      category_id: catMap['gowns-western'],
      gender: 'Women',
      fabric: 'Rich Silk Velvet with Tilla Embroidery',
      sizes: 'S, M, L, XL',
      colors: 'Burgundy Wine, Forest Green, Midnight Blue',
      price: 11499,
      cost_price: 6800,
      stock_quantity: 7,
      image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
      description: 'Royal cape silhouette with traditional Kashmiri metallic tilla needlework around the neck and cascading hem.',
      is_featured: 1
    },
    {
      name: 'Pure Linen Tiered Button-Front Shirt Dress',
      sku: 'LUM-CAS-016',
      category_id: catMap['casual-sundresses'],
      gender: 'Women',
      fabric: '100% Organic European Linen',
      sizes: 'XS, S, M, L, XL',
      colors: 'Natural Oatmeal, Crisp White, Terracotta',
      price: 2899,
      cost_price: 1550,
      stock_quantity: 28,
      image_url: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&w=800&q=80',
      description: 'Clean minimalist silhouette with tortoiseshell buttons, functional pockets, and cinching fabric tie.',
      is_featured: 0
    },
    {
      name: 'Sequined Hollywood Glamour Slit Gown',
      sku: 'LUM-GWN-017',
      category_id: catMap['gowns-western'],
      gender: 'Women',
      fabric: 'Stretch Mesh with Micro Sequins',
      sizes: 'XS, S, M, L',
      colors: 'Champagne Gold, Silver Metallic, Ruby Red',
      price: 7999,
      cost_price: 4300,
      stock_quantity: 11,
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
      description: 'Stunning red-carpet showstopper fully coated in light-catching micro sequins with an open back cut-out.',
      is_featured: 0
    },
    {
      name: 'Modern Cut Herringbone Tweed Blazer',
      sku: 'LUM-MEN-018',
      category_id: catMap['men-suits'],
      gender: 'Men',
      fabric: 'Pure Shetland Wool Tweed',
      sizes: '38, 40, 42, 44',
      colors: 'Earthy Brown, Slate Grey, Forest Green',
      price: 6899,
      cost_price: 3900,
      stock_quantity: 12,
      image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
      description: 'Structured heritage tweed blazer with genuine horn buttons, ticket pocket, and dual rear vents.',
      is_featured: 0
    }
  ];

  for (const item of dressItems) {
    await p.query(`
      INSERT INTO products (name, sku, category_id, gender, fabric, sizes, colors, price, cost_price, stock_quantity, image_url, description, is_featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (sku) DO NOTHING
    `, [
      item.name, item.sku, item.category_id, item.gender, item.fabric,
      item.sizes, item.colors, item.price, item.cost_price, item.stock_quantity,
      item.image_url, item.description, item.is_featured
    ]);
  }
}

async function ensurePostgresCuratedProducts(p) {
  try {
    const allCats = (await p.query('SELECT id, slug FROM categories')).rows;
    const catMap = {};
    for (const c of allCats) {
      catMap[c.slug] = c.id;
    }

    const extraDresses = [
      // Evening Gowns & Nightwear
      {
        name: 'Luxury Silk Charmeuse Night Gown & Robe Set',
        sku: 'LUM-NGT-019',
        category_id: catMap['gowns-western'],
        gender: 'Women',
        fabric: '100% Pure Mulberry Silk Charmeuse',
        sizes: 'XS, S, M, L',
        colors: 'Blush Pink, Pearl Ivory, Midnight Navy',
        price: 6499,
        cost_price: 3600,
        stock_quantity: 16,
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        description: 'Ultra-luxurious pure mulberry silk night gown featuring French Chantilly lace scalloped trim, adjustable straps, and coordinating silk belted kimono robe.',
        is_featured: 1
      },
      {
        name: 'Midnight Obsidian Corset Ball Gown',
        sku: 'LUM-GWN-020',
        category_id: catMap['gowns-western'],
        gender: 'Women',
        fabric: 'Multi-Tiered Tulle & Duchesse Satin',
        sizes: 'XS, S, M, L, XL',
        colors: 'Obsidian Black, Deep Violet, Midnight Teal',
        price: 14500,
        cost_price: 8500,
        stock_quantity: 6,
        image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
        description: 'Breathtaking floor-length gala ball gown featuring a hand-structured corset bodice, sweetheart plunge, and voluminous tiered tulle skirt.',
        is_featured: 1
      },
      {
        name: 'Celestial Crystal Embellished Night Gown',
        sku: 'LUM-NGT-021',
        category_id: catMap['gowns-western'],
        gender: 'Women',
        fabric: 'Featherlight Modal Satin & Lace',
        sizes: 'S, M, L, XL',
        colors: 'Celestial Silver, Rose Dust, Lavender Mist',
        price: 4999,
        cost_price: 2700,
        stock_quantity: 18,
        image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
        description: 'Dreamy flowing night gown crafted in feather-soft modal satin with crystal neckline beading and deep crossover back.',
        is_featured: 0
      },
      {
        name: 'Champagne Shimmer Backless Slip Dress',
        sku: 'LUM-GWN-022',
        category_id: catMap['gowns-western'],
        gender: 'Women',
        fabric: 'Liquid Metallic Satin',
        sizes: 'XS, S, M, L',
        colors: 'Champagne Shimmer, Bronze, Pewter',
        price: 5299,
        cost_price: 2900,
        stock_quantity: 12,
        image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
        description: 'Minimalist 90s-inspired slip gown in high-shine liquid metallic champagne satin with a cowl drape back and side slit.',
        is_featured: 0
      },
      {
        name: 'Sapphire Star Mermaid Evening Gown',
        sku: 'LUM-GWN-023',
        category_id: catMap['gowns-western'],
        gender: 'Women',
        fabric: 'Italian Crepe & Hand-set Crystals',
        sizes: 'S, M, L, XL',
        colors: 'Royal Sapphire, Ruby Red, Emerald',
        price: 12800,
        cost_price: 7400,
        stock_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&w=800&q=80',
        description: 'Deep sapphire blue mermaid silhouette with sculpted shoulder drape and crystal floral constellation embroidery along the torso.',
        is_featured: 1
      },
      {
        name: 'Blossom Silk Kimono Night Gown',
        sku: 'LUM-NGT-024',
        category_id: catMap['gowns-western'],
        gender: 'Women',
        fabric: 'Pure Raw Silk Satin',
        sizes: 'Free Size',
        colors: 'Sakura Pink, Ivory White, Jade',
        price: 4499,
        cost_price: 2400,
        stock_quantity: 14,
        image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        description: 'Graceful lounge and night gown with wide kimono bell sleeves, oriental floral hand-painting, and tie sash.',
        is_featured: 0
      },

      // Bridal & Lehengas
      {
        name: 'Royal Noor Mahal Velvet Bridal Lehenga',
        sku: 'LUM-LEH-025',
        category_id: catMap['bridal-lehengas'],
        gender: 'Women',
        fabric: 'Heritage Silk Velvet & Tissue Dupatta',
        sizes: 'Custom, S, M, L, XL',
        colors: 'Ruby Velvet, Crimson, Wine',
        price: 38900,
        cost_price: 24000,
        stock_quantity: 4,
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        description: 'Couture bridal ensemble crafted in crimson micro-velvet, featuring 3D floral zardozi embroidery, semi-precious beadwork, and pure gold tissue veil.',
        is_featured: 1
      },
      {
        name: 'Gulbahar Pastel Organza Floral Lehenga',
        sku: 'LUM-LEH-026',
        category_id: catMap['bridal-lehengas'],
        gender: 'Women',
        fabric: 'Handloom Sheer Organza & Silk Crepe',
        sizes: 'XS, S, M, L',
        colors: 'Blush Pink, Mint Mist, Peach Powder',
        price: 18999,
        cost_price: 11000,
        stock_quantity: 9,
        image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        description: 'Enchanting modern bridal lehenga with delicate resham floral blooms, pearl edge scallop border, and featherlight organza dupatta.',
        is_featured: 1
      },
      {
        name: 'Kashi Vermilion Raw Silk Wedding Lehenga',
        sku: 'LUM-LEH-027',
        category_id: catMap['bridal-lehengas'],
        gender: 'Women',
        fabric: 'Pure Banarasi Raw Silk & Zari',
        sizes: 'S, M, L, XL',
        colors: 'Vermilion Red, Sindoor Scarlet',
        price: 28500,
        cost_price: 17000,
        stock_quantity: 7,
        image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80',
        description: 'Traditional Indian wedding attire featuring auspicious vermilion red silk woven with antique gold jaal and handcrafted peacock motifs.',
        is_featured: 1
      },
      {
        name: 'Champagne Gold Crystal Reception Lehenga',
        sku: 'LUM-LEH-028',
        category_id: catMap['bridal-lehengas'],
        gender: 'Women',
        fabric: 'Metallic Mesh & Imported Crystals',
        sizes: 'S, M, L',
        colors: 'Champagne Gold, Rose Gold, Platinum',
        price: 32000,
        cost_price: 19500,
        stock_quantity: 5,
        image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
        description: 'Show-stopping reception lehenga glistening with Swarovski crystals, sequins, and metallic bead tassels, paired with off-shoulder corset blouse.',
        is_featured: 1
      },
      {
        name: 'Peacock Teal Mehendi Mirrorwork Lehenga',
        sku: 'LUM-LEH-029',
        category_id: catMap['bridal-lehengas'],
        gender: 'Women',
        fabric: 'Georgette Silk with Real Mirror Embellishment',
        sizes: 'XS, S, M, L, XL',
        colors: 'Peacock Teal, Mustard Yellow, Lime Green',
        price: 16800,
        cost_price: 9800,
        stock_quantity: 11,
        image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
        description: 'Vibrant festive lehenga illuminated with hand-stitched glass mirrorwork, contrasting thread borders, and latkan tie-ups.',
        is_featured: 0
      },
      {
        name: 'Ivory & Rose Gold Bridal Anarkali Gown',
        sku: 'LUM-LEH-030',
        category_id: catMap['bridal-lehengas'],
        gender: 'Women',
        fabric: 'Chanderi Silk & Net with Can-Can Flare',
        sizes: 'S, M, L, XL, XXL',
        colors: 'Ivory White, Soft Blush',
        price: 21999,
        cost_price: 13000,
        stock_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        description: 'Regal floor-sweeping bridal anarkali lehenga gown featuring 48 kallis, heavy gota patti borders, and scalloped net veil.',
        is_featured: 1
      },
      {
        name: 'Midnight Blue Velvet Sangeet Lehenga',
        sku: 'LUM-LEH-031',
        category_id: catMap['bridal-lehengas'],
        gender: 'Women',
        fabric: 'Deep Blue Micro Velvet & Organza',
        sizes: 'S, M, L, XL',
        colors: 'Midnight Blue, Sapphire',
        price: 26500,
        cost_price: 16000,
        stock_quantity: 6,
        image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
        description: 'Dramatic evening Sangeet lehenga in midnight sapphire velvet featuring silver pita needlework and geometric floral motifs.',
        is_featured: 0
      },

      // Sarees & Drapes
      {
        name: 'Regal Kanchipuram Gold Brocade Temple Silk Saree',
        sku: 'LUM-SAR-032',
        category_id: catMap['sarees-ethnic'],
        gender: 'Women',
        fabric: 'Pure Mulberry Silk & Korvai Gold Zari',
        sizes: 'Free Size',
        colors: 'Peacock Green, Bridal Red, Golden Yellow',
        price: 15800,
        cost_price: 9800,
        stock_quantity: 10,
        image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        description: 'Authentic Kanchipuram silk saree with interlocking korvai border, traditional temple gopuram motifs, and heavy grand zari pallu.',
        is_featured: 1
      },
      {
        name: 'Maharani Paithani Handloom Silk Saree',
        sku: 'LUM-SAR-033',
        category_id: catMap['sarees-ethnic'],
        gender: 'Women',
        fabric: 'Pure Yeola Silk & Real Zari Peacock Pallu',
        sizes: 'Free Size',
        colors: 'Royal Purple, Emerald Green, Rani Pink',
        price: 14200,
        cost_price: 8900,
        stock_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        description: 'Heirloom Maharashtra Paithani saree with kaleidoscope peacock motifs woven on pure gold tissue pallu and muniya border.',
        is_featured: 1
      },
      {
        name: 'Chanderi Tissue Metallic Gold Festive Saree',
        sku: 'LUM-SAR-034',
        category_id: catMap['sarees-ethnic'],
        gender: 'Women',
        fabric: 'Silk Tissue with Micro Zari Weave',
        sizes: 'Free Size',
        colors: 'Metallic Gold, Silver Mist, Copper',
        price: 6499,
        cost_price: 3800,
        stock_quantity: 15,
        image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        description: 'Luminous metallic gold Chanderi tissue drape with delicate hand-block accents and hand-rolled edging.',
        is_featured: 0
      },
      {
        name: 'Tussar Georgette Kashmiri Tilla Saree',
        sku: 'LUM-SAR-035',
        category_id: catMap['sarees-ethnic'],
        gender: 'Women',
        fabric: 'Pure Tussar Georgette Silk',
        sizes: 'Free Size',
        colors: 'Oatmeal Beige, Dusty Rose, Powder Blue',
        price: 9800,
        cost_price: 5800,
        stock_quantity: 9,
        image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80',
        description: 'Textured handloom Tussar georgette embellished with Kashmiri metallic tilla needlework around the scalloped borders.',
        is_featured: 1
      },
      {
        name: 'Crimson Wedding Katan Silk Saree',
        sku: 'LUM-SAR-036',
        category_id: catMap['sarees-ethnic'],
        gender: 'Women',
        fabric: 'Double-Twisted Pure Katan Silk',
        sizes: 'Free Size',
        colors: 'Auspicious Crimson, Sindoor Red',
        price: 18500,
        cost_price: 11000,
        stock_quantity: 7,
        image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        description: 'Grand bridal heritage weave adorned with an elaborate shikargah animal & vine jaal, symbolizing royalty and auspiciousness.',
        is_featured: 1
      },
      {
        name: 'Midnight Black & Gold Banarasi Tanchoi Saree',
        sku: 'LUM-SAR-037',
        category_id: catMap['sarees-ethnic'],
        gender: 'Women',
        fabric: 'Pure Silk Tanchoi Jacquard',
        sizes: 'Free Size',
        colors: 'Jet Black with Antique Gold',
        price: 7899,
        cost_price: 4500,
        stock_quantity: 14,
        image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
        description: 'Sophisticated evening drape woven using the ancient satin tanchoi technique, creating an embossed dual-color floral tapestry.',
        is_featured: 0
      },

      // Men's Couture
      {
        name: 'Royal Jodhpur Velvet Bandhgala Suit',
        sku: 'LUM-MEN-038',
        category_id: catMap['men-sherwanis'],
        gender: 'Men',
        fabric: 'Plush Silk Velvet & Metal Buttons',
        sizes: '38, 40, 42, 44, 46',
        colors: 'Midnight Navy, Royal Wine, Black',
        price: 13999,
        cost_price: 8200,
        stock_quantity: 9,
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        description: 'Structured aristocratic Bandhgala jacket crafted in midnight navy velvet, detailed with hand-engraved crest buttons and bespoke trousers.',
        is_featured: 1
      },
      {
        name: 'Ivory & Antique Gold Indo-Western Achkan',
        sku: 'LUM-MEN-039',
        category_id: catMap['men-sherwanis'],
        gender: 'Men',
        fabric: 'Raw Silk with Angrakha Overlap',
        sizes: '38, 40, 42, 44',
        colors: 'Ivory Cream with Antique Gold',
        price: 15400,
        cost_price: 9200,
        stock_quantity: 8,
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        description: 'Contemporary asymmetrical angrakha cut jacket featuring antique zardozi piping, mother-of-pearl buttons, and cowl dhoti.',
        is_featured: 1
      },
      {
        name: 'Royal Maharaja Brocade Sherwani with Stole',
        sku: 'LUM-MEN-040',
        category_id: catMap['men-sherwanis'],
        gender: 'Men',
        fabric: 'Varanasi Silk Brocade with Hand Zari',
        sizes: '38, 40, 42, 44',
        colors: 'Imperial Gold, Royal Maroon',
        price: 22500,
        cost_price: 13500,
        stock_quantity: 5,
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
        description: 'Fit for royalty — heavy Banarasi brocade sherwani accompanied by an embroidered silk stole and coordinating safa fabric.',
        is_featured: 1
      },
      {
        name: 'Cashmere Wool Charcoal Tuxedo with Shawl Collar',
        sku: 'LUM-MEN-041',
        category_id: catMap['men-suits'],
        gender: 'Men',
        fabric: 'Italian Cashmere-Wool Blend & Grosgrain Silk',
        sizes: '38, 40, 42, 44, 46',
        colors: 'Charcoal Black, Midnight Noir',
        price: 19800,
        cost_price: 12000,
        stock_quantity: 6,
        image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
        description: 'Sleek black-tie dinner jacket with curved shawl collar in grosgrain silk, satin-covered buttons, and tailored trousers.',
        is_featured: 1
      }
    ];

    for (const item of extraDresses) {
      if (!item.category_id) continue;
      await p.query(`
        INSERT INTO products (name, sku, category_id, gender, fabric, sizes, colors, price, cost_price, stock_quantity, image_url, description, is_featured)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (sku) DO NOTHING
      `, [
        item.name, item.sku, item.category_id, item.gender, item.fabric,
        item.sizes, item.colors, item.price, item.cost_price, item.stock_quantity,
        item.image_url, item.description, item.is_featured
      ]);
    }
  } catch (err) {
    console.error('Error ensuring curated products in Neon PostgreSQL:', err.message);
  }
}

const PostgresDatabase = {
  async getSettings() {
    const res = await getPool().query('SELECT * FROM settings WHERE id = 1');
    return res.rows[0] || {};
  },

  async updateSettings(data) {
    const query = `
      UPDATE settings SET
        store_name = $1,
        store_tagline = $2,
        address = $3,
        phone = $4,
        email = $5,
        gstin = $6,
        currency = $7,
        tax_rate = $8,
        invoice_prefix = $9,
        receipt_footer = $10
      WHERE id = 1
      RETURNING *
    `;
    const res = await getPool().query(query, [
      data.store_name,
      data.store_tagline,
      data.address,
      data.phone,
      data.email,
      data.gstin,
      data.currency,
      Number(data.tax_rate),
      data.invoice_prefix,
      data.receipt_footer
    ]);
    return res.rows[0];
  },

  async getCategories() {
    const res = await getPool().query('SELECT * FROM categories ORDER BY name ASC');
    return res.rows;
  },

  async getProducts(filters = {}) {
    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.fabric ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    if (filters.category_id) {
      params.push(filters.category_id);
      sql += ` AND p.category_id = $${params.length}`;
    }

    if (filters.gender && filters.gender !== 'All') {
      params.push(filters.gender);
      sql += ` AND p.gender = $${params.length}`;
    }

    if (filters.featured) {
      sql += ` AND p.is_featured = 1`;
    }

    if (filters.sort === 'price_asc') {
      sql += ` ORDER BY p.price ASC`;
    } else if (filters.sort === 'price_desc') {
      sql += ` ORDER BY p.price DESC`;
    } else if (filters.sort === 'name_asc') {
      sql += ` ORDER BY p.name ASC`;
    } else {
      sql += ` ORDER BY p.id DESC`;
    }

    const res = await getPool().query(sql, params);
    return res.rows;
  },

  async getProductById(id) {
    const res = await getPool().query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);
    return res.rows[0];
  },

  async createProduct(item) {
    let sku = item.sku;
    if (!sku) {
      const countRes = await getPool().query('SELECT COUNT(*) as count FROM products');
      const count = parseInt(countRes.rows[0].count, 10) + 1;
      sku = `LUM-DRS-${String(count).padStart(3, '0')}`;
    }

    const sql = `
      INSERT INTO products (name, sku, category_id, gender, fabric, sizes, colors, price, cost_price, stock_quantity, image_url, description, is_featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const res = await getPool().query(sql, [
      item.name,
      sku,
      item.category_id ? Number(item.category_id) : null,
      item.gender || 'Women',
      item.fabric || '',
      item.sizes || 'Free Size',
      item.colors || 'Multi',
      Number(item.price),
      Number(item.cost_price || 0),
      Number(item.stock_quantity || 0),
      item.image_url || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
      item.description || '',
      item.is_featured ? 1 : 0
    ]);
    return res.rows[0];
  },

  async updateProduct(id, item) {
    const sql = `
      UPDATE products SET
        name = $1,
        sku = $2,
        category_id = $3,
        gender = $4,
        fabric = $5,
        sizes = $6,
        colors = $7,
        price = $8,
        cost_price = $9,
        stock_quantity = $10,
        image_url = $11,
        description = $12,
        is_featured = $13
      WHERE id = $14
      RETURNING *
    `;
    const res = await getPool().query(sql, [
      item.name,
      item.sku,
      item.category_id ? Number(item.category_id) : null,
      item.gender,
      item.fabric,
      item.sizes,
      item.colors,
      Number(item.price),
      Number(item.cost_price || 0),
      Number(item.stock_quantity || 0),
      item.image_url,
      item.description,
      item.is_featured ? 1 : 0,
      id
    ]);
    return res.rows[0];
  },

  async deleteProduct(id) {
    return await getPool().query('DELETE FROM products WHERE id = $1', [id]);
  },

  async getCustomers(search = '') {
    if (search) {
      const res = await getPool().query(`
        SELECT * FROM customers
        WHERE name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1
        ORDER BY total_orders DESC LIMIT 20
      `, [`%${search}%`]);
      return res.rows;
    }
    const res = await getPool().query('SELECT * FROM customers ORDER BY total_spent DESC LIMIT 50');
    return res.rows;
  },

  async findOrCreateCustomer(name, phone, email = '', address = '') {
    if (!phone && !name) return null;
    const p = getPool();
    let customer = null;
    if (phone) {
      const existing = await p.query('SELECT * FROM customers WHERE phone = $1', [phone]);
      if (existing.rows.length > 0) customer = existing.rows[0];
    }
    if (!customer && name) {
      const res = await p.query(`
        INSERT INTO customers (name, phone, email, address)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [name, phone || null, email || null, address || null]);
      customer = res.rows[0];
    }
    return customer;
  },

  async getNextInvoiceNumber() {
    const settings = await this.getSettings();
    const countRes = await getPool().query('SELECT COUNT(*) as count FROM invoices');
    const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
    const year = new Date().getFullYear();
    return `${settings.invoice_prefix || 'LUM'}-${year}-${String(nextSeq).padStart(4, '0')}`;
  },

  async createInvoice(billData) {
    const settings = await this.getSettings();
    const invoiceNumber = await this.getNextInvoiceNumber();
    const p = getPool();

    let subtotal = 0;
    for (const item of billData.items) {
      subtotal += Number(item.unit_price) * Number(item.quantity);
    }

    const discountType = billData.discount_type || 'percentage';
    const discountVal = Number(billData.discount_value) || 0;
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discountVal) / 100;
    } else {
      discountAmount = Math.min(discountVal, subtotal);
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxRate = Number(settings.tax_rate) || 5.0;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

    let customerId = null;
    if (billData.customer_name || billData.customer_phone) {
      const cust = await this.findOrCreateCustomer(
        billData.customer_name || 'Walk-in Guest',
        billData.customer_phone || ''
      );
      if (cust) customerId = cust.id;
    }

    const cashTendered = Number(billData.cash_tendered) || grandTotal;
    const changeReturned = Math.max(0, cashTendered - grandTotal);

    const invSql = `
      INSERT INTO invoices (
        invoice_number, customer_id, customer_name, customer_phone,
        subtotal, discount_type, discount_value, discount_amount,
        tax_rate, tax_amount, grand_total, payment_method,
        cash_tendered, change_returned, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const invRes = await p.query(invSql, [
      invoiceNumber,
      customerId,
      billData.customer_name || 'Walk-in Guest',
      billData.customer_phone || '',
      subtotal,
      discountType,
      discountVal,
      discountAmount,
      taxRate,
      taxAmount,
      grandTotal,
      billData.payment_method || 'Cash',
      cashTendered,
      changeReturned,
      billData.notes || '',
      'PAID'
    ]);

    const invoiceId = invRes.rows[0].id;

    for (const item of billData.items) {
      const lineTotal = Number(item.unit_price) * Number(item.quantity);
      await p.query(`
        INSERT INTO invoice_items (
          invoice_id, product_id, product_name, sku, size, color,
          unit_price, quantity, line_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        invoiceId,
        item.product_id ? Number(item.product_id) : null,
        item.product_name,
        item.sku || '',
        item.size || 'Free Size',
        item.color || '',
        Number(item.unit_price),
        Number(item.quantity),
        lineTotal
      ]);

      if (item.product_id) {
        await p.query(`
          UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2
        `, [Number(item.quantity), Number(item.product_id)]);
      }
    }

    if (customerId) {
      await p.query(`
        UPDATE customers
        SET total_orders = total_orders + 1,
            total_spent = total_spent + $1
        WHERE id = $2
      `, [grandTotal, customerId]);
    }

    return await this.getInvoiceById(invoiceId);
  },

  async getInvoiceById(id) {
    const p = getPool();
    const invRes = await p.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invRes.rows.length === 0) return null;

    const itemsRes = await p.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
    const settings = await this.getSettings();

    return {
      ...invRes.rows[0],
      items: itemsRes.rows,
      settings
    };
  },

  async getInvoices(filters = {}) {
    let sql = `SELECT * FROM invoices WHERE 1=1`;
    const params = [];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      sql += ` AND (invoice_number ILIKE $${params.length} OR customer_name ILIKE $${params.length} OR customer_phone ILIKE $${params.length})`;
    }

    if (filters.date) {
      params.push(filters.date);
      sql += ` AND DATE(created_at) = DATE($${params.length})`;
    }

    sql += ` ORDER BY id DESC LIMIT 100`;
    const res = await getPool().query(sql, params);
    return res.rows;
  },

  async getAnalytics() {
    const p = getPool();

    const revRes = await p.query('SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices');
    const billsRes = await p.query('SELECT COUNT(*) as count FROM invoices');
    const dressesRes = await p.query('SELECT COUNT(*) as count FROM products');
    const stockRes = await p.query('SELECT COALESCE(SUM(stock_quantity), 0) as count FROM products');

    const todayRes = await p.query(`
      SELECT
        COALESCE(SUM(grand_total), 0) as today_revenue,
        COUNT(*) as today_bills
      FROM invoices
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    const topDressesRes = await p.query(`
      SELECT
        product_name,
        SUM(quantity) as units_sold,
        SUM(line_total) as total_sales
      FROM invoice_items
      GROUP BY product_name
      ORDER BY units_sold DESC
      LIMIT 5
    `);

    const lowStockRes = await p.query(`
      SELECT id, name, sku, stock_quantity, price
      FROM products
      WHERE stock_quantity <= 5
      ORDER BY stock_quantity ASC
      LIMIT 6
    `);

    const paymentRes = await p.query(`
      SELECT payment_method, COUNT(*) as count, SUM(grand_total) as total
      FROM invoices
      GROUP BY payment_method
    `);

    return {
      total_revenue: parseFloat(revRes.rows[0].total) || 0,
      total_bills: parseInt(billsRes.rows[0].count, 10) || 0,
      total_dresses: parseInt(dressesRes.rows[0].count, 10) || 0,
      total_stock: parseInt(stockRes.rows[0].count, 10) || 0,
      today_revenue: parseFloat(todayRes.rows[0].today_revenue) || 0,
      today_bills: parseInt(todayRes.rows[0].today_bills, 10) || 0,
      top_dresses: topDressesRes.rows.map(r => ({
        product_name: r.product_name,
        units_sold: parseInt(r.units_sold, 10),
        total_sales: parseFloat(r.total_sales)
      })),
      low_stock_items: lowStockRes.rows,
      payment_breakdown: paymentRes.rows.map(r => ({
        payment_method: r.payment_method,
        count: parseInt(r.count, 10),
        total: parseFloat(r.total)
      }))
    };
  },

  // Authentication & User Management
  async getUserByUsername(username) {
    if (!username) return null;
    const p = getPool();
    const res = await p.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
    return res.rows[0] || null;
  },

  async getUserById(id) {
    const p = getPool();
    const res = await p.query('SELECT id, username, name, email, phone, role, created_at FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async createUser({ username, password, name, email = '', phone = '', role = 'customer' }) {
    const p = getPool();
    const cleanUsername = username.trim().toLowerCase();

    // Enforce unique username
    const existing = await this.getUserByUsername(cleanUsername);
    if (existing) {
      const err = new Error(`Username "${username}" is already taken. Please choose another username.`);
      err.code = 'USER_EXISTS';
      throw err;
    }

    const { hashPassword } = require('./auth-utils');
    const passwordHash = hashPassword(password);
    const assignedRole = role === 'admin' ? 'admin' : 'customer';

    const res = await p.query(`
      INSERT INTO users (username, password_hash, name, email, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, name, email, phone, role, created_at
    `, [cleanUsername, passwordHash, name.trim(), (email || '').trim(), (phone || '').trim(), assignedRole]);

    return res.rows[0];
  },

  async verifyUser(username, password) {
    if (!username || !password) return null;
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const { verifyPassword } = require('./auth-utils');
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) return null;

    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  async getAllUsers() {
    const p = getPool();
    const res = await p.query('SELECT id, username, name, email, phone, role, created_at FROM users ORDER BY id ASC');
    return res.rows;
  }
};

module.exports = {
  PostgresDatabase,
  initPostgresSchema
};
