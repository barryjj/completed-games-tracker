import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3"; // <-- Node-side import

const isDev =
  process.env.NODE_ENV === "development" &&
  !!process.env.VITE_DEV_SERVER;

const projectRoot = process.cwd();


let mainWindow: BrowserWindow | null = null;
let db: ReturnType<typeof Database>; // loosely typed DB object

function initDatabase() {
  const userDataPath = app.getPath("userData");
  fs.mkdirSync(userDataPath, { recursive: true });
  const dbPath = path.join(userDataPath, "app.db");
  console.log("Opening DB at:", dbPath);
  db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

function createWindow() {
// Electron preload path
const preloadPath = path.join(projectRoot, "dist", "preload.js");

console.log("Electron preload path:", preloadPath);

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
    console.log("Loading Vite dev server:", process.env.VITE_DEV_SERVER);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER!);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../index.html"));
  }

  mainWindow.webContents.once("dom-ready", () => {
    console.log("Renderer DOM ready");
  });

  mainWindow.webContents.once("did-finish-load", () => {
    console.log("Renderer did-finish-load");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App lifecycle
app.on("ready", () => {
  console.log("App ready. isDev:", isDev);
  initDatabase();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

// IPC handlers
ipcMain.handle("load-api-key", () => {
  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = 'steam_api_key'")
      .get();
    return row?.value ?? null;
  } catch (err) {
    console.error("load-api-key error:", err);
    return null;
  }
});

ipcMain.handle("save-api-key", (_evt, key: string) => {
  try {
    db.prepare(`
      INSERT INTO settings (key, value)
      VALUES ('steam_api_key', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key);
    return true;
  } catch (err) {
    console.error("save-api-key error:", err);
    return false;
  }
});