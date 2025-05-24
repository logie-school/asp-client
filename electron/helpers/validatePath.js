const fs = require('fs');
const path = require('path');
const os = require('os');

function validatePath(folderPath) {
  if (!folderPath) return false;
  // Expand ~ to home directory
  if (folderPath.startsWith('~')) {
    folderPath = path.join(os.homedir(), folderPath.slice(1));
  }
  try {
    return fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory();
  } catch {
    return false;
  }
}

module.exports = { validatePath };