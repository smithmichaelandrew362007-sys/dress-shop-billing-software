const { contextBridge, ipcRenderer } = require('electron');

// Expose protected desktop APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Printer Management
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printDirect: (options) => ipcRenderer.invoke('print-direct', options),
  saveToPDF: (options) => ipcRenderer.invoke('save-to-pdf', options),

  // Window actions
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Open external links safely
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
