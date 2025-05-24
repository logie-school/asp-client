const { dialog, BrowserWindow } = require('electron');

function openFolderDialog() {
  const win = BrowserWindow.getFocusedWindow();
  return dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Select a folder'
  }).then(result => {
    if (result.canceled) return null;
    return result.filePaths[0];
  });
}

module.exports = { openFolderDialog };