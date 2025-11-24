import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export let db: ReturnType<typeof Database>;

export function initDatabase() {
  const userDataPath = app.getPath('userData');
  fs.mkdirSync(userDataPath, { recursive: true });
  const dbPath = path.join(userDataPath, 'app.db');
  console.log('Opening DB at:', dbPath);
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
export function getStoredApiKey(): string | null {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'steam_api_key'").get();
    return row?.value ?? null;
  } catch (err) {
    console.error('getStoredApiKey error:', err);
    return null;
  }
}

/**
 * Helper: upsert user record from Steam profile
 */
export function upsertUser(profile: any) {
  try {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      `
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
    `,
    ).run({
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
    console.error('upsertUser error:', err);
  }
}

/**
 * Helper: fetch Steam profile via Web API
 */
export async function fetchSteamProfile(apiKey: string, steamId64: string): Promise<any | null> {
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(apiKey)}&steamids=${encodeURIComponent(steamId64)}`;
    console.log('Fetching Steam profile:', url);
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Steam profile fetch failed:', res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    const players = data?.response?.players;
    if (!players || players.length === 0) {
      console.warn('No player data returned for:', steamId64);
      return null;
    }
    return players[0];
  } catch (err) {
    console.error('fetchSteamProfile error:', err);
    return null;
  }
}

/**
 * Helper: get a user by steam_id64
 */
export function getUserBySteamId(steam_id64: string) {
  try {
    const row = db.prepare('SELECT * FROM users WHERE steam_id64 = ?').get(steam_id64);
    return row ?? null;
  } catch (err) {
    console.error('getUserBySteamId error:', err);
    return null;
  }
}

/**
 * Helper: get first user in the users table (for setup page)
 */
export function getUser() {
  try {
    const row = db.prepare('SELECT * FROM users LIMIT 1').get();
    return row ?? null;
  } catch (err) {
    console.error('getUser error:', err);
    return null;
  }
}

/**
 * Helper: delete user by user_id
 */
export function deleteUser(user_id: number) {
  try {
    const info = db.prepare('DELETE FROM users WHERE user_id = ?').run(user_id);
    return info.changes > 0;
  } catch (err) {
    console.error('deleteUser error:', err);
    return false;
  }
}
