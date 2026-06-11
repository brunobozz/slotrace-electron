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
  },
  serial: {
    listPorts: () => ipcRenderer.invoke('serial-list-ports'),
    connect: (path, baudRate) => ipcRenderer.invoke('serial-connect', path, baudRate),
    disconnect: () => ipcRenderer.invoke('serial-disconnect'),
    getStatus: () => ipcRenderer.invoke('serial-status'),
    onData: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('serial-data', listener);
      return () => ipcRenderer.off('serial-data', listener);
    },
    onStatusChange: (callback) => {
      const listener = (event, status) => callback(status);
      ipcRenderer.on('serial-status-changed', listener);
      return () => ipcRenderer.off('serial-status-changed', listener);
    }
  }
});
