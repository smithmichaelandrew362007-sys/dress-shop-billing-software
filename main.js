const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { startServer } = require('./server');

let mainWindow = null;
let serverInstance = null;
let activePort = 3000;

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

/**
 * Check if existing server is running or boot the embedded Express server
 */
async function ensureServerRunning() {
  try {
    const res = await fetch(`http://localhost:3000/api/settings`);
    if (res.ok) {
      console.log('⚡ Connected to existing boutique server on port 3000');
      activePort = 3000;
      return activePort;
    }
  } catch (err) {
    // Server not running, let's boot it
  }

  try {
    const srv = await startServer(3000);
    serverInstance = srv.server;
    activePort = srv.port;
    console.log(`✨ Embedded boutique server running on port ${activePort}`);
    return activePort;
  } catch (err) {
    console.error('Failed to start embedded server:', err);
    throw err;
  }
}

/**
 * Create the Main Desktop Application Window
 */
async function createWindow() {
  const port = await ensureServerRunning();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: 'SURYA TEXTILES — Dress Shop Billing & Catalog',
    backgroundColor: '#0a0d14',
    show: false, // Show once ready-to-show to prevent white flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // Load the web application running on local Express server
  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  setupAppMenu();
  setupIpcHandlers();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Custom Desktop Application Menu
 */
function setupAppMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Boutique',
      submenu: [
        {
          label: 'Storefront Website',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.executeJavaScript(`App.switchTab('storefront')`)
        },
        {
          label: 'Billing POS Counter',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.executeJavaScript(`App.switchTab('billing')`)
        },
        {
          label: 'Dress Inventory & DB',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.webContents.executeJavaScript(`App.switchTab('inventory')`)
        },
        {
          label: 'Invoices & Sales History',
          accelerator: 'CmdOrCtrl+4',
          click: () => mainWindow?.webContents.executeJavaScript(`App.switchTab('invoices')`)
        },
        { type: 'separator' },
        {
          label: 'Boutique Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.executeJavaScript(`App.openModal('settings-modal')`)
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit Application' }
      ]
    },
    {
      label: 'Billing',
      submenu: [
        {
          label: 'New Bill (Focus Barcode)',
          accelerator: 'F2',
          click: () => mainWindow?.webContents.executeJavaScript(`App.switchTab('billing'); document.getElementById('pos-search-input')?.focus();`)
        },
        {
          label: 'Generate & Print Bill',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => mainWindow?.webContents.executeJavaScript(`Billing.processCheckout('a4')`)
        },
        {
          label: 'Thermal POS Receipt',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => mainWindow?.webContents.executeJavaScript(`Billing.processCheckout('thermal')`)
        },
        {
          label: 'Clear Current Bill',
          accelerator: 'CmdOrCtrl+Backspace',
          click: () => mainWindow?.webContents.executeJavaScript(`Billing.clearCart()`)
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Refresh (F5)' },
        { role: 'forceReload', label: 'Hard Refresh' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
        { role: 'toggleDevTools', label: 'Developer Tools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Surya Textiles',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Surya Textiles Desktop',
              message: 'Surya Textiles — Luxury Dress Shop Billing & Catalog',
              detail: `Desktop Edition powered by Electron ${process.versions.electron}\nNode.js ${process.versions.node}\nChromium ${process.versions.chrome}\nDual Database Engine (Neon PostgreSQL / Local SQLite)`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Handle Desktop Native IPC Events (Printing, PDFs, Window Controls)
 */
function setupIpcHandlers() {
  // Get all installed physical/virtual printers
  ipcMain.handle('get-printers', async () => {
    if (!mainWindow) return [];
    try {
      return await mainWindow.webContents.getPrintersAsync();
    } catch (err) {
      console.error('Error fetching printers:', err);
      return [];
    }
  });

  // Direct silent or selected printer print
  ipcMain.handle('print-direct', async (event, options = {}) => {
    if (!mainWindow) return { success: false, error: 'Window not available' };

    return new Promise((resolve) => {
      mainWindow.webContents.print(
        {
          silent: options.silent || false,
          printBackground: true,
          deviceName: options.deviceName || '',
          margins: { marginType: 'printableArea' }
        },
        (success, failureReason) => {
          if (!success) {
            resolve({ success: false, error: failureReason });
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  });

  // Export Invoice directly to PDF file
  ipcMain.handle('save-to-pdf', async (event, { invoiceNumber = 'INV', customerName = 'Guest' } = {}) => {
    if (!mainWindow) return { success: false, error: 'Window not available' };

    try {
      const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Tax Invoice as PDF',
        defaultPath: `Invoice-${invoiceNumber}.pdf`,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      const pdfData = await mainWindow.webContents.printToPDF({
        marginsType: 0,
        printBackground: true,
        pageSize: 'A4'
      });

      await fs.promises.writeFile(filePath, pdfData);
      return { success: true, filePath };
    } catch (err) {
      console.error('Error saving PDF:', err);
      return { success: false, error: err.message };
    }
  });

  // Window Controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());

  // Open external links safely
  ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
    return true;
  });
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverInstance) {
    serverInstance.close();
  }
});
