import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const PROTOCOL = "completedgames";
const PROTOCOL_CALLBACK_PATH = "auth";

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

  // Settings table includes an autoincrement id per your preference
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    );
  `);

  // Users table - updated snake_case columns, table_id PK
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      steam_id64 TEXT UNIQUE NOT NULL,
      persona_name TEXT,
      avatar_full TEXT,
      avatar_medium TEXT,
      avatar TEXT,
      profile_url TEXT,
      real_name TEXT,
      visibility INTEGER,
      time_created INTEGER,
      last_logoff INTEGER,
      loc_country_code TEXT,
      loc_state_code TEXT,
      loc_city_id INTEGER,
      updated_at INTEGER
    );
  `);
}

/**
 * Helper: get stored Steam API key from settings table
 */
function getStoredApiKey(): string | null {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'steam_api_key'").get();
    return row?.value ?? null;
  } catch (err) {
    console.error("getStoredApiKey error:", err);
    return null;
  }
}

/**
 * Helper: upsert user record from Steam profile
 */
function upsertUser(profile: any) {
  try {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO users (
        steam_id64, persona_name, avatar_full, avatar_medium, avatar,
        profile_url, real_name, visibility, time_created, last_logoff,
        loc_country_code, loc_state_code, loc_city_id, updated_at
      ) VALUES (
        @steam_id64, @persona_name, @avatar_full, @avatar_medium, @avatar,
        @profile_url, @real_name, @visibility, @time_created, @last_logoff,
        @loc_country_code, @loc_state_code, @loc_city_id, @updated_at
      )
      ON CONFLICT(steam_id64) DO UPDATE SET
        persona_name=excluded.persona_name,
        avatar_full=excluded.avatar_full,
        avatar_medium=excluded.avatar_medium,
        avatar=excluded.avatar,
        profile_url=excluded.profile_url,
        real_name=excluded.real_name,
        visibility=excluded.visibility,
        time_created=excluded.time_created,
        last_logoff=excluded.last_logoff,
        loc_country_code=excluded.loc_country_code,
        loc_state_code=excluded.loc_state_code,
        loc_city_id=excluded.loc_city_id,
        updated_at=excluded.updated_at
    `).run({
      steam_id64: profile.steamid,
      persona_name: profile.personaname ?? null,
      avatar_full: profile.avatarfull ?? null,
      avatar_medium: profile.avatarmedium ?? null,
      avatar: profile.avatar ?? null,
      profile_url: profile.profileurl ?? null,
      real_name: profile.realname ?? null,
      visibility: profile.communityvisibilitystate ?? null,
      time_created: profile.timecreated ?? null,
      last_logoff: profile.lastlogoff ?? null,
      loc_country_code: profile.loccountrycode ?? null,
      loc_state_code: profile.locstatecode ?? null,
      loc_city_id: profile.loccityid ?? null,
      updated_at: now,
    });
  } catch (err) {
    console.error("upsertUser error:", err);
  }
}

/**
 * Helper: fetch Steam profile via Web API
 */
async function fetchSteamProfile(apiKey: string, steamId64: string): Promise<any | null> {
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(apiKey)}&steamids=${encodeURIComponent(steamId64)}`;
    console.log("Fetching Steam profile:", url);
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Steam profile fetch failed:", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    const players = data?.response?.players;
    if (!players || players.length === 0) {
      console.warn("No player data returned for:", steamId64);
      return null;
    }
    return players[0];
  } catch (err) {
    console.error("fetchSteamProfile error:", err);
    return null;
  }
}

/**
 * Helper: get a user by steam_id64
 */
function getUserBySteamId(steam_id64: string) {
  try {
    const row = db.prepare("SELECT * FROM users WHERE steam_id64 = ?").get(steam_id64);
    return row ?? null;
  } catch (err) {
    console.error("getUserBySteamId error:", err);
    return null;
  }
}

/**
 * Helper: get first user in the users table (for setup page)
 */
function getUser() {
  try {
    const row = db.prepare("SELECT * FROM users LIMIT 1").get();
    return row ?? null;
  } catch (err) {
    console.error("getUser error:", err);
    return null;
  }
}

/**
 * Helper: delete user by user_id
 */
function deleteUser(user_id: number) {
  try {
    const info = db.prepare("DELETE FROM users WHERE user_id = ?").run(user_id);
    return info.changes > 0;
  } catch (err) {
    console.error("deleteUser error:", err);
    return false;
  }
}

// -------------------------
// Electron window creation
// -------------------------
function createWindow() {
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

// -------------------------
// App lifecycle
// -------------------------
app.on("ready", () => {
  console.log("App ready. isDev:", isDev);

  try {
    if (!app.isDefaultProtocolClient(PROTOCOL)) {
      const ok = app.setAsDefaultProtocolClient(PROTOCOL);
      console.log(`Attempted to register custom protocol: ${PROTOCOL}:// — success:`, ok);
    } else {
      console.log(`Custom protocol ${PROTOCOL}:// is already registered`);
    }
  } catch (err) {
    console.error("Protocol registration error:", err);
  }

  initDatabase();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

// -------------------------
// IPC handlers
// -------------------------
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

ipcMain.handle("get-user-by-steam-id", (_evt, steam_id64: string) => {
  return getUserBySteamId(steam_id64);
});

ipcMain.handle("get-user", () => {
  return getUser();
});

ipcMain.handle("delete-user", (_evt, user_id: number) => {
  return deleteUser(user_id);
});

ipcMain.handle("open-external-browser", async (_event, url: string) => {
  console.log("main.ts: openExternalBrowser called for", url);
  try {
    await shell.openExternal(url);
    return true;
  } catch (err) {
    console.error("Failed to open external URL:", err);
    return false;
  }
});

// -------------------------
// Steam login IPC (local http callback)
// -------------------------
ipcMain.handle("open-steam-login", async () => {
  if (!mainWindow) {
    console.warn("open-steam-login: mainWindow not available");
    return;
  }

  return new Promise<boolean>((resolve) => {
    let steamLoginWindow: BrowserWindow | null = null;
    const http = require("http");
    const url = require("url");

    const server = http.createServer(async (req: any, res: any) => {
      try {
        if (!req.url) return;
        const parsed = url.parse(req.url, true);
        if (parsed.pathname === "/auth") {
          const claimed = (parsed.query["openid.claimed_id"] || parsed.query["openid.identity"]);
          const claimedStr = typeof claimed === "string" ? claimed : Array.isArray(claimed) ? claimed[0] : String(claimed ?? "");
          const match = claimedStr.match(/(?:\/id\/|\/openid\/id\/|\/profiles\/)(\d+)$/);
          const steam_id64 = match ? match[1] : null;

          console.log("Local callback hit. claimed:", claimedStr, "steam_id64:", steam_id64);

          if (steam_id64) {
            const apiKey = getStoredApiKey();
            if (!apiKey) {
              console.error("No Steam API key stored; cannot fetch profile");
              mainWindow?.webContents.send("steam-user-updated", { success: false, error: "No API key" });
            } else {
              const profile = await fetchSteamProfile(apiKey, steam_id64);
              if (profile) {
                upsertUser(profile);
                mainWindow?.webContents.send("steam-user-updated", { success: true, steam_id64 });
              } else {
                mainWindow?.webContents.send("steam-user-updated", { success: false, error: "Profile fetch failed" });
              }
            }
          } else {
            console.error("Could not extract steam_id64 from claimed:", claimedStr);
            mainWindow?.webContents.send("steam-user-updated", { success: false, error: "Invalid claimed_id" });
          }

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end("<html><body><h2>Login complete — you can close this window.</h2></body></html>");

          try { steamLoginWindow?.close(); } catch {}
          server.close();
          resolve(true);
        }
      } catch (err) {
        console.error("Error in local callback handler:", err);
        try { steamLoginWindow?.close(); } catch {}
        server.close();
        mainWindow?.webContents.send("steam-user-updated", { success: false, error: "Exception" });
        resolve(false);
      }
    });

    server.listen(3456, "127.0.0.1", () => {
      const returnTo = "http://127.0.0.1:3456/auth";
      const realm = "http://127.0.0.1:3456/";

      const steamOidcUrl = new URL("https://steamcommunity.com/openid/login");
      steamOidcUrl.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
      steamOidcUrl.searchParams.set("openid.mode", "checkid_setup");
      steamOidcUrl.searchParams.set("openid.return_to", returnTo);
      steamOidcUrl.searchParams.set("openid.realm", realm);
      steamOidcUrl.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
      steamOidcUrl.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

      steamLoginWindow = new BrowserWindow({
        width: 600,
        height: 800,
        modal: true,
        frame: true,
        title: "Steam Login",
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
        },
      });

      console.log("Opening Steam login window at:", steamOidcUrl.toString());
      steamLoginWindow.loadURL(steamOidcUrl.toString());

      steamLoginWindow.on("closed", () => {
        console.log("Steam login window closed by user");
        try { server.close(); } catch {}
        resolve(false);
      });
    });
  });
});
