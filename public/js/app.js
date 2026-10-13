/**
 * Main Application Orchestrator
 * Coordinates Navigation, Modals, Toasts, Settings, and Component Lifecycles
 */
const App = {
  activeTab: 'storefront',
  settings: null,

  async init() {
    try {
      await this.loadSettings();
      this.startClock();
      this.bindTabNavigation();
      this.bindModalListeners();

      this.checkElectronEnvironment();
      AuthHelper.renderNavbarUser();

      // Initialize active sub-modules
      if (typeof Storefront !== 'undefined') await Storefront.init();
      if (typeof Billing !== 'undefined') await Billing.init();
      if (typeof Inventory !== 'undefined') await Inventory.init();
      if (typeof Invoices !== 'undefined') await Invoices.init();

      console.log('✨ Surya Textiles Boutique & Billing Software initialized successfully');
    } catch (err) {
      console.error('App initialization error:', err);
    }
  },

  checkElectronEnvironment() {
    if (window.electronAPI && window.electronAPI.isElectron) {
      const badge = document.getElementById('desktop-edition-badge');
      if (badge) badge.style.display = 'inline-flex';
      console.log('🖥️ Running inside Electron Desktop environment');
    }
  },

  async loadSettings() {
    try {
      const res = await API.getSettings();
      if (res.success) {
        this.settings = res.data;
        this.applySettingsToUI();
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  },

  applySettingsToUI() {
    if (!this.settings) return;

    // Brand Name & Tagline in navbar
    const brandNameEls = document.querySelectorAll('.brand-store-name');
    brandNameEls.forEach(el => el.textContent = this.settings.store_name);

    const brandTaglineEls = document.querySelectorAll('.brand-store-tagline');
    brandTaglineEls.forEach(el => el.textContent = this.settings.store_tagline);

    // Populate Settings Form fields
    const s = this.settings;
    if (document.getElementById('set-store-name')) document.getElementById('set-store-name').value = s.store_name || '';
    if (document.getElementById('set-store-tagline')) document.getElementById('set-store-tagline').value = s.store_tagline || '';
    if (document.getElementById('set-address')) document.getElementById('set-address').value = s.address || '';
    if (document.getElementById('set-phone')) document.getElementById('set-phone').value = s.phone || '';
    if (document.getElementById('set-email')) document.getElementById('set-email').value = s.email || '';
    if (document.getElementById('set-gstin')) document.getElementById('set-gstin').value = s.gstin || '';
    if (document.getElementById('set-currency')) document.getElementById('set-currency').value = s.currency || '₹';
    if (document.getElementById('set-tax-rate')) document.getElementById('set-tax-rate').value = s.tax_rate || 5.0;
    if (document.getElementById('set-invoice-prefix')) document.getElementById('set-invoice-prefix').value = s.invoice_prefix || 'STX';
    if (document.getElementById('set-receipt-footer')) document.getElementById('set-receipt-footer').value = s.receipt_footer || '';
    if (document.getElementById('set-theme-preference')) {
      document.getElementById('set-theme-preference').value = localStorage.getItem('surya_theme') || 'system';
    }
  },

  async saveSettings(e) {
    e.preventDefault();

    const themeVal = document.getElementById('set-theme-preference')?.value;
    if (themeVal && window.ThemeManager) {
      window.ThemeManager.setTheme(themeVal, false);
    }

    const payload = {
      store_name: document.getElementById('set-store-name').value.trim() || 'SURYA TEXTILES',
      store_tagline: document.getElementById('set-store-tagline').value.trim() || 'Premium Silks & Textiles',
      address: document.getElementById('set-address').value.trim(),
      phone: document.getElementById('set-phone').value.trim(),
      email: document.getElementById('set-email').value.trim(),
      gstin: document.getElementById('set-gstin').value.trim(),
      currency: document.getElementById('set-currency').value.trim() || '₹',
      tax_rate: parseFloat(document.getElementById('set-tax-rate').value) || 5.0,
      invoice_prefix: document.getElementById('set-invoice-prefix').value.trim() || 'LUM',
      receipt_footer: document.getElementById('set-receipt-footer').value.trim()
    };

    try {
      const res = await API.updateSettings(payload);
      if (res.success) {
        this.settings = res.data;
        this.applySettingsToUI();
        this.showToast('Shop configuration saved successfully!', 'success');
        this.closeModal('settings-modal');
        
        // Refresh views to use new currency & tax settings
        Storefront.renderProducts();
        Billing.updateCartUI();
        Billing.renderCatalogTiles();
        Inventory.renderTable();
        Invoices.renderTable();
      }
    } catch (err) {
      this.showToast(`Error saving settings: ${err.message}`, 'error');
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update nav tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Update view panels
    document.querySelectorAll('.view-section').forEach(view => {
      view.classList.toggle('active-view', view.id === `view-${tabId}`);
    });

    // Refresh specific view data if switching into it
    if (tabId === 'billing') {
      Billing.loadCatalog();
      Billing.updateCartUI();
    } else if (tabId === 'inventory') {
      Inventory.loadTable();
    } else if (tabId === 'invoices') {
      Invoices.loadInvoices();
    } else if (tabId === 'storefront') {
      Storefront.loadProducts();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  bindTabNavigation() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  bindModalListeners() {
    // Backdrop clicks to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal(overlay.id);
        }
      });
    });

    // Close buttons
    document.querySelectorAll('.modal-close-btn, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) this.closeModal(modal.id);
      });
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) this.closeModal(activeModal.id);
      }
    });

    // Settings form
    const settingsForm = document.getElementById('shop-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => this.saveSettings(e));
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = '<i class="fas fa-info-circle" style="color: var(--accent-gold);"></i>';
    if (type === 'success') {
      icon = '<i class="fas fa-check-circle" style="color: var(--accent-emerald);"></i>';
    } else if (type === 'error') {
      icon = '<i class="fas fa-exclamation-circle" style="color: var(--accent-danger);"></i>';
    }

    toast.innerHTML = `
      ${icon}
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  startClock() {
    const clockEl = document.getElementById('live-clock-text');
    if (!clockEl) return;

    const update = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    };

    update();
    setInterval(update, 1000);
  }
};

/**
 * Authentication Helper for Client State & Navbar
 */
const AuthHelper = {
  getUser() {
    try {
      const raw = localStorage.getItem('surya_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  renderNavbarUser() {
    const user = this.getUser();
    const loginBtn = document.getElementById('btn-nav-login');
    const badge = document.getElementById('nav-user-profile-badge');
    const nameEl = document.getElementById('nav-user-name');

    if (user && user.username) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (badge) badge.style.display = 'inline-flex';
      if (nameEl) {
        const icon = user.role === 'admin' ? '<i class="fas fa-crown"></i>' : '<i class="fas fa-user"></i>';
        nameEl.innerHTML = `${icon} ${user.name || user.username} <small style="color: #9ca3af; text-transform: uppercase; font-size: 0.68rem;">(${user.role})</small>`;
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'inline-flex';
      if (badge) badge.style.display = 'none';
    }
  },

  logout() {
    localStorage.removeItem('surya_user');
    window.location.reload();
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

