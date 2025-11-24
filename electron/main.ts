import { app, BrowserWindow } from 'electron';
import path from 'path';

import { initDatabase } from './modules/database';
import { registerIpcHandlers } from './modules/ipcHandlers';
import { registerSteamLogin } from './modules/steamLogin';

const PROTOCOL = 'completedgames';
const isDev = process.env.NODE_ENV === 'development' && !!process.env.VITE_DEV_SERVER;

const projectRoot = process.cwd();
let mainWindow: BrowserWindow | null = null;

// -------------------------
// Electron window creation
// -------------------------
function createWindow() {
  const preloadPath = path.join(projectRoot, 'dist', 'preload.js');
  console.log('Electron preload path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    console.log('Loading Vite dev server:', process.env.VITE_DEV_SERVER);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER!);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }

  mainWindow.webContents.once('dom-ready', () => {
    console.log('Renderer DOM ready');
  });

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Renderer did-finish-load');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -------------------------
// App lifecycle
// -------------------------
app.on('ready', () => {
  console.log('App ready. isDev:', isDev);

  try {
    if (!app.isDefaultProtocolClient(PROTOCOL)) {
      const ok = app.setAsDefaultProtocolClient(PROTOCOL);
      console.log(`Attempted to register custom protocol: ${PROTOCOL}:// — success:`, ok);
    } else {
      console.log(`Custom protocol ${PROTOCOL}:// is already registered`);
    }
  } catch (err) {
    console.error('Protocol registration error:', err);
  }

  initDatabase();
  createWindow();

  registerIpcHandlers();
  registerSteamLogin(mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
