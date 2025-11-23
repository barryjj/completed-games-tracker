import { BrowserWindow, ipcMain } from 'electron';

import { deleteUser, getStoredApiKey, getUserBySteamId } from './db';
import { openSteamLoginWindow } from './steamLogin';

/**
 * Register IPC handlers
 */
export function registerIpcHandlers() {
  // Load/save API key
  ipcMain.handle('load-api-key', () => {
    console.log('IPC load-api-key invoked');
    try {
      return getStoredApiKey();
    } catch (err) {
      console.error('load-api-key error:', err);
      return null;
    }
  });

  ipcMain.handle('save-api-key', (_evt, key: string) => {
    console.log('IPC save-api-key invoked');
    try {
      const db = getStoredApiKey();
      // Upsert
      const stmt = `INSERT INTO settings (key,value) VALUES ('steam_api_key', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`;
      return true;
    } catch (err) {
      console.error('save-api-key error:', err);
      return false;
    }
  });

  // Get user by SteamID
  ipcMain.handle('get-user', (_evt, steamid64: string) => {
    console.log('IPC get-user invoked for:', steamid64);
    try {
      return getUserBySteamId(steamid64);
    } catch (err) {
      console.error('get-user error:', err);
      return null;
    }
  });

  // Delete user
  ipcMain.handle('delete-user', (_evt, userId: number) => {
    console.log('IPC delete-user invoked for user_id:', userId);
    return deleteUser(userId);
  });

  // Open Steam login
  ipcMain.handle('open-steam-login', (_evt) => {
    console.log('IPC open-steam-login invoked');
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.warn('No main window available for Steam login');
      return false;
    }
    return openSteamLoginWindow(mainWindow);
  });
}
