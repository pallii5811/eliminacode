const { app, BrowserWindow, Menu, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;
const isDev = process.argv.includes('--dev');
const PORT = 3000;

// Determina quale modulo aprire da argomento CLI
// Uso: codasacra.exe --mode=display | --mode=operatore | --mode=ticket
function getStartMode() {
  const modeArg = process.argv.find(a => a.startsWith('--mode='));
  if (modeArg) return modeArg.split('=')[1];
  return 'launcher'; // default: mostra il launcher
}

function getURLForMode(mode) {
  const base = isDev ? `http://localhost:${PORT}` : `http://localhost:${PORT}`;
  switch (mode) {
    case 'display': return `${base}/display`;
    case 'operatore': return `${base}/operatore`;
    case 'ticket': return `${base}/ticket`;
    default: return base;
  }
}

function startLocalServer() {
  return new Promise((resolve) => {
    if (isDev) {
      resolve();
      return;
    }

    try {
      // Serve i file buildati con un mini server statico
      const express = require('express');
      const expressApp = express();
      const distPath = path.join(__dirname, '..', 'dist');

      expressApp.use(express.static(distPath));

      // SPA fallback: tutte le route servono index.html
      expressApp.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });

      const server = expressApp.listen(PORT, '127.0.0.1', () => {
        console.log(`CodaSacra server running on http://127.0.0.1:${PORT}`);
        resolve();
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${PORT} already in use, connecting to existing server...`);
          resolve();
        }
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      resolve();
    }
  });
}

function createWindow(mode) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const isDisplay = mode === 'display';
  const isLauncher = mode === 'launcher';

  const windowConfig = {
    width: isDisplay ? width : isLauncher ? 600 : 480,
    height: isDisplay ? height : isLauncher ? 500 : 800,
    title: 'CodaSacra',
    icon: path.join(__dirname, '..', 'public', 'icon.svg'),
    autoHideMenuBar: true,
    fullscreen: isDisplay,
    kiosk: isDisplay,
    resizable: !isDisplay,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  mainWindow = new BrowserWindow(windowConfig);

  // Nascondi il menu
  Menu.setApplicationMenu(null);

  if (isLauncher) {
    mainWindow.loadFile(path.join(__dirname, 'launcher.html'));
  } else {
    mainWindow.loadURL(getURLForMode(mode));
  }

  // Shortcut: ESC esce da kiosk/fullscreen
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && isDisplay) {
      mainWindow.setKiosk(false);
      mainWindow.setFullScreen(false);
    }
    // F11 toggle fullscreen
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Gestisci navigazione dal launcher
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, url) => {
    // Permetti navigazione interna
  });
});

app.whenReady().then(async () => {
  const mode = getStartMode();

  await startLocalServer();
  createWindow(mode);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(mode);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
