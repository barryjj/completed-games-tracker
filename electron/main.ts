import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const isDev =
  process.env.NODE_ENV === "development" &&
  !!process.env.VITE_DEV_SERVER;

let mainWindow: BrowserWindow | null = null;
let db: Database.Database;

// initialize DB in userData
function initDatabase() {
  const userDataPath = app.getPath("userData");
  fs.mkdirSync(userDataPath, { recursive: true });
  const dbPath = path.join(userDataPath, "settings.db");
  db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

// create window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER!);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// app lifecycle
app.whenReady().then(() => {
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
    const row = db.prepare("SELECT value FROM settings WHERE key = 'steam_api_key'").get();
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
