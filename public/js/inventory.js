/**
 * Inventory & Dress Database Management Component
 * Controls the SQLite database of dress items, live prices, stock levels, and additions
 */
const Inventory = {
  products: [],
  categories: [],
  searchQuery: '',
  editingProductId: null,

  async init() {
    await this.loadCategories();
    await this.loadTable();
    this.bindEvents();
  },

  async loadCategories() {
    try {
      const res = await API.getCategories();
      if (res.success) {
        this.categories = res.data;
        this.populateCategoryDropdowns();
      }
    } catch (err) {
      console.error('Failed to load categories in inventory:', err);
    }
  },

  populateCategoryDropdowns() {
    const selects = [
      document.getElementById('inv-item-category'),
      document.getElementById('inv-filter-category')
    ];

    selects.forEach(select => {
      if (!select) return;
      let html = select.id.includes('filter') ? '<option value="">All Categories</option>' : '<option value="">Select Category</option>';
      for (const cat of this.categories) {
        html += `<option value="${cat.id}">${cat.name}</option>`;
      }
      select.innerHTML = html;
    });
  },

  async loadTable() {
    try {
      const tbody = document.getElementById('inventory-table-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading dress database...</td></tr>`;
      }

      const res = await API.getProducts({ search: this.searchQuery });
      if (res.success) {
        this.products = res.data;
        this.renderTable();
        this.updateStats();
      }
    } catch (err) {
      console.error('Failed to load inventory table:', err);
    }
  },

  renderTable() {
    const tbody = document.getElementById('inventory-table-tbody');
    if (!tbody) return;

    if (this.products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            No dress items found in database matching your criteria.
          </td>
        </tr>
      `;
      return;
    }

    const currency = App.settings?.currency || '₹';

    let html = '';
    this.products.forEach((p, idx) => {
      let stockBadge = '<span class="badge stock-in" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; background: rgba(16,185,129,0.2); color: #10b981; font-weight: 600;">In Stock</span>';
      if (p.stock_quantity <= 0) {
        stockBadge = '<span class="badge stock-out" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; background: rgba(239,68,68,0.2); color: #ef4444; font-weight: 600;">Out of Stock</span>';
      } else if (p.stock_quantity <= 5) {
        stockBadge = '<span class="badge stock-low" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; background: rgba(245,158,11,0.2); color: #f59e0b; font-weight: 600;">Low Stock</span>';
      }

      const cost = p.cost_price || 0;
      const profitMargin = cost > 0 ? Math.round(((p.price - cost) / p.price) * 100) : 0;

      html += `
        <tr>
          <td>
            <img src="${p.image_url || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80'}" 
                 alt="${p.name}" class="dress-table-thumb" onerror="this.src='https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80'" />
          </td>
          <td>
            <span class="table-dress-name">${p.name}</span>
            <span class="table-dress-sku">${p.sku}</span>
          </td>
          <td>
            <span style="font-size: 0.8rem; background: var(--bg-surface-elevated); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border-subtle);">
              ${p.category_name || 'General'}
            </span>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">${p.gender}</div>
          </td>
          <td style="font-size: 0.8rem; color: var(--text-secondary);">
            ${p.fabric || '—'}
          </td>
          <td style="font-size: 0.78rem;">
            ${p.sizes || 'Free Size'}
          </td>
          <td style="font-weight: 700; color: var(--accent-gold); font-family: var(--font-mono);">
            ${currency}${Number(p.price).toLocaleString()}
          </td>
          <td>
            <div style="font-weight: 700; font-family: var(--font-mono);">${p.stock_quantity}</div>
            <div style="margin-top: 2px;">${stockBadge}</div>
          </td>
          <td>
            <span style="font-size: 0.78rem; color: ${profitMargin >= 30 ? 'var(--accent-emerald)' : 'var(--text-muted)'}; font-weight: 600;">
              ${profitMargin > 0 ? `${profitMargin}% margin` : '—'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm btn-icon-only" onclick="Inventory.openEditModal(${p.id})" title="Edit Dress & Price">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm btn-icon-only" onclick="Inventory.deleteProduct(${p.id}, '${escape(p.name)}')" title="Delete from Database">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  updateStats() {
    const currency = App.settings?.currency || '₹';
    const totalStyles = this.products.length;
    const totalStock = this.products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
    const totalAssetValue = this.products.reduce((acc, p) => acc + ((p.stock_quantity || 0) * (p.price || 0)), 0);
    const lowStockCount = this.products.filter(p => p.stock_quantity <= 5).length;

    const elStyles = document.getElementById('inv-stat-styles');
    const elStock = document.getElementById('inv-stat-units');
    const elValue = document.getElementById('inv-stat-value');
    const elLowStock = document.getElementById('inv-stat-low');

    if (elStyles) elStyles.textContent = totalStyles;
    if (elStock) elStock.textContent = totalStock.toLocaleString();
    if (elValue) elValue.textContent = `${currency}${totalAssetValue.toLocaleString()}`;
    if (elLowStock) elLowStock.textContent = lowStockCount;
  },

  openAddModal() {
    this.editingProductId = null;
    const form = document.getElementById('inv-dress-form');
    if (form) form.reset();

    document.getElementById('inv-modal-title').textContent = 'Add New Dress to Database';
    document.getElementById('inv-item-sku').value = `LUM-DRS-${String(this.products.length + 1).padStart(3, '0')}`;
    document.getElementById('inv-img-preview').src = 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80';

    App.openModal('inventory-item-modal');
  },

  async openEditModal(productId) {
    try {
      const res = await API.getProduct(productId);
      if (!res.success) return;
      const item = res.data;

      this.editingProductId = item.id;
      document.getElementById('inv-modal-title').textContent = 'Edit Dress Details & Price';

      document.getElementById('inv-item-name').value = item.name || '';
      document.getElementById('inv-item-sku').value = item.sku || '';
      document.getElementById('inv-item-category').value = item.category_id || '';
      document.getElementById('inv-item-gender').value = item.gender || 'Women';
      document.getElementById('inv-item-fabric').value = item.fabric || '';
      document.getElementById('inv-item-sizes').value = item.sizes || 'Free Size';
      document.getElementById('inv-item-colors').value = item.colors || '';
      document.getElementById('inv-item-price').value = item.price || 0;
      document.getElementById('inv-item-cost').value = item.cost_price || 0;
      document.getElementById('inv-item-stock').value = item.stock_quantity || 0;
      document.getElementById('inv-item-img').value = item.image_url || '';
      document.getElementById('inv-item-desc').value = item.description || '';
      document.getElementById('inv-item-featured').checked = !!item.is_featured;

      const preview = document.getElementById('inv-img-preview');
      if (preview) preview.src = item.image_url || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80';

      App.openModal('inventory-item-modal');
    } catch (err) {
      console.error('Failed to load product for edit:', err);
    }
  },

  async saveProduct(e) {
    e.preventDefault();

    const name = document.getElementById('inv-item-name').value.trim();
    const price = parseFloat(document.getElementById('inv-item-price').value);

    if (!name || isNaN(price)) {
      App.showToast('Product name and valid price are required', 'error');
      return;
    }

    const payload = {
      name,
      sku: document.getElementById('inv-item-sku').value.trim(),
      category_id: document.getElementById('inv-item-category').value || null,
      gender: document.getElementById('inv-item-gender').value,
      fabric: document.getElementById('inv-item-fabric').value.trim(),
      sizes: document.getElementById('inv-item-sizes').value.trim() || 'Free Size',
      colors: document.getElementById('inv-item-colors').value.trim() || 'Multi',
      price,
      cost_price: parseFloat(document.getElementById('inv-item-cost').value) || 0,
      stock_quantity: parseInt(document.getElementById('inv-item-stock').value, 10) || 0,
      image_url: document.getElementById('inv-item-img').value.trim() || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
      description: document.getElementById('inv-item-desc').value.trim(),
      is_featured: document.getElementById('inv-item-featured').checked ? 1 : 0
    };

    try {
      if (this.editingProductId) {
        await API.updateProduct(this.editingProductId, payload);
        App.showToast(`Updated "${payload.name}" successfully!`, 'success');
      } else {
        await API.createProduct(payload);
        App.showToast(`Added "${payload.name}" to database!`, 'success');
      }

      App.closeModal('inventory-item-modal');
      await this.loadTable();
      await Storefront.loadProducts();
      await Billing.loadCatalog();
    } catch (err) {
      App.showToast(`Error saving product: ${err.message}`, 'error');
    }
  },

  async deleteProduct(id, escapedName) {
    const name = unescape(escapedName);
    if (!confirm(`Are you sure you want to delete "${name}" from the database?`)) return;

    try {
      await API.deleteProduct(id);
      App.showToast(`Deleted "${name}" from database`, 'info');
      await this.loadTable();
      await Storefront.loadProducts();
      await Billing.loadCatalog();
    } catch (err) {
      App.showToast(`Failed to delete product: ${err.message}`, 'error');
    }
  },

  bindEvents() {
    // Inventory search input
    const searchInput = document.getElementById('inv-search-input');
    if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.loadTable();
        }, 300);
      });
    }

    // Image URL change live preview
    const imgInput = document.getElementById('inv-item-img');
    const preview = document.getElementById('inv-img-preview');
    if (imgInput && preview) {
      imgInput.addEventListener('input', () => {
        preview.src = imgInput.value.trim() || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=80';
      });
    }

    // Form submit
    const form = document.getElementById('inv-dress-form');
    if (form) {
      form.addEventListener('submit', (e) => this.saveProduct(e));
    }
  }
};
