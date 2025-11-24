import { ipcMain, shell } from 'electron';

import { db, deleteUser, getUser, getUserBySteamId } from './database';

export function registerIpcHandlers() {
  ipcMain.handle('load-api-key', () => {
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'steam_api_key'").get();
      return row?.value ?? null;
    } catch (err) {
      console.error('load-api-key error:', err);
      return null;
    }
  });

  ipcMain.handle('save-api-key', (_evt, key: string) => {
    try {
      db.prepare(
        `
        INSERT INTO settings (key, value)
        VALUES ('steam_api_key', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `,
      ).run(key);
      return true;
    } catch (err) {
      console.error('save-api-key error:', err);
      return false;
    }
  });

  ipcMain.handle('get-user-by-steam-id', (_evt, steam_id64: string) => {
    return getUserBySteamId(steam_id64);
  });

  ipcMain.handle('get-user', () => {
    return getUser();
  });

  ipcMain.handle('delete-user', (_evt, user_id: number) => {
    return deleteUser(user_id);
  });

  ipcMain.handle('open-external-browser', async (_event, url: string) => {
    console.log('ipcHandlers: openExternalBrowser called for', url);
    try {
      await shell.openExternal(url);
      return true;
    } catch (err) {
      console.error('Failed to open external URL:', err);
      return false;
    }
  });
}
