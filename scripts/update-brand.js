require('dotenv').config();
const fs = require('fs');
const path = require('path');

// 1. Update SQLite if present
const dbPath = path.join(__dirname, '..', 'data', 'boutique.db');
if (fs.existsSync(dbPath)) {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbPath);
    db.prepare(`
      UPDATE settings SET
        store_name = 'SURYA TEXTILES A BILLING SOFTWARE',
        store_tagline = 'Premium Silks, Heritage Weaves & Ready-to-Wear Textiles',
        email = 'contact@suryatextiles.com',
        invoice_prefix = 'STX',
        receipt_footer = 'Thank you for shopping with SURYA TEXTILES A BILLING SOFTWARE! Exchange within 7 days with original invoice & tag intact.'
      WHERE id = 1
    `).run();
    console.log('✅ SQLite boutique.db settings updated to SURYA TEXTILES A BILLING SOFTWARE');
  } catch (err) {
    console.log('SQLite update notice:', err.message);
  }
}

// 2. Update Neon PostgreSQL if DATABASE_URL present
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  pool.query(`
    UPDATE settings SET
      store_name = 'SURYA TEXTILES A BILLING SOFTWARE',
      store_tagline = 'Premium Silks, Heritage Weaves & Ready-to-Wear Textiles',
      email = 'contact@suryatextiles.com',
      invoice_prefix = 'STX',
      receipt_footer = 'Thank you for shopping with SURYA TEXTILES A BILLING SOFTWARE! Exchange within 7 days with original invoice & tag intact.'
    WHERE id = 1
  `).then(() => {
    console.log('✅ Neon PostgreSQL settings updated to SURYA TEXTILES A BILLING SOFTWARE');
    pool.end();
  }).catch((err) => {
    console.error('Neon update notice:', err.message);
    pool.end();
  });
}
