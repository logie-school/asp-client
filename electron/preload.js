const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  send: (channel, ...args) => {
    const validChannels = [
      'closeApp', 
      'maximizeApp', 
      'minimizeApp',
      'videoInfo',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args); // Already passes all args, including requestId
    }
  },
  receive: (channel, func) => {
    const validChannels = [
      'windowStateChange', 
      'videoInfoResponse',
      'videoInfoError',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
      ipcRenderer.on(channel, (event, ...args) => func(...args)); // Already passes all args, including requestId
    }
  },
  removeListener: (channel, func) => {
    const validChannels = [
      'windowStateChange', 
      'videoInfoResponse',
      'videoInfoError',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  }
});