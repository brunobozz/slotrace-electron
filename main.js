const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

const dbPath = path.join(app.getPath('userData'), 'database.json');

// Initialize database with default structure if it does not exist
async function initDatabase() {
  try {
    await fs.access(dbPath);
  } catch (err) {
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
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    backgroundColor: '#121212' // Dark color to prevent white flash during load
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Live Reload: Watch the 'src' directory recursively and reload on changes
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

  // Open DevTools if desired for debugging
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();

  // Register Database IPC handlers
  ipcMain.handle('db-get', async (event, key) => {
    try {
      const data = await fs.readFile(dbPath, 'utf8');
      const db = JSON.parse(data);
      return db[key];
    } catch (err) {
      console.error('Error reading database key:', key, err);
      return null;
    }
  });

  ipcMain.handle('db-set', async (event, key, value) => {
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
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
