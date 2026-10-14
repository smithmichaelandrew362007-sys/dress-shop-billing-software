/**
 * Billing Software & POS Terminal Component
 * Handles high-speed billing, item scanning, discounts, tax calculations, UPI QR, and receipts
 */
const Billing = {
  cart: [],
  customer: { name: '', phone: '' },
  discountType: 'percentage', // 'percentage' or 'flat'
  discountValue: 0,
  paymentMethod: 'Cash',
  cashTendered: 0,
  notes: '',
  allProducts: [],
  activeCategory: null,
  searchQuery: '',

  async init() {
    this.loadCart();
    await this.loadCatalog();
    this.bindEvents();
    this.updateCartUI();
    this.updateInvoiceNumberPreview();
  },

  saveCart() {
    try {
      localStorage.setItem('boutique_pos_cart', JSON.stringify(this.cart));
    } catch (e) {}
  },

  loadCart() {
    try {
      const saved = localStorage.getItem('boutique_pos_cart');
      if (saved) {
        this.cart = JSON.parse(saved);
      }
    } catch (e) {}
  },

  async loadCatalog() {
    try {
      const res = await API.getProducts({
        category_id: this.activeCategory,
        search: this.searchQuery
      });
      if (res.success) {
        this.allProducts = res.data;
        this.renderCatalogTiles();
      }
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    }
  },

  renderCatalogTiles() {
    const container = document.getElementById('pos-items-grid');
    if (!container) return;

    if (this.allProducts.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
          No dress items match your filter.
        </div>
      `;
      return;
    }

    const currency = App.settings?.currency || '₹';

    let html = '';
    for (const item of this.allProducts) {
      const isOutOfStock = item.stock_quantity <= 0;
      html += `
        <div class="pos-item-tile ${isOutOfStock ? 'disabled-tile' : ''}" onclick="Billing.handleTileClick(${item.id})">
          <img src="${item.image_url || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80'}" 
               alt="${item.name}" class="pos-tile-img" onerror="this.src='https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80'" />
          
          <div class="pos-tile-name" title="${item.name}">${item.name}</div>
          <div class="pos-tile-sku">${item.sku}</div>

          <div class="pos-tile-price-row">
            <span class="pos-tile-price">${currency}${Number(item.price).toLocaleString()}</span>
            <span class="pos-tile-stock" style="color: ${item.stock_quantity <= 3 ? 'var(--accent-amber)' : 'var(--text-muted)'};">
              ${isOutOfStock ? 'Out' : `${item.stock_quantity} left`}
            </span>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  handleTileClick(productId) {
    const item = this.allProducts.find(p => p.id === productId);
    if (!item) return;

    if (item.stock_quantity <= 0) {
      App.showToast(`"${item.name}" is out of stock!`, 'error');
      return;
    }

    this.addItem(item);
  },

  addItem(item) {
    // Check if already in cart
    const existingIndex = this.cart.findIndex(c => c.product_id === item.id);

    if (existingIndex > -1) {
      const existing = this.cart[existingIndex];
      if (existing.quantity >= item.stock_quantity) {
        App.showToast(`Cannot add more than available stock (${item.stock_quantity})`, 'error');
        return;
      }
      existing.quantity += 1;
      existing.line_total = existing.quantity * existing.unit_price;
    } else {
      const availableSizes = item.sizes ? item.sizes.split(',').map(s => s.trim()) : ['Free Size'];
      const defaultSize = availableSizes[0] || 'Free Size';
      const availableColors = item.colors ? item.colors.split(',').map(c => c.trim()) : ['Default'];
      const defaultColor = availableColors[0] || '';

      this.cart.push({
        product_id: item.id,
        product_name: item.name,
        sku: item.sku,
        size: defaultSize,
        available_sizes: availableSizes,
        color: defaultColor,
        unit_price: Number(item.price),
        quantity: 1,
        line_total: Number(item.price),
        max_stock: item.stock_quantity
      });
    }

    this.updateCartUI();
    this.updateNavBadge();
  },

  updateQuantity(index, newQty) {
    const item = this.cart[index];
    if (!item) return;

    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      this.removeItem(index);
      return;
    }

    if (qty > item.max_stock) {
      App.showToast(`Maximum available stock is ${item.max_stock}`, 'error');
      item.quantity = item.max_stock;
    } else {
      item.quantity = qty;
    }

    item.line_total = item.quantity * item.unit_price;
    this.updateCartUI();
    this.updateNavBadge();
  },

  updateItemSize(index, newSize) {
    if (this.cart[index]) {
      this.cart[index].size = newSize;
    }
  },

  updateItemPrice(index, newPrice) {
    const item = this.cart[index];
    if (!item) return;
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      item.unit_price = price;
      item.line_total = item.quantity * item.unit_price;
      this.updateCartUI();
    }
  },

  removeItem(index) {
    this.cart.splice(index, 1);
    this.updateCartUI();
    this.updateNavBadge();
  },

  clearCart() {
    if (this.cart.length === 0) return;
    if (confirm('Are you sure you want to clear all items in the current bill?')) {
      this.cart = [];
      this.discountValue = 0;
      this.cashTendered = 0;
      this.updateCartUI();
      this.updateNavBadge();
      App.showToast('Billing cart cleared', 'info');
    }
  },

  calculateTotals() {
    const currency = App.settings?.currency || '₹';
    const taxRate = Number(App.settings?.tax_rate) || 5.0;

    let subtotal = 0;
    for (const item of this.cart) {
      subtotal += item.line_total;
    }

    let discountAmount = 0;
    if (this.discountType === 'percentage') {
      discountAmount = (subtotal * (Number(this.discountValue) || 0)) / 100;
    } else {
      discountAmount = Math.min(Number(this.discountValue) || 0, subtotal);
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

    let changeDue = 0;
    if (this.paymentMethod === 'Cash' && this.cashTendered > grandTotal) {
      changeDue = this.cashTendered - grandTotal;
    }

    return {
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      grandTotal,
      changeDue,
      currency
    };
  },

  updateCartUI() {
    this.saveCart();
    const container = document.getElementById('pos-cart-items-tbody');
    const emptyState = document.getElementById('pos-cart-empty-state');
    const tableWrap = document.getElementById('pos-cart-table-wrap');

    if (!container) return;

    const totals = this.calculateTotals();

    if (this.cart.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (tableWrap) tableWrap.style.display = 'none';
      container.innerHTML = '';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (tableWrap) tableWrap.style.display = 'block';

      let html = '';
      this.cart.forEach((item, index) => {
        const sizeOptions = item.available_sizes.map(s => 
          `<option value="${s}" ${item.size === s ? 'selected' : ''}>${s}</option>`
        ).join('');

        html += `
          <tr>
            <td>
              <span class="cart-item-title">${item.product_name}</span>
              <div class="cart-item-meta">${item.sku}</div>
              <div style="margin-top: 4px;">
                <select class="form-control" style="padding: 2px 4px; font-size: 0.75rem; width: auto; display: inline-block; height: auto;"
                        onchange="Billing.updateItemSize(${index}, this.value)">
                  ${sizeOptions}
                </select>
              </div>
            </td>
            <td>
              <div class="qty-control">
                <button class="qty-btn" onclick="Billing.updateQuantity(${index}, ${item.quantity - 1})">-</button>
                <input type="text" class="qty-input" value="${item.quantity}" 
                       onchange="Billing.updateQuantity(${index}, this.value)" />
                <button class="qty-btn" onclick="Billing.updateQuantity(${index}, ${item.quantity + 1})">+</button>
              </div>
            </td>
            <td style="font-family: var(--font-mono);">
              ${totals.currency}${Number(item.unit_price).toLocaleString()}
            </td>
            <td style="font-weight: 700; color: var(--accent-gold); font-family: var(--font-mono);">
              ${totals.currency}${Number(item.line_total).toLocaleString()}
            </td>
            <td>
              <button class="btn btn-danger btn-sm btn-icon-only" onclick="Billing.removeItem(${index})" title="Remove item">
                <i class="fas fa-trash-alt"></i>
              </button>
            </td>
          </tr>
        `;
      });
      container.innerHTML = html;
    }

    // Update Summary Row Elements
    this.updateSummaryElements(totals);
  },

  updateSummaryElements(totals) {
    const elSubtotal = document.getElementById('pos-summary-subtotal');
    const elDiscount = document.getElementById('pos-summary-discount');
    const elTax = document.getElementById('pos-summary-tax');
    const elTaxLabel = document.getElementById('pos-summary-tax-label');
    const elGrandTotal = document.getElementById('pos-summary-grandtotal');
    const elChangeDue = document.getElementById('pos-change-due-amount');

    if (elSubtotal) elSubtotal.textContent = `${totals.currency}${totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (elDiscount) elDiscount.textContent = `-${totals.currency}${totals.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (elTax) elTax.textContent = `+${totals.currency}${totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (elTaxLabel) elTaxLabel.textContent = `GST / Sales Tax (${totals.taxRate}%)`;
    if (elGrandTotal) elGrandTotal.textContent = `${totals.currency}${totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (elChangeDue) elChangeDue.textContent = `${totals.currency}${totals.changeDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    // Auto-update Cash tendered placeholder/default if empty
    const cashInput = document.getElementById('pos-cash-tendered-input');
    if (cashInput && !cashInput.value && this.paymentMethod === 'Cash') {
      cashInput.placeholder = totals.grandTotal.toFixed(2);
    }

    // Sync mobile floating cart bar
    this.updateFloatingCartBar(totals);
  },

  updateFloatingCartBar(totals) {
    const floatBar = document.getElementById('mobile-cart-float-bar');
    const floatQty = document.getElementById('cart-float-qty');
    const floatAmt = document.getElementById('cart-float-amt');
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (floatQty) floatQty.textContent = totalItems;
    if (floatAmt) floatAmt.textContent = `${totals.currency}${totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    if (floatBar) {
      if (totalItems > 0) {
        floatBar.classList.add('visible');
        floatBar.style.display = 'flex';
      } else {
        floatBar.classList.remove('visible');
        floatBar.style.display = 'none';
      }
    }
  },

  scrollToCart() {
    const cartPanel = document.querySelector('.pos-cart-panel');
    if (cartPanel) {
      cartPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  updateNavBadge() {
    const badge = document.getElementById('nav-cart-count');
    const mobileBadge = document.getElementById('mobile-nav-cart-badge');
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
    if (mobileBadge) {
      mobileBadge.textContent = totalItems;
      mobileBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
  },

  async updateInvoiceNumberPreview() {
    const el = document.getElementById('pos-invoice-seq-number');
    if (el) {
      const year = new Date().getFullYear();
      const prefix = App.settings?.invoice_prefix || 'LUM';
      el.textContent = `${prefix}-${year}-#NEXT`;
    }
  },

  setPaymentMethod(method) {
    this.paymentMethod = method;
    document.querySelectorAll('.pay-method-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-method') === method);
    });

    const cashBox = document.getElementById('pos-cash-box');
    if (cashBox) {
      cashBox.style.display = method === 'Cash' ? 'grid' : 'none';
    }

    if (method === 'UPI') {
      this.openUpiModal();
    }
  },

  openUpiModal() {
    const totals = this.calculateTotals();
    if (totals.grandTotal <= 0) {
      App.showToast('Please add items to bill before scanning UPI QR', 'info');
      return;
    }

    const amountEl = document.getElementById('upi-modal-amount');
    if (amountEl) amountEl.textContent = `${totals.currency}${totals.grandTotal.toLocaleString()}`;

    // Generate dynamic QR code canvas
    const qrContainer = document.getElementById('upi-qr-box');
    if (qrContainer) {
      const upiId = 'suryatextiles@icici';
      const upiUrl = `upi://pay?pa=${upiId}&pn=Surya Textiles&am=${totals.grandTotal.toFixed(2)}&cu=INR&tn=Dress Bill`;
      
      // Use clean QR API or SVG generator
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
      qrContainer.innerHTML = `
        <img src="${qrImageUrl}" alt="Scan UPI QR Code" style="width: 190px; height: 190px; display: block; border-radius: 8px;" />
        <div style="font-size: 0.75rem; color: #555; margin-top: 6px; font-family: monospace;">UPI ID: ${upiId}</div>
      `;
    }

    App.openModal('upi-qr-modal');
  },

  confirmUpiPayment() {
    App.closeModal('upi-qr-modal');
    App.showToast('UPI payment verified!', 'success');
  },

  async processCheckout(printFormat = 'a4') {
    if (this.cart.length === 0) {
      App.showToast('Cannot checkout: cart is empty. Add dresses to bill first.', 'error');
      return;
    }

    const totals = this.calculateTotals();

    const custName = document.getElementById('pos-cust-name')?.value.trim() || 'Walk-in Guest';
    const custPhone = document.getElementById('pos-cust-phone')?.value.trim() || '';

    let tendered = Number(this.cashTendered);
    if (this.paymentMethod === 'Cash' && (!tendered || tendered < totals.grandTotal)) {
      tendered = totals.grandTotal;
    }

    const payload = {
      customer_name: custName,
      customer_phone: custPhone,
      items: this.cart.map(c => ({
        product_id: c.product_id,
        product_name: c.product_name,
        sku: c.sku,
        size: c.size,
        color: c.color,
        unit_price: c.unit_price,
        quantity: c.quantity
      })),
      discount_type: this.discountType,
      discount_value: Number(this.discountValue) || 0,
      payment_method: this.paymentMethod,
      cash_tendered: tendered,
      notes: document.getElementById('pos-bill-notes')?.value.trim() || ''
    };

    try {
      const res = await API.createInvoice(payload);
      if (res.success) {
        const invoice = res.data;
        App.showToast(`Bill ${invoice.invoice_number} created successfully!`, 'success');

        // Reset state
        this.cart = [];
        this.discountValue = 0;
        this.cashTendered = 0;
        if (document.getElementById('pos-cust-name')) document.getElementById('pos-cust-name').value = '';
        if (document.getElementById('pos-cust-phone')) document.getElementById('pos-cust-phone').value = '';
        if (document.getElementById('pos-discount-value')) document.getElementById('pos-discount-value').value = '0';
        if (document.getElementById('pos-cash-tendered-input')) document.getElementById('pos-cash-tendered-input').value = '';
        if (document.getElementById('pos-bill-notes')) document.getElementById('pos-bill-notes').value = '';
        
        this.updateCartUI();
        this.updateNavBadge();

        // Reload products catalog so updated stock counts show immediately
        await this.loadCatalog();
        await Storefront.loadProducts();
        if (window.Inventory) Inventory.loadTable();

        // Print receipt
        Invoices.printInvoice(invoice, printFormat);
      }
    } catch (err) {
      App.showToast(`Checkout failed: ${err.message}`, 'error');
    }
  },

  bindEvents() {
    // Barcode / SKU / Dress Search input with live filter
    const searchInput = document.getElementById('pos-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.loadCatalog();
      });

      // Quick Barcode Scanning on Enter key
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = searchInput.value.trim().toLowerCase();
          const exactMatch = this.allProducts.find(p => 
            p.sku.toLowerCase() === query || p.name.toLowerCase().includes(query)
          );
          if (exactMatch) {
            this.addItem(exactMatch);
            App.showToast(`Added ${exactMatch.name}`, 'success');
            searchInput.value = '';
            this.searchQuery = '';
            this.loadCatalog();
          }
        }
      });
    }

    // Discount Type & Value
    const discountTypeSelect = document.getElementById('pos-discount-type');
    const discountValueInput = document.getElementById('pos-discount-value');
    if (discountTypeSelect) {
      discountTypeSelect.addEventListener('change', (e) => {
        this.discountType = e.target.value;
        this.updateCartUI();
      });
    }
    if (discountValueInput) {
      discountValueInput.addEventListener('input', (e) => {
        this.discountValue = parseFloat(e.target.value) || 0;
        this.updateCartUI();
      });
    }

    // Cash Tendered
    const cashInput = document.getElementById('pos-cash-tendered-input');
    if (cashInput) {
      cashInput.addEventListener('input', (e) => {
        this.cashTendered = parseFloat(e.target.value) || 0;
        this.updateCartUI();
      });
    }

    // Payment Methods Pills
    document.querySelectorAll('.pay-method-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const method = btn.getAttribute('data-method');
        this.setPaymentMethod(method);
      });
    });

    // POS Category Filter Buttons
    const catContainer = document.getElementById('pos-category-tabs');
    if (catContainer) {
      catContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.pos-cat-btn');
        if (!btn) return;
        catContainer.querySelectorAll('.pos-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const catId = btn.getAttribute('data-cat');
        this.activeCategory = catId ? Number(catId) : null;
        this.loadCatalog();
      });
    }

    // Global keyboard shortcut: F2 to focus search, Ctrl+Enter to checkout
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        App.switchTab('billing');
        if (searchInput) searchInput.focus();
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.processCheckout('a4');
      }
    });
  }
};
