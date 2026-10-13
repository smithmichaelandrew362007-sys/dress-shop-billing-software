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
      store_name TEXT NOT NULL DEFAULT 'LUMIÈRE ATELIER',
      store_tagline TEXT NOT NULL DEFAULT 'Haute Couture & Ready-to-Wear Boutique',
      address TEXT NOT NULL DEFAULT '42 Fashion Promenade, 2nd Floor, Design District',
      phone TEXT NOT NULL DEFAULT '+91 98765 43210',
      email TEXT NOT NULL DEFAULT 'concierge@lumiereatelier.com',
      gstin TEXT NOT NULL DEFAULT '33AABCT9988C1ZR',
      currency TEXT NOT NULL DEFAULT '₹',
      tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
      invoice_prefix TEXT NOT NULL DEFAULT 'LUM',
      receipt_footer TEXT NOT NULL DEFAULT 'Thank you for shopping with Lumière Atelier! Exchange within 7 days with original invoice & tag intact.'
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
  `);

  // Ensure default settings row exists
  const settingsRes = await p.query('SELECT COUNT(*) as count FROM settings');
  if (parseInt(settingsRes.rows[0].count, 10) === 0) {
    await p.query(`
      INSERT INTO settings (id, store_name, store_tagline, address, phone, email, gstin, currency, tax_rate, invoice_prefix)
      VALUES (1, 'LUMIÈRE ATELIER', 'Haute Couture & Ready-to-Wear Boutique', '42 Fashion Promenade, 2nd Floor, Design District', '+91 98765 43210', 'concierge@lumiereatelier.com', '33AABCT9988C1ZR', '₹', 5.0, 'LUM')
    `);
  }

  // Check if categories need seeding
  const catCountRes = await p.query('SELECT COUNT(*) as count FROM categories');
  if (parseInt(catCountRes.rows[0].count, 10) === 0) {
    await seedPostgresData(p);
  }

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
  }
};

module.exports = {
  PostgresDatabase,
  initPostgresSchema
};
