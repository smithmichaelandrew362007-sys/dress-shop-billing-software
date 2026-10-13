require('dotenv').config();

const isPostgres = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');

if (isPostgres) {
  console.log('☁️ [Database] DATABASE_URL detected: Connecting to Neon Cloud PostgreSQL...');
  const { PostgresDatabase, initPostgresSchema } = require('./db-postgres');
  initPostgresSchema().catch(err => {
    console.error('❌ Failed to connect to Neon PostgreSQL:', err.message);
  });
  module.exports = PostgresDatabase;
  return;
}

console.log('💾 [Database] Using local SQLite database (data/boutique.db).');
console.log('💡 [Tip] To connect to Neon PostgreSQL, add DATABASE_URL=... to your .env file or Vercel Environment Variables.');

const path = require('node:path');
const fs = require('node:fs');

// Ensure data directory exists (use /tmp on Vercel if needed)
let dataDir = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
try {
  if (process.versions && process.versions.electron) {
    const electronPkg = 'electron';
    const electron = require(electronPkg);
    const app = electron.app;
    if (app && app.isPackaged) {
      dataDir = path.join(app.getPath('userData'), 'data');
    }
  }
} catch (e) {
  // Standalone node environment
}

let db = null;
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = path.join(dataDir, 'boutique.db');
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
} catch (sqliteErr) {
  console.warn('⚠️ SQLite could not be initialized:', sqliteErr.message);
  if (process.env.VERCEL) {
    console.warn('💡 On Vercel, please configure DATABASE_URL in Project Settings -> Environment Variables to connect to Neon PostgreSQL.');
  }
}

function initSchema() {
  if (!db) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      store_name TEXT NOT NULL DEFAULT 'LUMIÈRE ATELIER',
      store_tagline TEXT NOT NULL DEFAULT 'Haute Couture & Ready-to-Wear Boutique',
      address TEXT NOT NULL DEFAULT '42 Fashion Promenade, 2nd Floor, Design District',
      phone TEXT NOT NULL DEFAULT '+91 98765 43210',
      email TEXT NOT NULL DEFAULT 'concierge@lumiereatelier.com',
      gstin TEXT NOT NULL DEFAULT '33AABCT9988C1ZR',
      currency TEXT NOT NULL DEFAULT '₹',
      tax_rate REAL NOT NULL DEFAULT 5.0,
      invoice_prefix TEXT NOT NULL DEFAULT 'LUM',
      receipt_footer TEXT NOT NULL DEFAULT 'Thank you for shopping with Lumière Atelier! Exchange within 7 days with original invoice & tag intact.'
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'sparkles',
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      category_id INTEGER,
      gender TEXT NOT NULL,
      fabric TEXT,
      sizes TEXT NOT NULL,
      colors TEXT NOT NULL,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      description TEXT,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT,
      address TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      customer_name TEXT,
      customer_phone TEXT,
      subtotal REAL NOT NULL,
      discount_type TEXT DEFAULT 'percentage',
      discount_value REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 5.0,
      tax_amount REAL DEFAULT 0,
      grand_total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      cash_tendered REAL DEFAULT 0,
      change_returned REAL DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'PAID',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      sku TEXT,
      size TEXT,
      color TEXT,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // Ensure default settings row exists
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    db.prepare(`
      INSERT INTO settings (id, store_name, store_tagline, address, phone, email, gstin, currency, tax_rate, invoice_prefix)
      VALUES (1, 'LUMIÈRE ATELIER', 'Haute Couture & Ready-to-Wear Boutique', '42 Fashion Promenade, 2nd Floor, Design District', '+91 98765 43210', 'concierge@lumiereatelier.com', '33AABCT9988C1ZR', '₹', 5.0, 'LUM')
    `).run();
  }

  seedDataIfEmpty();
}

function seedDataIfEmpty() {
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catCount.count > 0) return;

  console.log('Seeding initial dress categories and luxury dress catalog...');

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

  const insertCat = db.prepare('INSERT INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)');
  for (const cat of categories) {
    insertCat.run(cat.name, cat.slug, cat.icon, cat.description);
  }

  // Get category IDs
  const allCats = db.prepare('SELECT id, slug FROM categories').all();
  const catMap = {};
  for (const c of allCats) {
    catMap[c.slug] = c.id;
  }

  // Curated high quality dress items
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

  const insertProd = db.prepare(`
    INSERT INTO products (name, sku, category_id, gender, fabric, sizes, colors, price, cost_price, stock_quantity, image_url, description, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of dressItems) {
    insertProd.run(
      item.name,
      item.sku,
      item.category_id,
      item.gender,
      item.fabric,
      item.sizes,
      item.colors,
      item.price,
      item.cost_price,
      item.stock_quantity,
      item.image_url,
      item.description,
      item.is_featured
    );
  }

  // Pre-seed a few sample customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, email, address, total_orders, total_spent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertCustomer.run('Aaradhya Sharma', '9876501234', 'aaradhya@example.com', 'Flat 402, Highgrove Towers, Metro City', 2, 28498);
  insertCustomer.run('Vikramaditya Roy', '9811122334', 'vikram@example.com', 'Villa 12, Palm Meadows, Bangalore', 1, 16999);
  insertCustomer.run('Pooja Singhania', '9988776655', 'pooja@example.com', '7A Richmond Road, Kolkata', 3, 42197);

  // Pre-seed an initial sample completed invoice so the invoice & analytics screens immediately look populated and active
  const insertInv = db.prepare(`
    INSERT INTO invoices (invoice_number, customer_id, customer_name, customer_phone, subtotal, discount_type, discount_value, discount_amount, tax_rate, tax_amount, grand_total, payment_method, cash_tendered, change_returned, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const invRes = insertInv.run(
    'LUM-2026-0001',
    1,
    'Aaradhya Sharma',
    '9876501234',
    18498,
    'percentage',
    10,
    1849.80,
    5.0,
    832.41,
    17480.61,
    'UPI',
    17480.61,
    0,
    'Wedding reception ensemble purchase',
    'PAID'
  );

  const invId = invRes.lastInsertRowid;
  const insertInvItem = db.prepare(`
    INSERT INTO invoice_items (invoice_id, product_id, product_name, sku, size, color, unit_price, quantity, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertInvItem.run(invId, 1, 'Royal Heritage Banarasi Silk Saree', 'LUM-SAR-001', 'Free Size', 'Crimson Red', 8499, 1, 8499);
  insertInvItem.run(invId, 3, 'Emerald Velvet Floor-Length Evening Gown', 'LUM-GWN-003', 'M', 'Emerald Green', 9999, 1, 9999);

  console.log('Database initialized and seeded successfully.');
}

// Helper methods for queries
const Database = {
  // Settings
  getSettings() {
    return db.prepare('SELECT * FROM settings WHERE id = 1').get();
  },
  updateSettings(data) {
    const stmt = db.prepare(`
      UPDATE settings SET
        store_name = ?,
        store_tagline = ?,
        address = ?,
        phone = ?,
        email = ?,
        gstin = ?,
        currency = ?,
        tax_rate = ?,
        invoice_prefix = ?,
        receipt_footer = ?
      WHERE id = 1
    `);
    return stmt.run(
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
    );
  },

  // Categories
  getCategories() {
    return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  },

  // Products
  getProducts(filters = {}) {
    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.fabric LIKE ? OR p.description LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    if (filters.category_id) {
      sql += ` AND p.category_id = ?`;
      params.push(filters.category_id);
    }

    if (filters.gender && filters.gender !== 'All') {
      sql += ` AND p.gender = ?`;
      params.push(filters.gender);
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

    return db.prepare(sql).all(...params);
  },

  getProductById(id) {
    return db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
  },

  createProduct(item) {
    // Generate SKU if missing
    let sku = item.sku;
    if (!sku) {
      const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count + 1;
      sku = `LUM-DRS-${String(count).padStart(3, '0')}`;
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, sku, category_id, gender, fabric, sizes, colors, price, cost_price, stock_quantity, image_url, description, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
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
    );

    return this.getProductById(result.lastInsertRowid);
  },

  updateProduct(id, item) {
    const stmt = db.prepare(`
      UPDATE products SET
        name = ?,
        sku = ?,
        category_id = ?,
        gender = ?,
        fabric = ?,
        sizes = ?,
        colors = ?,
        price = ?,
        cost_price = ?,
        stock_quantity = ?,
        image_url = ?,
        description = ?,
        is_featured = ?
      WHERE id = ?
    `);

    stmt.run(
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
    );

    return this.getProductById(id);
  },

  deleteProduct(id) {
    return db.prepare('DELETE FROM products WHERE id = ?').run(id);
  },

  // Customers
  getCustomers(search = '') {
    if (search) {
      return db.prepare(`
        SELECT * FROM customers
        WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
        ORDER BY total_orders DESC LIMIT 20
      `).all(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    return db.prepare('SELECT * FROM customers ORDER BY total_spent DESC LIMIT 50').all();
  },

  findOrCreateCustomer(name, phone, email = '', address = '') {
    if (!phone && !name) return null;
    let customer = null;
    if (phone) {
      customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
    }
    if (!customer && name) {
      const stmt = db.prepare(`
        INSERT INTO customers (name, phone, email, address)
        VALUES (?, ?, ?, ?)
      `);
      const res = stmt.run(name, phone || null, email || null, address || null);
      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(res.lastInsertRowid);
    }
    return customer;
  },

  // Invoices & Billing
  getNextInvoiceNumber() {
    const settings = this.getSettings();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
    const nextSeq = countRow.count + 1;
    const year = new Date().getFullYear();
    return `${settings.invoice_prefix || 'LUM'}-${year}-${String(nextSeq).padStart(4, '0')}`;
  },

  createInvoice(billData) {
    // billData: { customer_name, customer_phone, items: [...], discount_type, discount_value, payment_method, cash_tendered, notes }
    const settings = this.getSettings();
    const invoiceNumber = this.getNextInvoiceNumber();

    // Calculate totals safely on server side
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
      const cust = this.findOrCreateCustomer(
        billData.customer_name || 'Walk-in Guest',
        billData.customer_phone || ''
      );
      if (cust) customerId = cust.id;
    }

    const cashTendered = Number(billData.cash_tendered) || grandTotal;
    const changeReturned = Math.max(0, cashTendered - grandTotal);

    // Insert invoice
    const insertInv = db.prepare(`
      INSERT INTO invoices (
        invoice_number, customer_id, customer_name, customer_phone,
        subtotal, discount_type, discount_value, discount_amount,
        tax_rate, tax_amount, grand_total, payment_method,
        cash_tendered, change_returned, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const invResult = insertInv.run(
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
    );

    const invoiceId = invResult.lastInsertRowid;

    // Insert items & deduct inventory stock
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        invoice_id, product_id, product_name, sku, size, color,
        unit_price, quantity, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare(`
      UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?
    `);

    for (const item of billData.items) {
      const lineTotal = Number(item.unit_price) * Number(item.quantity);
      insertItem.run(
        invoiceId,
        item.product_id ? Number(item.product_id) : null,
        item.product_name,
        item.sku || '',
        item.size || 'Free Size',
        item.color || '',
        Number(item.unit_price),
        Number(item.quantity),
        lineTotal
      );

      if (item.product_id) {
        updateStock.run(Number(item.quantity), Number(item.product_id));
      }
    }

    // Update customer stats if linked
    if (customerId) {
      db.prepare(`
        UPDATE customers
        SET total_orders = total_orders + 1,
            total_spent = total_spent + ?
        WHERE id = ?
      `).run(grandTotal, customerId);
    }

    return this.getInvoiceById(invoiceId);
  },

  getInvoiceById(id) {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!invoice) return null;

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
    const settings = this.getSettings();

    return {
      ...invoice,
      items,
      settings
    };
  },

  getInvoices(filters = {}) {
    let sql = `SELECT * FROM invoices WHERE 1=1`;
    const params = [];

    if (filters.search) {
      sql += ` AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    if (filters.date) {
      sql += ` AND DATE(created_at) = DATE(?)`;
      params.push(filters.date);
    }

    sql += ` ORDER BY id DESC LIMIT 100`;
    return db.prepare(sql).all(...params);
  },

  // Analytics & Dashboard Summary
  getAnalytics() {
    const totalRevenueRow = db.prepare('SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices').get();
    const totalBillsRow = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
    const totalDressesRow = db.prepare('SELECT COUNT(*) as count FROM products').get();
    const totalStockRow = db.prepare('SELECT COALESCE(SUM(stock_quantity), 0) as count FROM products').get();

    // Today's stats
    const todayStats = db.prepare(`
      SELECT
        COALESCE(SUM(grand_total), 0) as today_revenue,
        COUNT(*) as today_bills
      FROM invoices
      WHERE DATE(created_at) = DATE('now')
    `).get();

    // Top selling dresses
    const topDresses = db.prepare(`
      SELECT
        product_name,
        SUM(quantity) as units_sold,
        SUM(line_total) as total_sales
      FROM invoice_items
      GROUP BY product_name
      ORDER BY units_sold DESC
      LIMIT 5
    `).all();

    // Low stock alerts
    const lowStockItems = db.prepare(`
      SELECT id, name, sku, stock_quantity, price
      FROM products
      WHERE stock_quantity <= 5
      ORDER BY stock_quantity ASC
      LIMIT 6
    `).all();

    // Payment methods breakdown
    const paymentBreakdown = db.prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(grand_total) as total
      FROM invoices
      GROUP BY payment_method
    `).all();

    return {
      total_revenue: totalRevenueRow.total,
      total_bills: totalBillsRow.count,
      total_dresses: totalDressesRow.count,
      total_stock: totalStockRow.count,
      today_revenue: todayStats.today_revenue,
      today_bills: todayStats.today_bills,
      top_dresses: topDresses,
      low_stock_items: lowStockItems,
      payment_breakdown: paymentBreakdown
    };
  }
};

// In-Memory Fallback Database for zero-downtime resilient hosting (e.g. Vercel before DATABASE_URL is set)
const inMemSettings = {
  id: 1,
  store_name: 'LUMIÈRE ATELIER',
  store_tagline: 'Haute Couture & Ready-to-Wear Boutique',
  address: '42 Fashion Promenade, 2nd Floor, Design District',
  phone: '+91 98765 43210',
  email: 'concierge@lumiereatelier.com',
  gstin: '33AABCT9988C1ZR',
  currency: '₹',
  tax_rate: 5.0,
  invoice_prefix: 'LUM',
  receipt_footer: 'Thank you for shopping with Lumière Atelier! Exchange within 7 days with original invoice & tag intact.'
};

const inMemCategories = [
  { id: 1, name: 'Bridal & Lehengas', slug: 'bridal-lehengas', icon: 'crown', description: 'Exquisite handcrafted bridal wear & designer lehengas' },
  { id: 2, name: 'Sarees & Ethnic Drapes', slug: 'sarees-ethnic', icon: 'sparkles', description: 'Heritage silk, organza, banarasi, and chiffon sarees' },
  { id: 3, name: 'Evening Gowns & Western', slug: 'gowns-western', icon: 'gem', description: 'Designer evening gowns, cocktail dresses & formal couture' },
  { id: 4, name: 'Suits & Anarkalis', slug: 'suits-anarkalis', icon: 'feather', description: 'Embroidered anarkalis, shararas, and designer kurta sets' },
  { id: 5, name: 'Casual & Sundresses', slug: 'casual-sundresses', icon: 'sun', description: 'Breezy linen, cotton sundresses, and chic daywear' },
  { id: 6, name: 'Men - Sherwanis & Ethnic', slug: 'men-sherwanis', icon: 'award', description: 'Regal sherwanis, bandhgalas, and silk kurta sets' },
  { id: 7, name: 'Men - Suits & Formals', slug: 'men-suits', icon: 'briefcase', description: 'Tailored tuxedos, blazers, and luxury linen shirts' },
  { id: 8, name: 'Kids & Teens Couture', slug: 'kids-couture', icon: 'heart', description: 'Adorable party frocks, festive lehengas, and boys suits' }
];

const inMemProducts = [
  { id: 1, name: 'Royal Heritage Banarasi Silk Saree', sku: 'LUM-SAR-001', category_id: 2, gender: 'Women', fabric: 'Pure Katan Silk with Gold Zari', sizes: 'Free Size', colors: 'Crimson Red, Royal Magenta, Midnight Blue', price: 8499, cost_price: 5200, stock_quantity: 18, image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', description: 'Handwoven in Varanasi with antique gold zari work and elaborate floral jaal pattern. Includes unstitched blouse piece.', is_featured: 1 },
  { id: 2, name: 'Zardozi Hand-Embroidered Bridal Lehenga', sku: 'LUM-LEH-002', category_id: 1, gender: 'Women', fabric: 'Raw Silk & Hand-Dyed Organza', sizes: 'S, M, L, XL', colors: 'Deep Maroon, Ruby Scarlet, Dusty Rose', price: 24500, cost_price: 15000, stock_quantity: 8, image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', description: 'Opulent bridal masterpiece embellished with dabka, sequin, and real zardozi needlework. Comes with dual dupatta set.', is_featured: 1 },
  { id: 3, name: 'Emerald Velvet Floor-Length Evening Gown', sku: 'LUM-GWN-003', category_id: 3, gender: 'Women', fabric: 'Plush Micro Velvet with Silk Satin Lining', sizes: 'XS, S, M, L, XL', colors: 'Emerald Green, Wine Red, Onyx Black', price: 9999, cost_price: 5800, stock_quantity: 14, image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80', description: 'Dramatic mermaid silhouette with thigh-high slit, cowl neckline, and internal boned corset structure.', is_featured: 1 },
  { id: 4, name: 'Georgette Embroidered Anarkali Gown Set', sku: 'LUM-SUIT-004', category_id: 4, gender: 'Women', fabric: 'Viscose Georgette with Santoon Lining', sizes: 'S, M, L, XL, XXL', colors: 'Powder Blue, Sage Green, Champagne Beige', price: 4599, cost_price: 2600, stock_quantity: 22, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80', description: '32-kali flared anarkali suit enriched with tone-on-tone thread embroidery and mirror foil accents.', is_featured: 1 },
  { id: 5, name: 'Pleated Satin Cocktail Midi Dress', sku: 'LUM-DRS-005', category_id: 3, gender: 'Women', fabric: 'Duchess Satin', sizes: 'XS, S, M, L', colors: 'Rose Gold, Sapphire Blue, Champagne Gold', price: 3699, cost_price: 2100, stock_quantity: 20, image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80', description: 'Chic asymmetrical drape dress with sunburst knife pleating and a removable sash belt.', is_featured: 0 },
  { id: 6, name: 'Pastel Organza Hand-Painted Floral Saree', sku: 'LUM-SAR-006', category_id: 2, gender: 'Women', fabric: 'Pure Sheer Organza Silk', sizes: 'Free Size', colors: 'Blush Pink, Mint Green, Lilac Violet', price: 5899, cost_price: 3300, stock_quantity: 12, image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', description: 'Airy, featherlight pure organza saree adorned with handcrafted botanical blooms and scalloped cutwork border.', is_featured: 1 },
  { id: 7, name: 'Bohemian Tiered Ruffle Sundress', sku: 'LUM-CAS-007', category_id: 5, gender: 'Women', fabric: '100% Breathable Mulmul Cotton', sizes: 'XS, S, M, L, XL', colors: 'Sunflower Yellow, Terracotta Orange, Olive Green', price: 2199, cost_price: 1100, stock_quantity: 35, image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', description: 'Relaxed tiered summer dress with adjustable spaghetti straps, smocked bodice, and tiered ruffle hem.', is_featured: 0 },
  { id: 8, name: 'Chanderi Silk Peplum Kurti with Dhoti Pants', sku: 'LUM-SUIT-008', category_id: 4, gender: 'Women', fabric: 'Chanderi Silk & Modal Crepe', sizes: 'S, M, L, XL', colors: 'Mustard Yellow, Coral Peach, Teal', price: 3299, cost_price: 1750, stock_quantity: 16, image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80', description: 'Contemporary fusion set featuring a peplum cut kurti with zari butti work and draped pleated dhoti.', is_featured: 0 },
  { id: 9, name: 'Bespoke Italian Wool 3-Piece Tuxedo', sku: 'LUM-MEN-009', category_id: 7, gender: 'Men', fabric: 'Super 130s Italian Wool & Satin Lapel', sizes: '38, 40, 42, 44, 46', colors: 'Midnight Navy, Jet Black, Charcoal Slate', price: 16999, cost_price: 10500, stock_quantity: 10, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80', description: 'Masterfully crafted tuxedo featuring peak satin lapels, single-button closure, tailored vest, and flat-front trousers.', is_featured: 1 },
  { id: 10, name: 'Imperial Raw Silk Groom Sherwani Set', sku: 'LUM-MEN-010', category_id: 6, gender: 'Men', fabric: 'Handwoven Raw Silk with Pure Zari', sizes: '38, 40, 42, 44', colors: 'Ivory Gold, Royal Cream, Pale Peach', price: 18500, cost_price: 11200, stock_quantity: 6, image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', description: 'Regal groom sherwani with intricate hand-embroidered collar, French knot work, silk stole, and churidar.', is_featured: 1 },
  { id: 11, name: 'French Linen Relaxed Resort Shirt', sku: 'LUM-MEN-011', category_id: 7, gender: 'Men', fabric: '100% Normandy Pure Linen', sizes: 'S, M, L, XL, XXL', colors: 'Optic White, Sky Blue, Sand Khaki, Sage', price: 2299, cost_price: 1200, stock_quantity: 40, image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', description: 'Pre-washed breathable linen shirt with band collar, mother-of-pearl buttons, and tailored comfort fit.', is_featured: 0 },
  { id: 12, name: 'Lucknowi Hand-Chikankari Men’s Kurta', sku: 'LUM-MEN-012', category_id: 6, gender: 'Men', fabric: 'Fine Cotton Silk with Shadow Work', sizes: '38, 40, 42, 44, 46', colors: 'Pearl White, Pistachio Green, Pastel Peach', price: 3199, cost_price: 1800, stock_quantity: 25, image_url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80', description: 'Intricate shadow work Chikankari hand embroidery along the yoke and sleeves. Pairs seamlessly with churidar.', is_featured: 0 },
  { id: 13, name: 'Princess Fluffy Ruffle Party Frock', sku: 'LUM-KID-013', category_id: 8, gender: 'Kids', fabric: 'Soft Satin with Multi-Layer French Net', sizes: '2-3Y, 4-5Y, 6-7Y, 8-9Y, 10-11Y', colors: 'Candy Pink, Baby Blue, Lavender', price: 2399, cost_price: 1200, stock_quantity: 19, image_url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80', description: 'Multi-tiered ballgown frock lined with pure breathable cotton for sensitive young skin. Features bow detail.', is_featured: 1 },
  { id: 14, name: 'Junior Brocade Kurta & Dhoti Set', sku: 'LUM-KID-014', category_id: 8, gender: 'Kids', fabric: 'Benarasi Brocade & Silk Dupion', sizes: '3-4Y, 5-6Y, 7-8Y, 9-10Y', colors: 'Royal Maroon, Golden Yellow, Peacock Blue', price: 2499, cost_price: 1300, stock_quantity: 15, image_url: 'https://images.unsplash.com/photo-1503944570908-7f218b66624a?auto=format&fit=crop&w=800&q=80', description: 'Festive brocade jacket with matching mandarin collar kurta and pre-stitched elasticated silk dhoti.', is_featured: 0 },
  { id: 15, name: 'Kashmiri Hand-Embroidered Velvet Cape Dress', sku: 'LUM-GWN-015', category_id: 3, gender: 'Women', fabric: 'Rich Silk Velvet with Tilla Embroidery', sizes: 'S, M, L, XL', colors: 'Burgundy Wine, Forest Green, Midnight Blue', price: 11499, cost_price: 6800, stock_quantity: 7, image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80', description: 'Royal cape silhouette with traditional Kashmiri metallic tilla needlework around the neck and cascading hem.', is_featured: 1 },
  { id: 16, name: 'Pure Linen Tiered Button-Front Shirt Dress', sku: 'LUM-CAS-016', category_id: 5, gender: 'Women', fabric: '100% Organic European Linen', sizes: 'XS, S, M, L, XL', colors: 'Natural Oatmeal, Crisp White, Terracotta', price: 2899, cost_price: 1550, stock_quantity: 28, image_url: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&w=800&q=80', description: 'Clean minimalist silhouette with tortoiseshell buttons, functional pockets, and cinching fabric tie.', is_featured: 0 },
  { id: 17, name: 'Sequined Hollywood Glamour Slit Gown', sku: 'LUM-GWN-017', category_id: 3, gender: 'Women', fabric: 'Stretch Mesh with Micro Sequins', sizes: 'XS, S, M, L', colors: 'Champagne Gold, Silver Metallic, Ruby Red', price: 7999, cost_price: 4300, stock_quantity: 11, image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80', description: 'Stunning red-carpet showstopper fully coated in light-catching micro sequins with an open back cut-out.', is_featured: 0 },
  { id: 18, name: 'Modern Cut Herringbone Tweed Blazer', sku: 'LUM-MEN-018', category_id: 7, gender: 'Men', fabric: 'Pure Shetland Wool Tweed', sizes: '38, 40, 42, 44', colors: 'Earthy Brown, Slate Grey, Forest Green', price: 6899, cost_price: 3900, stock_quantity: 12, image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', description: 'Structured heritage tweed blazer with genuine horn buttons, ticket pocket, and dual rear vents.', is_featured: 0 }
];

const inMemCustomers = [
  { id: 1, name: 'Aaradhya Sharma', phone: '9876501234', email: 'aaradhya@example.com', address: 'Flat 402, Highgrove Towers, Metro City', total_orders: 2, total_spent: 28498 },
  { id: 2, name: 'Vikramaditya Roy', phone: '9811122334', email: 'vikram@example.com', address: 'Villa 12, Palm Meadows, Bangalore', total_orders: 1, total_spent: 16999 },
  { id: 3, name: 'Pooja Singhania', phone: '9988776655', email: 'pooja@example.com', address: '7A Richmond Road, Kolkata', total_orders: 3, total_spent: 42197 }
];

const inMemInvoices = [
  {
    id: 1,
    invoice_number: 'LUM-2026-0001',
    customer_id: 1,
    customer_name: 'Aaradhya Sharma',
    customer_phone: '9876501234',
    subtotal: 18498,
    discount_type: 'percentage',
    discount_value: 10,
    discount_amount: 1849.80,
    tax_rate: 5.0,
    tax_amount: 832.41,
    grand_total: 17480.61,
    payment_method: 'UPI',
    cash_tendered: 17480.61,
    change_returned: 0,
    notes: 'Wedding reception ensemble purchase',
    status: 'PAID',
    created_at: new Date().toISOString(),
    items: [
      { id: 1, product_name: 'Royal Heritage Banarasi Silk Saree', sku: 'LUM-SAR-001', size: 'Free Size', color: 'Crimson Red', unit_price: 8499, quantity: 1, line_total: 8499 },
      { id: 2, product_name: 'Emerald Velvet Floor-Length Evening Gown', sku: 'LUM-GWN-003', size: 'M', color: 'Emerald Green', unit_price: 9999, quantity: 1, line_total: 9999 }
    ],
    settings: inMemSettings
  }
];

const InMemoryDatabase = {
  getSettings: async () => ({ ...inMemSettings }),
  updateSettings: async (data) => { Object.assign(inMemSettings, data); return { ...inMemSettings }; },
  getCategories: async () => inMemCategories,
  getProducts: async (filters = {}) => {
    let list = inMemProducts.map(p => {
      const cat = inMemCategories.find(c => c.id === p.category_id);
      return { ...p, category_name: cat ? cat.name : '', category_slug: cat ? cat.slug : '' };
    });
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.fabric && p.fabric.toLowerCase().includes(q)));
    }
    if (filters.gender && filters.gender !== 'All') {
      list = list.filter(p => p.gender === filters.gender);
    }
    if (filters.category_id) {
      list = list.filter(p => String(p.category_id) === String(filters.category_id));
    }
    if (filters.featured) {
      list = list.filter(p => p.is_featured);
    }
    if (filters.sort === 'price_asc') list.sort((a,b) => a.price - b.price);
    else if (filters.sort === 'price_desc') list.sort((a,b) => b.price - a.price);
    else if (filters.sort === 'name_asc') list.sort((a,b) => a.name.localeCompare(b.name));
    return list;
  },
  getProductById: async (id) => {
    const p = inMemProducts.find(x => String(x.id) === String(id));
    if (!p) return null;
    const cat = inMemCategories.find(c => c.id === p.category_id);
    return { ...p, category_name: cat ? cat.name : '', category_slug: cat ? cat.slug : '' };
  },
  createProduct: async (item) => {
    const id = inMemProducts.length + 1;
    const p = {
      id,
      name: item.name,
      sku: item.sku || `LUM-DRS-${String(id).padStart(3, '0')}`,
      category_id: Number(item.category_id) || null,
      gender: item.gender || 'Women',
      fabric: item.fabric || '',
      sizes: item.sizes || 'Free Size',
      colors: item.colors || 'Multi',
      price: Number(item.price),
      cost_price: Number(item.cost_price || 0),
      stock_quantity: Number(item.stock_quantity || 0),
      image_url: item.image_url || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
      description: item.description || '',
      is_featured: item.is_featured ? 1 : 0
    };
    inMemProducts.unshift(p);
    return p;
  },
  updateProduct: async (id, item) => {
    const idx = inMemProducts.findIndex(x => String(x.id) === String(id));
    if (idx !== -1) {
      inMemProducts[idx] = { ...inMemProducts[idx], ...item };
      return inMemProducts[idx];
    }
    return null;
  },
  deleteProduct: async (id) => {
    const idx = inMemProducts.findIndex(x => String(x.id) === String(id));
    if (idx !== -1) inMemProducts.splice(idx, 1);
    return { changes: 1 };
  },
  getCustomers: async (search = '') => {
    if (search) {
      const q = search.toLowerCase();
      return inMemCustomers.filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
    }
    return inMemCustomers;
  },
  findOrCreateCustomer: async (name, phone, email = '', address = '') => {
    let cust = inMemCustomers.find(c => (phone && c.phone === phone) || (name && c.name === name));
    if (!cust) {
      cust = { id: inMemCustomers.length + 1, name: name || 'Walk-in Guest', phone: phone || '', email: email || '', address: address || '', total_orders: 0, total_spent: 0 };
      inMemCustomers.push(cust);
    }
    return cust;
  },
  getNextInvoiceNumber: () => {
    const count = inMemInvoices.length + 1;
    const year = new Date().getFullYear();
    return `LUM-${year}-${String(count).padStart(4, '0')}`;
  },
  createInvoice: async (billData) => {
    const invoiceNumber = InMemoryDatabase.getNextInvoiceNumber();
    let subtotal = 0;
    for (const it of billData.items) {
      subtotal += Number(it.unit_price) * Number(it.quantity);
    }
    const discountType = billData.discount_type || 'percentage';
    const discountVal = Number(billData.discount_value) || 0;
    const discountAmount = discountType === 'percentage' ? (subtotal * discountVal) / 100 : Math.min(discountVal, subtotal);
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxRate = 5.0;
    const taxAmount = (taxable * taxRate) / 100;
    const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;

    const inv = {
      id: inMemInvoices.length + 1,
      invoice_number: invoiceNumber,
      customer_name: billData.customer_name || 'Walk-in Guest',
      customer_phone: billData.customer_phone || '',
      subtotal,
      discount_type: discountType,
      discount_value: discountVal,
      discount_amount: discountAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      payment_method: billData.payment_method || 'Cash',
      cash_tendered: Number(billData.cash_tendered) || grandTotal,
      change_returned: Math.max(0, (Number(billData.cash_tendered) || grandTotal) - grandTotal),
      notes: billData.notes || '',
      status: 'PAID',
      created_at: new Date().toISOString(),
      items: billData.items.map((it, idx) => ({
        id: idx + 1,
        product_name: it.product_name,
        sku: it.sku || '',
        size: it.size || 'Free Size',
        color: it.color || '',
        unit_price: Number(it.unit_price),
        quantity: Number(it.quantity),
        line_total: Number(it.unit_price) * Number(it.quantity)
      })),
      settings: inMemSettings
    };
    inMemInvoices.unshift(inv);
    return inv;
  },
  getInvoices: async (filters = {}) => {
    let list = [...inMemInvoices];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(i => i.invoice_number.toLowerCase().includes(q) || (i.customer_name && i.customer_name.toLowerCase().includes(q)));
    }
    return list;
  },
  getInvoiceById: async (id) => {
    return inMemInvoices.find(i => String(i.id) === String(id)) || null;
  },
  getAnalytics: async () => {
    const totalRev = inMemInvoices.reduce((acc, i) => acc + (Number(i.grand_total) || 0), 0);
    const totalStock = inMemProducts.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0);
    return {
      total_revenue: totalRev,
      total_bills: inMemInvoices.length,
      total_dresses: inMemProducts.length,
      total_stock: totalStock,
      today_revenue: totalRev,
      today_bills: inMemInvoices.length,
      top_dresses: inMemProducts.slice(0, 5).map(p => ({ product_name: p.name, units_sold: 2, total_sales: p.price * 2 })),
      low_stock_items: inMemProducts.filter(p => p.stock_quantity <= 10).slice(0, 6),
      payment_breakdown: [{ payment_method: 'UPI', count: 1, total: 17480.61 }]
    };
  }
};

if (db) {
  initSchema();
  module.exports = Database;
} else {
  console.log('⚡ Running in resilient in-memory mode.');
  module.exports = InMemoryDatabase;
}

