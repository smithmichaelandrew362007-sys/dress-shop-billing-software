/**
 * Invoices, Sales History & Print Engine Component
 * Handles historical bill management, re-printing, and rendering A4 / Thermal receipts
 */
const Invoices = {
  invoices: [],
  searchQuery: '',
  dateFilter: '',

  async init() {
    await this.loadInvoices();
    this.bindEvents();
  },

  async loadInvoices() {
    try {
      const tbody = document.getElementById('invoices-table-tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading billing records...</td></tr>`;
      }

      const res = await API.getInvoices({
        search: this.searchQuery,
        date: this.dateFilter
      });

      if (res.success) {
        this.invoices = res.data;
        this.renderTable();
        this.loadAnalytics();
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  },

  async loadAnalytics() {
    try {
      const res = await API.getAnalytics();
      if (!res.success) return;
      const data = res.data;
      const currency = App.settings?.currency || '₹';

      const elTodayRev = document.getElementById('sales-stat-today-rev');
      const elTotalRev = document.getElementById('sales-stat-total-rev');
      const elTotalBills = document.getElementById('sales-stat-total-bills');
      const elAvgBill = document.getElementById('sales-stat-avg-bill');

      if (elTodayRev) elTodayRev.textContent = `${currency}${Number(data.today_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      if (elTotalRev) elTotalRev.textContent = `${currency}${Number(data.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      if (elTotalBills) elTotalBills.textContent = data.total_bills || 0;
      
      const avg = data.total_bills > 0 ? (data.total_revenue / data.total_bills) : 0;
      if (elAvgBill) elAvgBill.textContent = `${currency}${avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

      // Top dresses
      const topContainer = document.getElementById('top-selling-dresses-list');
      if (topContainer && data.top_dresses) {
        if (data.top_dresses.length === 0) {
          topContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No sales data yet.</div>';
        } else {
          let html = '';
          data.top_dresses.forEach((d, idx) => {
            html += `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <span style="font-weight: 700; color: var(--accent-gold); width: 18px;">#${idx + 1}</span>
                  <span style="font-weight: 500; color: var(--text-primary);">${d.product_name}</span>
                </div>
                <div style="text-align: right;">
                  <strong style="color: var(--accent-gold);">${currency}${Number(d.total_sales).toLocaleString()}</strong>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${d.units_sold} sold</div>
                </div>
              </div>
            `;
          });
          topContainer.innerHTML = html;
        }
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  },

  renderTable() {
    const tbody = document.getElementById('invoices-table-tbody');
    if (!tbody) return;

    if (this.invoices.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            No invoice records found.
          </td>
        </tr>
      `;
      return;
    }

    const currency = App.settings?.currency || '₹';

    let html = '';
    this.invoices.forEach(inv => {
      const dateStr = new Date(inv.created_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      html += `
        <tr>
          <td>
            <strong style="font-family: var(--font-mono); color: var(--accent-gold);">${inv.invoice_number}</strong>
          </td>
          <td style="font-size: 0.82rem; color: var(--text-muted);">
            ${dateStr}
          </td>
          <td>
            <span style="font-weight: 600; color: var(--text-primary);">${inv.customer_name || 'Walk-in Guest'}</span>
            ${inv.customer_phone ? `<div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${inv.customer_phone}</div>` : ''}
          </td>
          <td>
            <span style="font-size: 0.78rem; background: var(--bg-surface-elevated); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-subtle);">
              ${inv.payment_method}
            </span>
          </td>
          <td style="font-size: 0.82rem; color: var(--text-secondary); font-family: var(--font-mono);">
            ${currency}${Number(inv.subtotal).toLocaleString()}
          </td>
          <td style="font-weight: 700; color: var(--accent-gold); font-size: 1rem; font-family: var(--font-mono);">
            ${currency}${Number(inv.grand_total).toLocaleString()}
          </td>
          <td>
            <span class="invoice-badge-paid"><i class="fas fa-check-circle"></i> PAID</span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm btn-icon-only" onclick="Invoices.viewInvoiceModal(${inv.id})" title="View Bill Details">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-outline-gold btn-sm btn-icon-only" onclick="Invoices.printInvoiceById(${inv.id}, 'a4')" title="Print A4 Tax Invoice">
                <i class="fas fa-print"></i>
              </button>
              <button class="btn btn-secondary btn-sm btn-icon-only" onclick="Invoices.printInvoiceById(${inv.id}, 'thermal')" title="Print Thermal Receipt (80mm)">
                <i class="fas fa-receipt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  async viewInvoiceModal(id) {
    try {
      const res = await API.getInvoice(id);
      if (!res.success) return;
      const inv = res.data;
      const currency = inv.settings?.currency || '₹';

      const modalBody = document.getElementById('view-invoice-modal-body');
      if (!modalBody) return;

      const dateStr = new Date(inv.created_at).toLocaleString();

      let itemsHtml = '';
      inv.items.forEach(it => {
        itemsHtml += `
          <tr>
            <td>
              <strong>${it.product_name}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${it.sku} | Size: ${it.size}</div>
            </td>
            <td style="text-align: center;">${it.quantity}</td>
            <td style="text-align: right; font-family: var(--font-mono);">${currency}${Number(it.unit_price).toLocaleString()}</td>
            <td style="text-align: right; font-family: var(--font-mono); font-weight: 700; color: var(--accent-gold);">${currency}${Number(it.line_total).toLocaleString()}</td>
          </tr>
        `;
      });

      modalBody.innerHTML = `
        <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">TAX INVOICE</div>
            <h2 style="font-size: 1.5rem; margin: 0.2rem 0; font-family: var(--font-mono);">${inv.invoice_number}</h2>
            <div style="font-size: 0.82rem; color: var(--text-muted);">${dateStr}</div>
          </div>
          <div style="text-align: right;">
            <span class="invoice-badge-paid" style="font-size: 0.85rem; padding: 4px 12px;"><i class="fas fa-check"></i> PAID</span>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 5px;">Method: <strong>${inv.payment_method}</strong></div>
          </div>
        </div>

        <div style="background: var(--bg-surface-elevated); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">BILLED TO</div>
          <div style="font-weight: 600; font-size: 1rem;">${inv.customer_name || 'Walk-in Guest'}</div>
          ${inv.customer_phone ? `<div style="font-size: 0.82rem; color: var(--text-secondary); font-family: var(--font-mono);">${inv.customer_phone}</div>` : ''}
        </div>

        <div style="margin-bottom: 1.25rem; max-height: 240px; overflow-y: auto;">
          <table class="modern-table" style="font-size: 0.84rem;">
            <thead>
              <tr>
                <th>Dress Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem; color: var(--text-secondary);">
            <span>Subtotal:</span>
            <span>${currency}${Number(inv.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          ${inv.discount_amount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem; color: var(--accent-emerald);">
              <span>Discount (${inv.discount_type === 'percentage' ? `${inv.discount_value}%` : 'Flat'}):</span>
              <span>-${currency}${Number(inv.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">
            <span>GST / Tax (${inv.tax_rate}%):</span>
            <span>+${currency}${Number(inv.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.35rem; font-weight: 700; color: var(--accent-gold); border-top: 1px dashed var(--border-gold); padding-top: 0.6rem;">
            <span>Grand Total:</span>
            <span>${currency}${Number(inv.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-primary" style="flex: 1;" onclick="Invoices.printInvoiceById(${inv.id}, 'a4')">
            <i class="fas fa-print"></i> Print A4 Invoice
          </button>
          <button class="btn btn-secondary" style="flex: 1;" onclick="Invoices.printInvoiceById(${inv.id}, 'thermal')">
            <i class="fas fa-receipt"></i> Print Thermal Receipt
          </button>
          ${window.electronAPI?.isElectron ? `
            <button class="btn btn-outline-gold" style="flex: 1;" onclick="Invoices.savePdfById(${inv.id})">
              <i class="fas fa-file-pdf"></i> Save as PDF
            </button>
          ` : ''}
        </div>
      `;

      App.openModal('view-invoice-modal');
    } catch (err) {
      console.error('Failed to view invoice:', err);
    }
  },

  async printInvoiceById(id, format = 'a4') {
    try {
      const res = await API.getInvoice(id);
      if (res.success) {
        this.printInvoice(res.data, format);
      }
    } catch (err) {
      console.error('Failed to print invoice by id:', err);
    }
  },

  async savePdfById(id) {
    try {
      const res = await API.getInvoice(id);
      if (!res.success) return;
      const inv = res.data;

      // Render the A4 printable format first so the PDF engine captures the invoice layout
      this.renderPrintableInvoice(inv, 'a4');

      if (window.electronAPI?.saveToPDF) {
        App.showToast('Select destination to save PDF...', 'info');
        const pdfResult = await window.electronAPI.saveToPDF({
          invoiceNumber: inv.invoice_number,
          customerName: inv.customer_name
        });
        if (pdfResult.success) {
          App.showToast(`Invoice PDF saved successfully!`, 'success');
        } else if (!pdfResult.canceled) {
          App.showToast(`PDF export failed: ${pdfResult.error}`, 'error');
        }
      } else {
        // Fallback to browser print dialog
        window.print();
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  },

  printInvoice(invoice, format = 'a4') {
    this.renderPrintableInvoice(invoice, format);
    setTimeout(() => {
      window.print();
    }, 200);
  },

  renderPrintableInvoice(invoice, format = 'a4') {
    const container = document.getElementById('printable-invoice-container');
    if (!container) return;

    const s = invoice.settings || App.settings || {};
    const currency = s.currency || '₹';
    const dateFormatted = new Date(invoice.created_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (format === 'thermal') {
      // 80mm POS Thermal Receipt Format
      let itemsListHtml = '';
      invoice.items.forEach(it => {
        itemsListHtml += `
          <tr>
            <td colspan="2" style="font-weight: bold;">${it.product_name}</td>
          </tr>
          <tr>
            <td>${it.quantity} x ${currency}${it.unit_price} (${it.size})</td>
            <td style="text-align: right; font-weight: bold;">${currency}${it.line_total}</td>
          </tr>
        `;
      });

      container.innerHTML = `
        <div class="thermal-receipt">
          <div class="print-store-name">${s.store_name || 'SURYA TEXTILES A BILLING SOFTWARE'}</div>
          <div class="print-center" style="font-size: 10px; margin-bottom: 4px;">${s.store_tagline || 'Premium Silks & Textiles'}</div>
          <div class="print-center" style="font-size: 9px; line-height: 1.3;">${s.address || ''}</div>
          <div class="print-center" style="font-size: 9px;">Phone: ${s.phone || ''} | GSTIN: ${s.gstin || ''}</div>
          <hr />
          <div><strong>Bill No:</strong> ${invoice.invoice_number}</div>
          <div><strong>Date:</strong> ${dateFormatted}</div>
          <div><strong>Customer:</strong> ${invoice.customer_name || 'Guest'} ${invoice.customer_phone ? `(${invoice.customer_phone})` : ''}</div>
          <hr />
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left;">Item Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
          </table>
          <hr />
          <table>
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">${currency}${Number(invoice.subtotal).toFixed(2)}</td>
            </tr>
            ${invoice.discount_amount > 0 ? `
              <tr>
                <td>Discount:</td>
                <td style="text-align: right;">-${currency}${Number(invoice.discount_amount).toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr>
              <td>GST (${invoice.tax_rate}%):</td>
              <td style="text-align: right;">+${currency}${Number(invoice.tax_amount).toFixed(2)}</td>
            </tr>
            <tr style="font-size: 14px; font-weight: bold;">
              <td>TOTAL:</td>
              <td style="text-align: right;">${currency}${Number(invoice.grand_total).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Payment (${invoice.payment_method}):</td>
              <td style="text-align: right;">PAID</td>
            </tr>
          </table>
          <hr />
          <div class="print-center" style="font-size: 9px; margin-top: 6px;">
            ${s.receipt_footer || 'Thank you for shopping with us!'}
          </div>
          <div class="print-center" style="font-size: 8px; margin-top: 4px; color: #555;">
            * Original Tax Invoice copy *
          </div>
        </div>
      `;
    } else {
      // Standard A4 Professional Tax Invoice Format
      let rowsHtml = '';
      invoice.items.forEach((it, idx) => {
        rowsHtml += `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td>
              <strong>${it.product_name}</strong>
              <div style="font-size: 10px; color: #666;">SKU: ${it.sku} | Size: ${it.size} ${it.color ? `| Color: ${it.color}` : ''}</div>
            </td>
            <td class="text-center">${it.size}</td>
            <td class="text-center">${it.quantity}</td>
            <td class="text-right">${currency}${Number(it.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td class="text-right"><strong>${currency}${Number(it.line_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
          </tr>
        `;
      });

      container.innerHTML = `
        <div class="a4-invoice">
          <div class="print-header">
            <div>
              <div class="print-store-name">${s.store_name || 'SURYA TEXTILES A BILLING SOFTWARE'}</div>
              <div class="print-store-tagline">${s.store_tagline || 'Premium Silks, Heritage Weaves & Ready-to-Wear Textiles'}</div>
              <div class="print-store-details">
                ${s.address || 'Fashion Promenade'}<br>
                Tel: ${s.phone || ''} | Email: ${s.email || ''}<br>
                <strong>GSTIN:</strong> ${s.gstin || '33AABCT9988C1ZR'}
              </div>
            </div>
            <div class="print-inv-meta">
              <span class="print-inv-badge">TAX INVOICE</span>
              <div class="print-inv-number">${invoice.invoice_number}</div>
              <div class="print-inv-date">Date & Time: ${dateFormatted}</div>
              <div style="font-size: 11px; margin-top: 4px;">Payment: <strong>${invoice.payment_method} (PAID)</strong></div>
            </div>
          </div>

          <div class="print-parties-grid">
            <div class="print-party-box">
              <h4>Billed To (Customer Details)</h4>
              <p>${invoice.customer_name || 'Walk-in Guest'}</p>
              ${invoice.customer_phone ? `<small>Contact: ${invoice.customer_phone}</small><br>` : ''}
              <small>Status: Completed / In-Store Purchase</small>
            </div>
            <div class="print-party-box">
              <h4>Dispatch / Counter Info</h4>
              <p>Main Boutique Register #1</p>
              <small>Cashier: System Administrator</small><br>
              <small>Currency: INR (${currency})</small>
            </div>
          </div>

          <table class="print-table">
            <thead>
              <tr>
                <th class="text-center" style="width: 40px;">#</th>
                <th>Dress Item & Description</th>
                <th class="text-center" style="width: 70px;">Size</th>
                <th class="text-center" style="width: 50px;">Qty</th>
                <th class="text-right" style="width: 110px;">Unit Price</th>
                <th class="text-right" style="width: 110px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="print-totals-grid">
            <div class="print-notes-box">
              <strong>Terms & Conditions:</strong>
              <p style="margin-top: 4px;">
                1. Garment exchanges permitted within 7 days against original invoice.<br>
                2. Price tags and original condition must remain intact.<br>
                3. Altered or bespoke tailored garments cannot be exchanged.
              </p>
              ${invoice.notes ? `<div style="margin-top: 8px;"><strong>Note:</strong> ${invoice.notes}</div>` : ''}
            </div>

            <div>
              <table class="print-calc-table">
                <tr>
                  <td>Subtotal:</td>
                  <td class="text-right">${currency}${Number(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                ${invoice.discount_amount > 0 ? `
                  <tr>
                    <td>Discount (${invoice.discount_type === 'percentage' ? `${invoice.discount_value}%` : 'Flat'}):</td>
                    <td class="text-right" style="color: #008000;">-${currency}${Number(invoice.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td>GST / Sales Tax (${invoice.tax_rate}%):</td>
                  <td class="text-right">+${currency}${Number(invoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr class="grand-total-row">
                  <td>GRAND TOTAL:</td>
                  <td class="text-right">${currency}${Number(invoice.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="print-footer">
            <div class="print-terms">
              ${s.receipt_footer || 'Thank you for your patronage! Visit again soon.'}
            </div>
            <div class="print-sign-box">
              Authorized Signatory<br>
              <small>SURYA TEXTILES A BILLING SOFTWARE</small>
            </div>
          </div>
        </div>
    }
  },

  bindEvents() {
    const searchInput = document.getElementById('invoices-search-input');
    if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.searchQuery = e.target.value.trim();
          this.loadInvoices();
        }, 300);
      });
    }

    const dateInput = document.getElementById('invoices-date-input');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        this.dateFilter = e.target.value;
        this.loadInvoices();
      });
    }
  }
};
