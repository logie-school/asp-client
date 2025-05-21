// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');

let mainWindow;

const createWindow = () => {
  // Assign to the global mainWindow variable
  mainWindow = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 400,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // Load the index.html of the app.
  mainWindow.loadURL('http://localhost:3000');

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Add event listeners after mainWindow is initialized
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('windowStateChange', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('windowStateChange', { isMaximized: false });
  });

  // Open the DevTools (optional).
  // mainWindow.webContents.openDevTools();
};

// Handle IPC messages for window actions
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

// get yt video info with url arg and requestId
ipcMain.on('videoInfo', async (event, url, requestId) => {
  console.log('Received URL:', url, 'RequestId:', requestId);
  const YoutubeVideoDetails = require('./helpers/ytdl.js');
  const youtube = new YoutubeVideoDetails();

  try {
    const details = await youtube.getVideoDetails(url);
    console.log('Video details:', details);
    event.reply('videoInfoResponse', details, requestId); // Pass requestId back
  } catch (error) {
    console.error('Error:', error);
    event.reply('videoInfoError', error.message, requestId); // Pass requestId back
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});