const { contextBridge, ipcRenderer } = require('electron');

let appVersion = '1.0.0';
try {
  appVersion = ipcRenderer.sendSync('get-app-version-sync') || '1.0.0';
} catch (err) {
  console.error('Failed to get app version synchronously in preload:', err);
}

contextBridge.exposeInMainWorld('electronAPI', {
  appVersion: appVersion,
  db: {
    get: (key) => ipcRenderer.invoke('db-get', key),
    set: (key, value) => ipcRenderer.invoke('db-set', key, value)
  }
});
