const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  appVersion: '1.0.0',
  db: {
    get: (key) => ipcRenderer.invoke('db-get', key),
    set: (key, value) => ipcRenderer.invoke('db-set', key, value)
  }
});
