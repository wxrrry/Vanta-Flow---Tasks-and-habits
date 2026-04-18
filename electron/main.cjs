/**
 * Точка входа Electron: открывает собранный index.html из dist/
 */
const { app, BrowserWindow, ipcMain, Notification, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.VANTA_DEV === '1';

const iconPath = path.join(__dirname, 'app-icon.png');
const preloadPath = path.join(__dirname, 'preload.cjs');

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 880,
    minWidth: 340,
    minHeight: 480,
    show: false,
    backgroundColor: '#050a0e',
    autoHideMenuBar: true,
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: preloadPath,
    },
    title: 'Vanta Flow - \\ digital piece by ESLL',
  });

  win.once('ready-to-show', () => win.show());

  const indexHtml = path.join(__dirname, '..', 'dist', 'index.html');
  if (isDev) {
    win.loadURL('http://localhost:3000/');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(indexHtml);
  }
}

// Native Windows notification via Electron
ipcMain.on('show-notification', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    const n = new Notification({
      title: title || 'Vanta Flow',
      body: body || '',
      ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    });
    n.show();
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
