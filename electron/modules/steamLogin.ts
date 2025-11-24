import { BrowserWindow } from 'electron';

import { fetchSteamProfile, getStoredApiKey, upsertUser } from './database';

export function registerSteamLogin(mainWindow: BrowserWindow | null) {
  const ipcMain = require('electron').ipcMain;

  ipcMain.handle('open-steam-login', async () => {
    if (!mainWindow) {
      console.warn('open-steam-login: mainWindow not available');
      return;
    }

    return new Promise<boolean>((resolve) => {
      let steamLoginWindow: BrowserWindow | null = null;
      const http = require('http');
      const url = require('url');

      const server = http.createServer(async (req: any, res: any) => {
        try {
          if (!req.url) return;
          const parsed = url.parse(req.url, true);
          if (parsed.pathname === '/auth') {
            const claimed = parsed.query['openid.claimed_id'] || parsed.query['openid.identity'];
            const claimedStr =
              typeof claimed === 'string'
                ? claimed
                : Array.isArray(claimed)
                  ? claimed[0]
                  : String(claimed ?? '');
            const match = claimedStr.match(/(?:\/id\/|\/openid\/id\/|\/profiles\/)(\d+)$/);
            const steam_id64 = match ? match[1] : null;

            console.log('Local callback hit. claimed:', claimedStr, 'steam_id64:', steam_id64);

            if (steam_id64) {
              const apiKey = getStoredApiKey();
              if (!apiKey) {
                console.error('No Steam API key stored; cannot fetch profile');
                mainWindow?.webContents.send('steam-user-updated', {
                  success: false,
                  error: 'No API key',
                });
              } else {
                const profile = await fetchSteamProfile(apiKey, steam_id64);
                if (profile) {
                  upsertUser(profile);
                  mainWindow?.webContents.send('steam-user-updated', { success: true, steam_id64 });
                } else {
                  mainWindow?.webContents.send('steam-user-updated', {
                    success: false,
                    error: 'Profile fetch failed',
                  });
                }
              }
            } else {
              console.error('Could not extract steam_id64 from claimed:', claimedStr);
              mainWindow?.webContents.send('steam-user-updated', {
                success: false,
                error: 'Invalid claimed_id',
              });
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(
              '<html><body><h2>Login complete — you can close this window.</h2></body></html>',
            );

            try {
              steamLoginWindow?.close();
            } catch {}
            server.close();
            resolve(true);
          }
        } catch (err) {
          console.error('Error in local callback handler:', err);
          try {
            steamLoginWindow?.close();
          } catch {}
          server.close();
          mainWindow?.webContents.send('steam-user-updated', {
            success: false,
            error: 'Exception',
          });
          resolve(false);
        }
      });

      server.listen(3456, '127.0.0.1', () => {
        const returnTo = 'http://127.0.0.1:3456/auth';
        const realm = 'http://127.0.0.1:3456/';

        const steamOidcUrl = new URL('https://steamcommunity.com/openid/login');
        steamOidcUrl.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0');
        steamOidcUrl.searchParams.set('openid.mode', 'checkid_setup');
        steamOidcUrl.searchParams.set('openid.return_to', returnTo);
        steamOidcUrl.searchParams.set('openid.realm', realm);
        steamOidcUrl.searchParams.set(
          'openid.identity',
          'http://specs.openid.net/auth/2.0/identifier_select',
        );
        steamOidcUrl.searchParams.set(
          'openid.claimed_id',
          'http://specs.openid.net/auth/2.0/identifier_select',
        );

        steamLoginWindow = new BrowserWindow({
          width: 600,
          height: 800,
          modal: true,
          frame: true,
          title: 'Steam Login',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
          },
        });

        console.log('Opening Steam login window at:', steamOidcUrl.toString());
        steamLoginWindow.loadURL(steamOidcUrl.toString());

        steamLoginWindow.on('closed', () => {
          console.log('Steam login window closed by user');
          try {
            server.close();
          } catch {}
          resolve(false);
        });
      });
    });
  });
}
