require('dotenv').config();
const { Pool } = require('pg');

async function syncAll() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Fetching category IDs from Neon...');
  const catRes = await pool.query('SELECT id, slug FROM categories');
  const catMap = {};
  catRes.rows.forEach(c => { catMap[c.slug] = c.id; });

  const items = [
    { name: 'Pastel Organza Hand-Painted Floral Saree', sku: 'LUM-SAR-006', category_id: catMap['sarees-ethnic'], gender: 'Women', fabric: 'Pure Sheer Organza Silk', sizes: 'Free Size', colors: 'Blush Pink, Mint Green', price: 5899, cost_price: 3300, stock_quantity: 12, image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', is_featured: 1 },
    { name: 'Bohemian Tiered Ruffle Sundress', sku: 'LUM-CAS-007', category_id: catMap['casual-sundresses'], gender: 'Women', fabric: '100% Breathable Mulmul Cotton', sizes: 'XS, S, M, L, XL', colors: 'Sunflower Yellow, Terracotta', price: 2199, cost_price: 1100, stock_quantity: 35, image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', is_featured: 0 },
    { name: 'Chanderi Silk Peplum Kurti with Dhoti Pants', sku: 'LUM-SUIT-008', category_id: catMap['suits-anarkalis'], gender: 'Women', fabric: 'Chanderi Silk & Modal Crepe', sizes: 'S, M, L, XL', colors: 'Mustard Yellow, Coral Peach', price: 3299, cost_price: 1750, stock_quantity: 16, image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=800&q=80', is_featured: 0 },
    { name: 'French Linen Relaxed Resort Shirt', sku: 'LUM-MEN-011', category_id: catMap['men-suits'], gender: 'Men', fabric: '100% Normandy Pure Linen', sizes: 'S, M, L, XL, XXL', colors: 'Optic White, Sky Blue', price: 2299, cost_price: 1200, stock_quantity: 40, image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', is_featured: 0 },
    { name: 'Lucknowi Hand-Chikankari Men Kurta', sku: 'LUM-MEN-012', category_id: catMap['men-sherwanis'], gender: 'Men', fabric: 'Fine Cotton Silk with Shadow Work', sizes: '38, 40, 42, 44, 46', colors: 'Pearl White, Pistachio Green', price: 3199, cost_price: 1800, stock_quantity: 25, image_url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80', is_featured: 0 },
    { name: 'Princess Fluffy Ruffle Party Frock', sku: 'LUM-KID-013', category_id: catMap['kids-couture'], gender: 'Kids', fabric: 'Soft Satin with Multi-Layer French Net', sizes: '2-3Y, 4-5Y, 6-7Y, 8-9Y', colors: 'Candy Pink, Baby Blue', price: 2399, cost_price: 1200, stock_quantity: 19, image_url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80', is_featured: 1 },
    { name: 'Junior Brocade Kurta Dhoti Set', sku: 'LUM-KID-014', category_id: catMap['kids-couture'], gender: 'Kids', fabric: 'Benarasi Brocade & Silk Dupion', sizes: '3-4Y, 5-6Y, 7-8Y', colors: 'Royal Maroon, Golden Yellow', price: 2499, cost_price: 1300, stock_quantity: 15, image_url: 'https://images.unsplash.com/photo-1503944570908-7f218b66624a?auto=format&fit=crop&w=800&q=80', is_featured: 0 },
    { name: 'Kashmiri Hand-Embroidered Velvet Cape Dress', sku: 'LUM-GWN-015', category_id: catMap['gowns-western'], gender: 'Women', fabric: 'Rich Silk Velvet with Tilla Embroidery', sizes: 'S, M, L, XL', colors: 'Burgundy Wine, Forest Green', price: 11499, cost_price: 6800, stock_quantity: 7, image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80', is_featured: 1 },
    { name: 'Pure Linen Tiered Button-Front Shirt Dress', sku: 'LUM-CAS-016', category_id: catMap['casual-sundresses'], gender: 'Women', fabric: '100% Organic European Linen', sizes: 'XS, S, M, L, XL', colors: 'Natural Oatmeal, Crisp White', price: 2899, cost_price: 1550, stock_quantity: 28, image_url: 'https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&w=800&q=80', is_featured: 0 },
    { name: 'Sequined Hollywood Glamour Slit Gown', sku: 'LUM-GWN-017', category_id: catMap['gowns-western'], gender: 'Women', fabric: 'Stretch Mesh with Micro Sequins', sizes: 'XS, S, M, L', colors: 'Champagne Gold, Silver Metallic', price: 7999, cost_price: 4300, stock_quantity: 11, image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80', is_featured: 0 },
    { name: 'Modern Cut Herringbone Tweed Blazer', sku: 'LUM-MEN-018', category_id: catMap['men-suits'], gender: 'Men', fabric: 'Pure Shetland Wool Tweed', sizes: '38, 40, 42, 44', colors: 'Earthy Brown, Slate Grey', price: 6899, cost_price: 3900, stock_quantity: 12, image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', is_featured: 0 }
  ];

  for (const it of items) {
    await pool.query(
      'INSERT INTO products (name, sku, category_id, gender, fabric, sizes, colors, price, cost_price, stock_quantity, image_url, description, is_featured) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ' +
      'ON CONFLICT (sku) DO NOTHING',
      [it.name, it.sku, it.category_id, it.gender, it.fabric, it.sizes, it.colors, it.price, it.cost_price, it.stock_quantity, it.image_url, 'Fine luxury boutique craftsmanship.', it.is_featured]
    );
  }

  const countRes = await pool.query('SELECT COUNT(*) as count FROM products');
  console.log('✨ All 18 dress items are now populated in Neon Cloud Database! Total:', countRes.rows[0].count);
  await pool.end();
}

syncAll().catch(console.error);
