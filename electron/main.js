// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const http = require('http');
const handler = require('serve-handler');
// Use node-fetch so .body is a Node.js Readable stream
const fetch = require('node-fetch').default;
const { Readable } = require('stream');

const { openFolderDialog } = require('./helpers/dialog.js');
const { validatePath } = require('./helpers/validatePath.js');
const { openFolder } = require('./helpers/openFolder.js');

let mainWindow;
const PORT = 8855;

// Start a local HTTP server to serve the "out" directory
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/proxy')) {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`)
    const imageUrl = urlObj.searchParams.get('url')
    if (!imageUrl) {
      res.writeHead(400)
      return res.end('Missing URL parameter')
    }
    try {
      const upstream = await fetch(imageUrl);
      const contentType = upstream.headers.get('Content-Type') || 'image/jpeg';
      res.writeHead(upstream.status, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      // wrap Web ReadableStream into Node stream if needed:
      const bodyStream = typeof upstream.body.pipe === 'function'
        ? upstream.body
        : Readable.fromWeb(upstream.body);
      bodyStream.pipe(res);
    } catch (err) {
      console.error('proxy error:', err)
      res.writeHead(500)
      res.end('Error fetching image')
    }
  } else {
    return handler(req, res, { public: path.join(__dirname, '../out') })
  }
});
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    minWidth: 800,
    height: 600,
    minHeight: 400,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../app', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // Load the URL of the local server instead of directly loading the HTML file.
  mainWindow.loadURL(`http://localhost:${PORT}`);

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

  // Set Content-Security-Policy headers.
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';",
        ],
      },
    });
  });

  // Optional: Open the DevTools.
  // mainWindow.webContents.openDevTools();
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

ipcMain.handle('open-folder-dialog', async () => await openFolderDialog());
ipcMain.handle('validate-path', async (event, folderPath) => validatePath(folderPath));
ipcMain.handle('open-download-folder', async (event, folderPath) => openFolder(folderPath));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});