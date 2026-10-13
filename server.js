require('dotenv').config();
const express = require('express');
const path = require('node:path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS and Request logging
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// API Routes

// 1. Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    await db.updateSettings(req.body);
    const updated = await db.getSettings();
    res.json({ success: true, data: updated, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Products (Dress Items & Prices)
app.get('/api/products', async (req, res) => {
  try {
    const { search, category_id, gender, sort, featured } = req.query;
    const products = await db.getProducts({ search, category_id, gender, sort, featured });
    res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined || price === null || price === '') {
      return res.status(400).json({ success: false, error: 'Product name and price are required' });
    }
    const created = await db.createProduct(req.body);
    res.status(201).json({ success: true, data: created, message: 'Dress item added successfully to database' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Product name and price are required' });
    }
    const updated = await db.updateProduct(req.params.id, req.body);
    res.json({ success: true, data: updated, message: 'Dress item updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Dress item deleted from database' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await db.getCustomers(req.query.search);
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name && !phone) {
      return res.status(400).json({ success: false, error: 'Name or phone is required' });
    }
    const customer = await db.findOrCreateCustomer(name, phone, email, address);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Invoices & Billing
app.get('/api/invoices', async (req, res) => {
  try {
    const { search, date } = req.query;
    const invoices = await db.getInvoices({ search, date });
    res.json({ success: true, data: invoices, count: invoices.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await db.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty. Please add dress items to bill.' });
    }
    const newInvoice = await db.createInvoice(req.body);
    res.status(201).json({ success: true, data: newInvoice, message: 'Bill created and saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await db.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route for Billing POS counter
app.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'billing.html'));
});

// Fallback to index.html for website routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with fallback port if in use
function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    const srv = app.listen(port, () => {
      console.log(`✨ Boutique & Dress Billing Software server running at http://localhost:${port}`);
      resolve({ app, server: srv, port });
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = Number(port) + 1;
        console.log(`Port ${port} in use, trying port ${nextPort}...`);
        startServer(nextPort).then(resolve).catch(reject);
      } else {
        console.error('Server error:', err);
        reject(err);
      }
    });
  });
}

// Auto-run if invoked directly
if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}

module.exports = { app, startServer };
