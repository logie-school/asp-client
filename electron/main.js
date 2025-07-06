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
const { startSoundpadServer, stopSoundpadServer } = require('./helpers/soundpad');
const axios = require('axios');
const os = require('os');

let mainWindow;
const isDev = process.env.NODE_ENV === 'development';
const PROXY_PORT = 8855;
const STATIC_PORT = 8844; // Port for static files in production
let soundpadPort = 8866; // Default Soundpad port

// Function to update the Soundpad port
const updateSoundpadPort = (port) => {
  soundpadPort = port;
  console.log(`[Main] Soundpad port updated to: ${soundpadPort}`);
};

// Listen for settings updates from the renderer process
ipcMain.on('settings-updated', (event, settings) => {
  if (settings && settings.soundpad && settings.soundpad.port) {
    updateSoundpadPort(settings.soundpad.port);
  }
});

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
    let cspValue;

    if (isDev) {
      // Looser CSP for development to allow easier debugging with localhost
      cspValue = `default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000 http://127.0.0.1:3000; 
                  script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000 http://127.0.0.1:3000; 
                  style-src 'self' 'unsafe-inline' http://localhost:3000 http://127.0.0.1:3000 https://fonts.googleapis.com; 
                  img-src 'self' data: http://localhost:3000 http://127.0.0.1:3000 http://localhost:${PROXY_PORT} http://127.0.0.1:${PROXY_PORT}; 
                  connect-src 'self' http://localhost:3000 http://127.0.0.1:3000 ws://localhost:3000 ws://127.0.0.1:3000 http://localhost:${PROXY_PORT} http://127.0.0.1:${PROXY_PORT} http://localhost:${soundpadPort} http://127.0.0.1:${soundpadPort} ws://localhost:${soundpadPort} ws://127.0.0.1:${soundpadPort}; 
                  font-src 'self' https://fonts.gstatic.com;`;
    } else {
      // Stricter CSP for production
      cspValue = `default-src 'self'; 
                  script-src 'self' 'unsafe-inline'; 
                  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
                  img-src 'self' data: http://localhost:${PROXY_PORT}; 
                  connect-src 'self' http://localhost:${PROXY_PORT} http://localhost:${soundpadPort} http://127.0.0.1:${soundpadPort} ws://localhost:${soundpadPort} ws://127.0.0.1:${soundpadPort};
                  font-src 'self' https://fonts.gstatic.com;`;
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [cspValue],
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

ipcMain.on('downloadVideo', async (event, url, outputPath, format, formatId, useTempPath) => {
  const { downloadVideo } = require('./helpers/dl.js');
  try {
    let finalOutputPath = outputPath;
    let result = null;

    // Download to temp if useTempPath is enabled
    if (useTempPath) {
      const os = require('os');
      const path = require('path');
      const fs = require('fs');
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asp-tmp-'));
      finalOutputPath = tempDir;

      // Download to temp folder first
      result = await downloadVideo(url, finalOutputPath, format, formatId);

      // Prompt user for file save location (Save As dialog)
      const { dialog } = require('electron');
      const pathModule = require('path');
      const BrowserWindow = require('electron').BrowserWindow;

      if (result) {
        const fileName = pathModule.basename(result);
        const { canceled, filePath } = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
          title: 'Save Downloaded File',
          defaultPath: fileName,
          buttonLabel: 'Save',
          filters: [
            { name: 'Media Files', extensions: [format] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (!canceled && filePath) {
          fs.copyFileSync(result, filePath);
          // Do NOT open the folder here
          event.reply('downloadResponse', filePath);
          return;
        } else {
          // User canceled, just return nothing or handle as needed
          event.reply('downloadResponse', null);
          return;
        }
      }
    } else {
      // Normal download
      result = await downloadVideo(url, finalOutputPath, format, formatId);
      event.reply('downloadResponse', result);
    }
  } catch (error) {
    event.reply('downloadError', error.message);
  }
});

// Add these handlers before app.whenReady()
ipcMain.handle('open-folder-dialog', async () => await openFolderDialog());
ipcMain.handle('validate-path', async (event, folderPath) => validatePath(folderPath));
ipcMain.handle('open-download-folder', async (event, folderPath) => openFolder(folderPath));

ipcMain.handle('list-files-in-path', async (event, folderPath) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Expand ~ to home directory
    let expandedPath = folderPath;
    if (folderPath.startsWith('~')) {
      expandedPath = path.join(os.homedir(), folderPath.slice(1));
    }
    
    // Check if path exists
    if (!fs.existsSync(expandedPath)) {
      return { error: 'Path does not exist' };
    }
    
    // Check if it's a directory
    const stats = fs.lstatSync(expandedPath);
    if (!stats.isDirectory()) {
      return { error: 'Path is not a directory' };
    }
    
    // Read directory contents
    const files = fs.readdirSync(expandedPath);
    const fileList = [];
    
    // Filter for audio and video files and get their info
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
    const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
    
    for (const file of files) {
      const filePath = path.join(expandedPath, file);
      try {
        const fileStats = fs.lstatSync(filePath);
        if (fileStats.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (audioExtensions.includes(ext) || videoExtensions.includes(ext)) {
            fileList.push({
              name: path.parse(file).name,
              fullName: file,
              extension: ext,
              type: audioExtensions.includes(ext) ? 'audio' : 'video',
              size: fileStats.size,
              modified: fileStats.mtime,
              path: filePath
            });
          }
        }
      } catch (err) {
        // Skip files that can't be accessed
        continue;
      }
    }
    
    return { files: fileList };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.on('openFile', (event, filePath) => {
  if (filePath) {
    shell.showItemInFolder(filePath);
  }
});

ipcMain.handle('addToSoundpad', async (_event, filePath, port) => {
  const { addSoundToSoundpad } = require('./helpers/soundpad');
  try {
    const result = await addSoundToSoundpad(filePath, port);
    return { data: result };
  } catch (err) {
    // never throw – always resolve with an error shape
    return { error: err.message ?? 'Soundpad request failed.' };
  }
});

// handle status check from renderer
ipcMain.handle('get-soundpad-status', async (_event, portArg) => {
  const port = portArg || soundpadPort;
  try {
    const { data } = await axios.get(`http://localhost:${port}/status`);
    // data is { status: "ok"|"error", message: string }
    return data;
  } catch (err) {
    // if server responded with JSON error body
    if (err.response?.data) return err.response.data;
    return { status: "error", message: "Cannot reach Soundpad server." };
  }
});

ipcMain.handle('open-path', async (_event, pathToOpen) => {
  // expand "~" to the user's home directory
  let resolvedPath = pathToOpen;
  if (resolvedPath.startsWith('~')) {
    resolvedPath = path.join(os.homedir(), resolvedPath.slice(1));
  }

  try {
    await shell.openPath(resolvedPath);
    return { success: true };
  } catch (error) {
    console.error('Error opening path:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createWindow();
  startSoundpadServer(); // Start Soundpad server when the app is ready
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

app.on('will-quit', () => {
  stopSoundpadServer(); // Ensure server is stopped before app fully quits
});

// Add error handlers for the servers
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

