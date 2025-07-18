const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  send: (channel, ...args) => {
    const validChannels = [
      'closeApp', 
      'maximizeApp', 
      'minimizeApp',
      'videoInfo',
      'downloadVideo',
      'addToSoundpad', // Add this line
      'settings-updated'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  receive: (channel, func) => {
    const validChannels = [
      'windowStateChange', 
      'videoInfoResponse',
      'videoInfoError',
      'downloadResponse',
      'downloadError',
      'soundpadResponse', // Add this line
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeListener: (channel, func) => {
    const validChannels = [
      'windowStateChange', 
      'videoInfoResponse',
      'videoInfoError',
      'downloadResponse',
      'downloadError',
      'soundpadResponse', // Add this line
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  },
  invoke: (channel, ...args) => {
    const validChannels = [
      'open-folder-dialog',
      'validate-path',
      'open-download-folder',
      'addToSoundpad',
      'get-soundpad-status',
      'open-path',
      'list-files-in-path'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
  openFile: (filePath) => ipcRenderer.send('openFile', filePath),
});