const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let SerialPort = null;
let ReadlineParser = null;

try {
  const sp = require('serialport');
  SerialPort = sp.SerialPort;
  if (sp.ReadlineParser) {
    ReadlineParser = sp.ReadlineParser;
  } else {
    ReadlineParser = require('@serialport/parser-readline').ReadlineParser;
  }
} catch (err) {
  console.warn('[Serial] serialport module failed to load:', err.message);
}

let serialPortInstance = null;
let mockInterval = null;
let currentPortPath = null;
let currentBaudRate = null;

async function closeActivePort() {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
  if (serialPortInstance) {
    return new Promise((resolve) => {
      try {
        if (serialPortInstance.isOpen) {
          serialPortInstance.close(() => {
            serialPortInstance = null;
            resolve();
          });
        } else {
          serialPortInstance = null;
          resolve();
        }
      } catch (err) {
        console.error('Error closing serial port:', err);
        serialPortInstance = null;
        resolve();
      }
    });
  }
  return Promise.resolve();
}


// Set user-facing and directory application name explicitly to SlotRace
app.name = 'SlotRace';

const dbPath = path.join(app.getPath('userData'), 'database.json');
const oldDbPath = path.join(app.getPath('appData'), 'slotrace-electron', 'database.json');

// Initialize database with default structure if it does not exist (migrating from old folder if available)
async function initDatabase() {
  try {
    await fs.access(dbPath);
  } catch (err) {
    // New database does not exist. Check if we can migrate from old database!
    try {
      await fs.access(oldDbPath);
      // Old database exists! Copy it over to the new path.
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      const oldData = await fs.readFile(oldDbPath, 'utf8');
      await fs.writeFile(dbPath, oldData, 'utf8');
      console.log('[Migration] Database successfully migrated from slotrace-electron to SlotRace!');
      return;
    } catch (migrateErr) {
      // Old database doesn't exist, proceed with default initialization
    }

    const defaultData = {
      settings: {
        local_name: ""
      },
      drivers: [],
      cars: [],
      tracks: []
    };
    try {
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
      console.log('Database initialized successfully at:', dbPath);
    } catch (writeErr) {
      console.error('Failed to initialize database file:', writeErr);
    }
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    backgroundColor: '#121212' // Dark color to prevent white flash during load
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Live Reload: Watch the 'src' directory recursively and reload on changes (only in development)
  if (!app.isPackaged) {
    const fsSync = require('fs');
    const srcPath = path.join(__dirname, 'src');
    
    let reloadTimeout;
    fsSync.watch(srcPath, { recursive: true }, (eventType, filename) => {
      if (filename) {
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
          try {
            if (!mainWindow.isDestroyed()) {
              console.log(`[Watcher] File modified: ${filename}. Reloading application...`);
              mainWindow.webContents.reloadIgnoringCache();
            }
          } catch (err) {
            console.error('[Watcher] Failed to reload window:', err);
          }
        }, 100); // 100ms debounce to prevent multiple triggers
      }
    });
  }

  // Open DevTools if desired for debugging
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();

  // Database operation serialization queue to prevent race conditions on concurrent reads/writes
  let dbQueue = Promise.resolve();

  // Register Database IPC handlers
  ipcMain.handle('db-get', (event, key) => {
    const nextOp = dbQueue.then(async () => {
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        const db = JSON.parse(data);
        return db[key];
      } catch (err) {
        console.error('Error reading database key:', key, err);
        return null;
      }
    }).catch(err => {
      console.error('Database queue error on get:', err);
      return null;
    });
    dbQueue = nextOp.then(() => {}); // advance the queue
    return nextOp;
  });

  ipcMain.handle('db-set', (event, key, value) => {
    const nextOp = dbQueue.then(async () => {
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        const db = JSON.parse(data);
        db[key] = value;
        await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8');
        return true;
      } catch (err) {
        console.error('Error writing database key:', key, err);
        return false;
      }
    }).catch(err => {
      console.error('Database queue error on set:', err);
      return false;
    });
    dbQueue = nextOp.then(() => {}); // advance the queue
    return nextOp;
  });

  // Provide synchronous application version safely to preload script
  ipcMain.on('get-app-version-sync', (event) => {
    event.returnValue = app.getVersion();
  });

  // Helper to notify renderer of status changes
  function notifyStatusChanged(sender, status) {
    if (sender && !sender.isDestroyed()) {
      sender.send('serial-status-changed', {
        status: status,
        path: currentPortPath,
        baudRate: currentBaudRate
      });
    }
  }

  // Register Serial IPC handlers
  ipcMain.handle('serial-list-ports', async () => {
    if (SerialPort) {
      try {
        const ports = await SerialPort.list();
        return ports;
      } catch (err) {
        console.error('[Serial] Failed to list ports:', err);
        return [];
      }
    } else {
      console.warn('[Serial] SerialPort module not loaded. Cannot list ports.');
      return [];
    }
  });

  ipcMain.handle('serial-status', () => {
    const status = serialPortInstance && serialPortInstance.isOpen ? 'connected' : (mockInterval ? 'connected' : 'disconnected');
    return {
      status,
      path: currentPortPath,
      baudRate: currentBaudRate
    };
  });

  ipcMain.handle('serial-disconnect', async (event) => {
    await closeActivePort();
    notifyStatusChanged(event.sender, 'disconnected');
    currentPortPath = null;
    currentBaudRate = null;
    return true;
  });

  ipcMain.handle('serial-connect', async (event, path, baudRate) => {
    await closeActivePort();

    currentPortPath = path;
    currentBaudRate = baudRate;

    if (path === 'SIMULAÇÃO') {
      mockInterval = setInterval(() => {
        if (event.sender && !event.sender.isDestroyed()) {
          const mockEvents = [
            `LANE:1;TIME:${(2.5 + Math.random() * 2).toFixed(4)}`,
            `LANE:2;TIME:${(2.5 + Math.random() * 2).toFixed(4)}`,
            `LANE:3;TIME:${(2.5 + Math.random() * 2).toFixed(4)}`,
            `LANE:4;TIME:${(2.5 + Math.random() * 2).toFixed(4)}`,
            `PING;STATUS:OK`
          ];
          const randEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
          event.sender.send('serial-data', randEvent);
        }
      }, 2000);

      notifyStatusChanged(event.sender, 'connected');
      return { success: true, mode: 'simulation' };
    }

    if (!SerialPort || !ReadlineParser) {
      return { success: false, error: 'Módulo SerialPort nativo não carregado ou indisponível.' };
    }

    return new Promise((resolve) => {
      try {
        serialPortInstance = new SerialPort({
          path: path,
          baudRate: parseInt(baudRate) || 9600,
          autoOpen: false
        });

        const parser = serialPortInstance.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        parser.on('data', (data) => {
          if (event.sender && !event.sender.isDestroyed()) {
            event.sender.send('serial-data', data);
          }
        });

        serialPortInstance.open((err) => {
          if (err) {
            console.error('[Serial] Error opening port:', err);
            resolve({ success: false, error: err.message });
          } else {
            notifyStatusChanged(event.sender, 'connected');
            resolve({ success: true, mode: 'hardware' });
          }
        });

        serialPortInstance.on('close', () => {
          notifyStatusChanged(event.sender, 'disconnected');
        });

        serialPortInstance.on('error', (err) => {
          console.error('[Serial] Port error:', err);
          if (event.sender && !event.sender.isDestroyed()) {
            event.sender.send('serial-data', `[ERRO] ${err.message}`);
          }
        });

      } catch (err) {
        console.error('[Serial] Connection exception:', err);
        resolve({ success: false, error: err.message });
      }
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', async () => {
  await closeActivePort();
});
