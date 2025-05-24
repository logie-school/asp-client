const { shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

function openFolder(folderPath) {
  if (!folderPath) return false;
  // Expand ~ to home directory
  if (folderPath.startsWith('~')) {
    folderPath = path.join(os.homedir(), folderPath.slice(1));
  }
  // Check if folder exists
  if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
    return false;
  }
  shell.openPath(folderPath);
  return true;
}

module.exports = { openFolder };