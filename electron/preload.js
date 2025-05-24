const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  send: (channel, ...args) => {
    const validChannels = [
      'closeApp', 
      'maximizeApp', 
      'minimizeApp',
      'videoInfo',
      'downloadVideo',
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
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  },
  invoke: (channel, ...args) => {
    const validChannels = [
      'open-folder-dialog',
      'validate-path',
      'open-download-folder'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
});