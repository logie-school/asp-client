// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const http = require('http');
const fetch = require('node-fetch').default;
const { Readable } = require('stream');
const handler = require('serve-handler');
const { validatePath } = require('./helpers/validatePath');
const { openFolderDialog } = require('./helpers/dialog');
const { openFolder } = require('./helpers/openFolder');

let mainWindow;
const isDev = process.env.NODE_ENV === 'development';
const PROXY_PORT = 8855;
const STATIC_PORT = 8844; // Port for static files in production

// Create both proxy and static file servers for production
const setupServers = () => {
  // Proxy server setup
  const proxyServer = http.createServer(async (req, res) => {
    if (req.url.startsWith('/api/proxy')) {
      const urlObj = new URL(req.url, `http://localhost:${PROXY_PORT}`);
      const imageUrl = urlObj.searchParams.get('url');
      
      if (!imageUrl) {
        res.writeHead(400);
        return res.end('Missing URL parameter');
      }

      try {
        const upstream = await fetch(imageUrl);
        const contentType = upstream.headers.get('Content-Type') || 'image/jpeg';
        res.writeHead(upstream.status, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000'
        });
        
        const bodyStream = typeof upstream.body.pipe === 'function'
          ? upstream.body
          : Readable.fromWeb(upstream.body);
        bodyStream.pipe(res);
      } catch (err) {
        console.error('proxy error:', err);
        res.writeHead(500);
        res.end('Error fetching image');
      }
    }
  });

  // Static file server for production only
  const staticServer = isDev ? null : http.createServer((req, res) => {
    return handler(req, res, {
      public: path.join(__dirname, '../out'),
      rewrites: [{ source: '**', destination: '/index.html' }]
    });
  });

  // Start proxy server
  proxyServer.listen(PROXY_PORT, () => {
    console.log(`Proxy server running at http://localhost:${PROXY_PORT}`);
  });

  // Start static server only in production
  if (!isDev) {
    staticServer.listen(STATIC_PORT, () => {
      console.log(`Static file server running at http://localhost:${STATIC_PORT}`);
    });
  }

  return { proxyServer, staticServer };
};

// Create servers
const servers = setupServers();

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    minWidth: 800,
    height: 600,
    minHeight: 400,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, load from static server
    mainWindow.loadURL(`http://localhost:${STATIC_PORT}`);
  }

  // Open external links in the default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Event listeners for window state changes.
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('windowStateChange', { isMaximized: true });
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('windowStateChange', { isMaximized: false });
  });

  // Update CSP to allow connecting to proxy server in both dev and prod
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    // Default CSP for production
    let csp =
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: http://localhost:8855 localhost:8855; " +
      "connect-src 'self' localhost:8855;";

    // In development, allow 'unsafe-eval' for Next.js Fast Refresh
    if (isDev) {
      csp =
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: http://localhost:8855 localhost:8855; " +
        "connect-src 'self' localhost:8855 ws://localhost:3000 ws://127.0.0.1:3000;";
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          isDev 
            ? `default-src 'self' localhost:3000; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:3000; 
               style-src 'self' 'unsafe-inline' localhost:3000; 
               img-src 'self' data: localhost:3000 localhost:${PROXY_PORT}; 
               connect-src 'self' localhost:3000 localhost:${PROXY_PORT} ws://localhost:3000;`
            : `default-src 'self' localhost:${STATIC_PORT}; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:${STATIC_PORT}; 
               style-src 'self' 'unsafe-inline' localhost:${STATIC_PORT}; 
               img-src 'self' data: localhost:${STATIC_PORT} localhost:${PROXY_PORT}; 
               connect-src 'self' localhost:${STATIC_PORT} localhost:${PROXY_PORT};
               font-src 'self' data:;`,
        ],
      },
    });
  });
};

ipcMain.on('closeApp', () => {
  if (mainWindow) mainWindow.close();
});
ipcMain.on('maximizeApp', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.on('minimizeApp', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('videoInfo', async (event, url, requestId) => {
  const YoutubeVideoDetails = require('./helpers/dl.js');
  try {
    const details = await YoutubeVideoDetails.getVideoDetails(url);
    event.reply('videoInfoResponse', details, requestId);
  } catch (error) {
    event.reply('videoInfoError', error.message, requestId);
  }
});

ipcMain.on('downloadVideo', async (event, url, outputPath, format, quality) => {
  const { downloadVideo } = require('./helpers/dl.js');
  try {
    const result = await downloadVideo(url, outputPath, format, quality);
    event.reply('downloadResponse', result);
  } catch (error) {
    event.reply('downloadError', error.message);
  }
});

// Add these handlers before app.whenReady()
ipcMain.handle('open-folder-dialog', async () => await openFolderDialog());
ipcMain.handle('validate-path', async (event, folderPath) => validatePath(folderPath));
ipcMain.handle('open-download-folder', async (event, folderPath) => openFolder(folderPath));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Clean up servers on app quit
app.on('window-all-closed', () => {
  if (servers.proxyServer) {
    servers.proxyServer.close();
  }
  if (servers.staticServer) {
    servers.staticServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Add error handlers for the servers
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});