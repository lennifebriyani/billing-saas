const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

let mainWindow;
let splashWindow;

async function startNextJsServer() {
  const dir = path.join(__dirname, '..');
  // Memulai Next.js server secara internal
  const nextApp = next({ dev: false, dir });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  return new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      resolve(`http://localhost:${port}`);
    });
  });
}

async function createWindow() {
  // 1. Buat Splash Screen
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  // 2. Buat Jendela Utama (Lumina Billing)
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Lumina Billing",
    icon: path.join(__dirname, 'icon.png'),
    show: false, // Sembunyikan sampai loading selesai
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Hilangkan menu default Electron (Opsional)
  mainWindow.setMenuBarVisibility(false);

  // 3. Logika Environment
  if (!app.isPackaged) {
    // DEVELOPMENT: Baca dari localhost Next.js
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.once('ready-to-show', () => {
      splashWindow.destroy();
      mainWindow.show();
    });
  } else {
    // PRODUCTION: Jalankan build Next.js di background
    try {
      const url = await startNextJsServer();
      mainWindow.loadURL(url);
      mainWindow.once('ready-to-show', () => {
        splashWindow.destroy();
        mainWindow.show();
      });
    } catch (err) {
      console.error("Gagal memulai internal server:", err);
    }
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});