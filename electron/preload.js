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
      ipcRenderer.send(channel, ...args);
    }
  },
  receive: (channel, func) => {
    const validChannels = [
      'windowStateChange', 
      'videoInfoResponse',
      'videoInfoError',
    ];
    if (validChannels.includes(channel)) {
      // Remove existing listeners
      ipcRenderer.removeAllListeners(channel);
      // Add new listener
      ipcRenderer.on(channel, (event, ...args) => func(...args));
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