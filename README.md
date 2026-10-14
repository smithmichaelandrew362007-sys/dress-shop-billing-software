# SURYA TEXTILES A BILLING SOFTWARE

An all-in-one web and desktop application combining an **editorial fashion boutique storefront website** with a high-speed **Point-of-Sale (POS) Billing Software** and a **persistent Database** for managing dress items, prices, inventory, and customer invoices.

---

## 🌟 Key Features

### 1. 🛍️ Dress Boutique Storefront Website
- **Curated Collections**: Heritage Sarees, Bridal Lehengas, Designer Evening Gowns, Anarkali Suits, Casual Sundresses, Men's Sherwanis, Bespoke Tuxedos, and Kids Couture.
- **Search & Filter**: Search dresses by name, fabric, SKU, or keyword. Filter by category, gender, and price sorting.
- **Quick View Modal**: Displays high-resolution imagery, fabric details, colorways, description, available size badges, stock count, and 1-click **Add to Bill**.

### 2. 🧾 Counter Billing & POS Software
- **High-Speed Counter Checkout**: Quick barcode/SKU scanner input (`F2` shortcut) and live dress catalog tiles.
- **Dynamic Cart Management**: Adjust quantities, select dress sizes (XS, S, M, L, XL, Free Size), and delete items.
- **Automatic Financial Calculations**:
  - Subtotal calculation
  - Configurable Discounts (% percentage or flat currency)
  - Configurable GST / Sales Tax (default 5%, customizable in Settings)
  - Grand Total computation
- **Multiple Payment Methods**:
  - **Cash** (with Cash Tendered & instant Change Due calculator)
  - **UPI / QR Code** (generates real dynamic UPI QR code on screen for customers to scan)
  - **Credit/Debit Card** & **Net Banking**
- **Dual Printing Formats**:
  - **A4 Full Tax Invoice**: Formatted with boutique branding, GSTIN, customer details, itemized tax breakdown, terms, and signature box.
  - **80mm Thermal POS Receipt**: Compact format for counter thermal receipt printers.

### 3. 📦 Persistent SQLite Database
- Database file located at `data/boutique.db`.
- **Pre-populated with authentic dress items** across women, men, and kids collections with prices, fabrics, and stock.
- **Inventory Management UI**: Add new dresses, update prices and stock levels, view profit margins, and manage low-stock alerts.

### 4. 📑 Sales Analytics & Invoices History
- Track **Today's Gross Sales**, **Lifetime Revenue**, **Total Invoices**, and **Average Bill Value**.
- Bestseller leaderboard showing top-selling dresses by volume.
- Search and reprint any past invoice anytime.

### 5. 🖥️ Desktop Native Application (Electron)
- **Standalone Windows Desktop App**: Runs as a dedicated native desktop software window.
- **Auto-Booting Server**: Automatically connects to the local Express backend or boots an embedded instance on launch.
- **Native Direct Printing**: Supports direct thermal receipt printing and system printer discovery.
- **Export Invoices as PDF**: Native PDF generation with custom save location dialogue.
- **Native System Menu & Shortcuts**: `CmdOrCtrl+1/2/3/4` for fast navigation, `F2` to scan, `CmdOrCtrl+Enter` to generate bills.

---

## 🚀 How to Run Locally

### 1. Run as Desktop Application (Electron)
```bash
npm run electron
```
*(or `npm run desktop` or `npm run app`)*

### 2. Run as Web Server
```bash
npm start
```
Then open your browser at:
```
http://localhost:3000
```
http://localhost:3000
```

---

## 📁 Project Structure

```
d:\project\
  ├── package.json          # Project dependencies and npm start script
  ├── server.js             # Express REST API & static file server
  ├── database.js           # SQLite database schema, seeding, and queries
  ├── data\
  │    └── boutique.db      # Persistent SQLite database file
  ├── public\
  │    ├── index.html       # Single-Page Application interface
  │    ├── css\
  │    │    ├── style.css   # Boutique design system & responsive styling
  │    │    └── print.css   # Print formatting for A4 & 80mm thermal receipts
  │    └── js\
  │         ├── api.js          # Client API service
  │         ├── storefront.js   # Public catalog browsing & filters
  │         ├── billing.js      # POS counter cart & checkout logic
  │         ├── inventory.js    # Dress DB & inventory management
  │         ├── invoices.js     # Invoice history & print engine
  │         └── app.js          # App orchestrator, clock, & settings
  └── README.md
```
