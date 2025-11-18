import { app, BrowserWindow } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

// Determine dev vs prod (Vite dev server presence)
const isDev =
    process.env.NODE_ENV === 'development' &&
    !!process.env.VITE_DEV_SERVER;

console.log('isDev:', isDev);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    if (isDev) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER!);
    } else {
        mainWindow.loadFile(
            path.join(__dirname, '../../dist/index.html')
        );
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App lifecycle
app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
