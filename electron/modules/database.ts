import DatabaseLib from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

let _db: any = null; // TS-safe placeholder

/**
 * Initialize DB (call once in main.ts)
 */
export function initDatabase() {
  const userDataPath = app.getPath('userData');
  fs.mkdirSync(userDataPath, { recursive: true });

  const dbPath = path.join(userDataPath, 'app.db');
  console.log('Opening DB at:', dbPath);
  _db = new DatabaseLib(dbPath);

  // Settings table
  _db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    );
  `);

  // Users table, with user_id as PK
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      steamid64 TEXT UNIQUE,
      personaname TEXT,
      avatarfull TEXT,
      avatarmedium TEXT,
      avatar TEXT,
      profileurl TEXT,
      realname TEXT,
      visibility INTEGER,
      timecreated INTEGER,
      lastlogoff INTEGER,
      loccountrycode TEXT,
      locstatecode TEXT,
      loccityid INTEGER,
      updated_at INTEGER
    );
  `);
}

/**
 * Returns DB object
 */
export function getDb(): any {
  if (!_db) throw new Error('Database not initialized. Call initDatabase first.');
  return _db;
}

/**
 * Upsert user record
 */
export function upsertUser(profile: any) {
  try {
    const now = Math.floor(Date.now() / 1000);
    getDb()
      .prepare(
        `
        INSERT INTO users (
          steamid64, personaname, avatarfull, avatarmedium, avatar,
          profileurl, realname, visibility, timecreated, lastlogoff,
          loccountrycode, locstatecode, loccityid, updated_at
        ) VALUES (
          @steamid64, @personaname, @avatarfull, @avatarmedium, @avatar,
          @profileurl, @realname, @visibility, @timecreated, @lastlogoff,
          @loccountrycode, @locstatecode, @loccityid, @updated_at
        )
        ON CONFLICT(steamid64) DO UPDATE SET
          personaname=excluded.personaname,
          avatarfull=excluded.avatarfull,
          avatarmedium=excluded.avatarmedium,
          avatar=excluded.avatar,
          profileurl=excluded.profileurl,
          realname=excluded.realname,
          visibility=excluded.visibility,
          timecreated=excluded.timecreated,
          lastlogoff=excluded.lastlogoff,
          loccountrycode=excluded.loccountrycode,
          locstatecode=excluded.locstatecode,
          loccityid=excluded.loccityid,
          updated_at=excluded.updated_at
      `,
      )
      .run({
        steamid64: profile.steamid,
        personaname: profile.personaname ?? null,
        avatarfull: profile.avatarfull ?? null,
        avatarmedium: profile.avatarmedium ?? null,
        avatar: profile.avatar ?? null,
        profileurl: profile.profileurl ?? null,
        realname: profile.realname ?? null,
        visibility: profile.communityvisibilitystate ?? null,
        timecreated: profile.timecreated ?? null,
        lastlogoff: profile.lastlogoff ?? null,
        loccountrycode: profile.loccountrycode ?? null,
        locstatecode: profile.locstatecode ?? null,
        loccityid: profile.loccityid ?? null,
        updated_at: now,
      });
  } catch (err) {
    console.error('upsertUser error:', err);
  }
}

/**
 * Delete user by user_id (PK)
 */
export function deleteUser(userId: number): boolean {
  try {
    const info = getDb().prepare('DELETE FROM users WHERE user_id = ?').run(userId);
    console.log(`Deleted user_id=${userId}, changes=${info.changes}`);
    return info.changes > 0;
  } catch (err) {
    console.error('deleteUser error:', err);
    return false;
  }
}

/**
 * Load user by steamid64
 */
export function getUserBySteamId(steamid64: string): any | null {
  try {
    const row = getDb().prepare('SELECT * FROM users WHERE steamid64 = ?').get(steamid64);
    return row ?? null;
  } catch (err) {
    console.error('getUser error:', err);
    return null;
  }
}

/**
 * Load stored API key
 */
export function getStoredApiKey(): string | null {
  try {
    const row = getDb().prepare("SELECT value FROM settings WHERE key = 'steam_api_key'").get();
    return row?.value ?? null;
  } catch (err) {
    console.error('getStoredApiKey error:', err);
    return null;
  }
}

/**
 * Save API key
 */
export function saveApiKey(key: string): boolean {
  try {
    getDb()
      .prepare(
        `
        INSERT INTO settings (key, value)
        VALUES ('steam_api_key', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `,
      )
      .run(key);
    return true;
  } catch (err) {
    console.error('saveApiKey error:', err);
    return false;
  }
}
