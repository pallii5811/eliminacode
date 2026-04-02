const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getMode: () => process.argv.find(a => a.startsWith('--mode='))?.split('=')[1] || 'launcher',
  isElectron: true,
});
