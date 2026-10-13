/**
 * API Service Client for Dress Shop Billing & Website
 */
const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
      throw err;
    }
  },

  // Settings
  getSettings() {
    return this.request('/settings');
  },
  updateSettings(data) {
    return this.request('/settings', { method: 'PUT', body: JSON.stringify(data) });
  },

  // Categories
  getCategories() {
    return this.request('/categories');
  },

  // Products / Dresses
  getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.gender) query.append('gender', params.gender);
    if (params.sort) query.append('sort', params.sort);
    if (params.featured) query.append('featured', params.featured);
    return this.request(`/products?${query.toString()}`);
  },

  getProduct(id) {
    return this.request(`/products/${id}`);
  },

  createProduct(data) {
    return this.request('/products', { method: 'POST', body: JSON.stringify(data) });
  },

  updateProduct(id, data) {
    return this.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteProduct(id) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  },

  // Customers
  getCustomers(search = '') {
    return this.request(`/customers?search=${encodeURIComponent(search)}`);
  },

  createCustomer(data) {
    return this.request('/customers', { method: 'POST', body: JSON.stringify(data) });
  },

  // Invoices & Billing
  getInvoices(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.date) query.append('date', params.date);
    return this.request(`/invoices?${query.toString()}`);
  },

  getInvoice(id) {
    return this.request(`/invoices/${id}`);
  },

  createInvoice(billData) {
    return this.request('/invoices', { method: 'POST', body: JSON.stringify(billData) });
  },

  // Analytics
  getAnalytics() {
    return this.request('/analytics');
  }
};
