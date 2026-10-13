/**
 * Storefront Website Component
 * Handles the public dress boutique catalog, collections browsing, search, and quick view
 */
const Storefront = {
  currentCategory: null,
  currentGender: 'All',
  searchQuery: '',
  currentSort: 'newest',
  products: [],
  categories: [],

  async init() {
    await this.loadCategories();
    await this.loadProducts();
    this.bindEvents();
  },

  async loadCategories() {
    try {
      const res = await API.getCategories();
      if (res.success) {
        this.categories = res.data;
        this.renderCategoryPills();
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  },

  async loadProducts() {
    try {
      const container = document.getElementById('storefront-products-grid');
      if (container) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
            <div class="live-indicator-dot" style="margin: 0 auto 1rem; width: 12px; height: 12px;"></div>
            Loading luxury collection...
          </div>
        `;
      }

      const res = await API.getProducts({
        category_id: this.currentCategory,
        gender: this.currentGender,
        search: this.searchQuery,
        sort: this.currentSort
      });

      if (res.success) {
        this.products = res.data;
        this.renderProducts();
        this.updateProductCount();
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      const container = document.getElementById('storefront-products-grid');
      if (container) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--accent-danger); padding: 2rem;">Error loading dress collection. Please refresh.</div>`;
      }
    }
  },

  renderCategoryPills() {
    const container = document.getElementById('storefront-cat-pills');
    if (!container) return;

    let html = `
      <button class="cat-pill ${this.currentCategory === null ? 'active' : ''}" data-cat-id="">
        <i class="fas fa-layer-group"></i> All Collections
      </button>
    `;

    for (const cat of this.categories) {
      const isActive = this.currentCategory == cat.id;
      html += `
        <button class="cat-pill ${isActive ? 'active' : ''}" data-cat-id="${cat.id}">
          <i class="fas fa-sparkles"></i> ${cat.name}
        </button>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const catId = btn.getAttribute('data-cat-id');
        this.currentCategory = catId ? Number(catId) : null;
        container.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadProducts();
      });
    });
  },

  renderProducts() {
    const container = document.getElementById('storefront-products-grid');
    if (!container) return;

    if (this.products.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">👗</div>
          <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">No dress items found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 400px; margin: 0 auto 1.5rem;">
            Try adjusting your search keywords, category filter, or gender preference.
          </p>
          <button class="btn btn-secondary btn-sm" id="btn-reset-filters">Reset All Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.currentCategory = null;
          this.currentGender = 'All';
          this.searchQuery = '';
          const searchInput = document.getElementById('storefront-search-input');
          if (searchInput) searchInput.value = '';
          const genderSelect = document.getElementById('storefront-gender-select');
          if (genderSelect) genderSelect.value = 'All';
          this.renderCategoryPills();
          this.loadProducts();
        });
      }
      return;
    }

    const currency = App.settings?.currency || '₹';

    let html = '';
    for (const item of this.products) {
      let stockBadgeClass = 'stock-in';
      let stockText = `${item.stock_quantity} in stock`;
      if (item.stock_quantity <= 0) {
        stockBadgeClass = 'stock-out';
        stockText = 'Out of Stock';
      } else if (item.stock_quantity <= 5) {
        stockBadgeClass = 'stock-low';
        stockText = `Low Stock (${item.stock_quantity} left)`;
      }

      const sizes = item.sizes ? item.sizes.split(',').map(s => s.trim()) : ['Free Size'];

      html += `
        <div class="dress-card" data-id="${item.id}">
          <div class="dress-image-wrapper">
            <img src="${item.image_url || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80'}" 
                 alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80'" />
            
            <div class="dress-badges-top">
              <span class="dress-category-badge">${item.category_name || item.gender}</span>
              <span class="dress-stock-badge ${stockBadgeClass}">${stockText}</span>
            </div>

            <div class="dress-quick-actions">
              <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="Storefront.openQuickView(${item.id})">
                <i class="fas fa-eye"></i> Quick View
              </button>
              <button class="btn btn-primary btn-sm" style="flex: 1.2;" onclick="Storefront.addToBilling(${item.id})" ${item.stock_quantity <= 0 ? 'disabled' : ''}>
                <i class="fas fa-plus"></i> Add to Bill
              </button>
            </div>
          </div>

          <div class="dress-card-body">
            <div class="dress-meta-row">
              <span class="dress-sku">${item.sku}</span>
              <span>${item.gender}</span>
            </div>

            <h3 class="dress-title" title="${item.name}">${item.name}</h3>

            ${item.fabric ? `
              <div class="dress-fabric-tag">
                <i class="fas fa-scroll" style="font-size: 0.7rem; color: var(--accent-gold);"></i> ${item.fabric}
              </div>
            ` : ''}

            <div class="dress-sizes-list">
              ${sizes.map(s => `<span class="size-pill">${s}</span>`).join('')}
            </div>

            <div class="dress-card-footer">
              <div class="dress-price-tag">
                <span class="dress-price-label">Retail Price</span>
                <span class="dress-price-amount">${currency}${Number(item.price).toLocaleString()}</span>
              </div>
              <button class="btn btn-outline-gold btn-sm" onclick="Storefront.addToBilling(${item.id})" title="Add to billing counter">
                <i class="fas fa-cart-plus"></i> Bill
              </button>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  updateProductCount() {
    const el = document.getElementById('storefront-item-count');
    if (el) {
      el.textContent = `${this.products.length} dress items found`;
    }
  },

  async openQuickView(id) {
    try {
      const res = await API.getProduct(id);
      if (!res.success) return;
      const item = res.data;
      const currency = App.settings?.currency || '₹';
      const sizes = item.sizes ? item.sizes.split(',').map(s => s.trim()) : ['Free Size'];

      const modalBody = document.getElementById('product-modal-body');
      if (!modalBody) return;

      modalBody.innerHTML = `
        <div class="product-modal-grid">
          <div>
            <img src="${item.image_url}" alt="${item.name}" class="modal-product-img" onerror="this.src='https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80'" />
          </div>
          <div>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.6rem; align-items: center;">
              <span class="dress-category-badge">${item.category_name || item.gender}</span>
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${item.sku}</span>
            </div>

            <h2 style="font-size: 1.6rem; margin-bottom: 0.75rem; line-height: 1.2;">${item.name}</h2>

            <div style="font-size: 1.75rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 1rem;">
              ${currency}${Number(item.price).toLocaleString()}
            </div>

            <div style="background: var(--bg-surface-elevated); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; border: 1px solid var(--border-subtle);">
              <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.25rem;">FABRIC & MATERIAL</div>
              <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${item.fabric || 'Premium Handcrafted Blend'}</div>
              ${item.colors ? `<div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.3rem;">Colors: ${item.colors}</div>` : ''}
            </div>

            <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.25rem;">
              ${item.description || 'Exclusive boutique creation tailored to perfection with signature drape and premium finish.'}
            </p>

            <div style="margin-bottom: 1.25rem;">
              <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">AVAILABLE SIZES:</div>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                ${sizes.map(s => `<span class="size-pill" style="padding: 4px 10px; font-size: 0.82rem;">${s}</span>`).join('')}
              </div>
            </div>

            <div style="margin-bottom: 1.5rem; font-size: 0.85rem;">
              <span style="color: var(--text-muted);">Stock Status: </span>
              <strong style="color: ${item.stock_quantity > 5 ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">
                ${item.stock_quantity > 0 ? `${item.stock_quantity} units available` : 'Out of Stock'}
              </strong>
            </div>

            <div style="display: flex; gap: 0.75rem;">
              <button class="btn btn-primary" style="flex: 1;" onclick="Storefront.addToBillingAndSwitch(${item.id})">
                <i class="fas fa-cash-register"></i> Add to Bill & Open POS
              </button>
              <button class="btn btn-secondary" onclick="App.closeModal('product-quickview-modal')">
                Close
              </button>
            </div>
          </div>
        </div>
      `;

      App.openModal('product-quickview-modal');
    } catch (err) {
      console.error('Failed to open product quickview:', err);
    }
  },

  addToBilling(id) {
    const item = this.products.find(p => p.id === id);
    if (!item) return;

    if (item.stock_quantity <= 0) {
      App.showToast(`"${item.name}" is currently out of stock.`, 'error');
      return;
    }

    Billing.addItem(item);
    App.showToast(`Added "${item.name}" to Billing Counter!`, 'success');
  },

  addToBillingAndSwitch(id) {
    this.addToBilling(id);
    App.closeModal('product-quickview-modal');
    if (document.getElementById('view-billing')) {
      App.switchTab('billing');
    } else {
      window.location.href = 'billing.html';
    }
  },

  bindEvents() {
    // Search input with debounce
    const searchInput = document.getElementById('storefront-search-input');
    if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.loadProducts();
        }, 300);
      });
    }

    // Gender filter select
    const genderSelect = document.getElementById('storefront-gender-select');
    if (genderSelect) {
      genderSelect.addEventListener('change', (e) => {
        this.currentGender = e.target.value;
        this.loadProducts();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('storefront-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.loadProducts();
      });
    }
  }
};
