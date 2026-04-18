/**
 * Точка входа Electron: открывает собранный index.html из dist/
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.VANTA_DEV === '1';

const iconPath = path.join(__dirname, 'app-icon.png');

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

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
