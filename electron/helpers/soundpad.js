const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { spawn, spawnSync } = require('child_process');

function getSoundpadServerPath() {
  let serverPath;
  if (app.isPackaged) {
    // resourcesPath points to <MyApp>/resources
    serverPath = path.join(process.resourcesPath, 'soundpad-server', 'asp-server.exe');
  } else {
    // dev: project root/soundpad-server
    serverPath = path.join(app.getAppPath(), 'soundpad-server', 'asp-server.exe');
  }
  if (!fs.existsSync(serverPath)) {
    console.error('[Soundpad] exe not found at', serverPath);
    return null;
  }
  return serverPath;
}

let soundpadProcess = null;

function startSoundpadServer() {
    if (soundpadProcess) {
        console.log('[Soundpad] Server already running. PID:', soundpadProcess.pid);
        return;
    }

    const serverPath = getSoundpadServerPath();
    if (!serverPath) {
        console.error('[Soundpad] Cannot start server: Executable path not found.');
        return;
    }

    try {
        const serverDir = path.dirname(serverPath);
        console.log(`[Soundpad] Starting server: ${serverPath} with args: --headless in directory: ${serverDir}`);
        soundpadProcess = spawn(serverPath, ['--headless'], {
            cwd: serverDir,
            stdio: 'pipe',
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });

        soundpadProcess.stdout.on('data', (data) => {
            console.log(`[Soundpad Server STDOUT]: ${data.toString().trim()}`);
        });

        soundpadProcess.stderr.on('data', (data) => {
            console.error(`[Soundpad Server STDERR]: ${data.toString().trim()}`);
        });

        soundpadProcess.on('error', (err) => {
            console.error('[Soundpad] Failed to start server process:', err);
            soundpadProcess = null;
        });

        soundpadProcess.on('close', (code, signal) => {
            // Check if the current soundpadProcess is the one that closed to avoid issues if a new one started quickly.
            // However, with the current logic, soundpadProcess is nulled here, so this check might be redundant
            // unless start/stop happens extremely rapidly.
            console.log(`[Soundpad] Server process (PID was ${soundpadProcess ? soundpadProcess.pid : 'unknown before this close event'}) exited with code ${code}, signal ${signal}`);
            soundpadProcess = null;
        });

        if (soundpadProcess.pid) {
            console.log('[Soundpad] Server process spawned. PID:', soundpadProcess.pid);
        } else {
            console.log('[Soundpad] Server process spawned, but PID is not immediately available. This might indicate an issue or a very fast exit.');
        }

    } catch (error) {
        console.error('[Soundpad] Error spawning server process:', error);
        soundpadProcess = null;
    }
}

function stopSoundpadServer() {
    if (soundpadProcess && soundpadProcess.pid) {
        const pidToKill = soundpadProcess.pid;
        console.log(`[Soundpad] Attempting to stop server with PID: ${pidToKill}...`);
        try {
            if (process.platform === "win32") {
                console.log(`[Soundpad] Using taskkill (spawnSync) for PID: ${pidToKill}.`);
                // Use spawnSync to ensure the command completes before the app fully exits
                const result = spawnSync("taskkill", ["/pid", String(pidToKill), '/f', '/t']);

                if (result.error) {
                    console.error(`[Soundpad Taskkill SYNC ERROR] Failed to execute taskkill for PID ${pidToKill}:`, result.error);
                } else {
                    if (result.stdout && result.stdout.toString().trim()) {
                        console.log(`[Soundpad Taskkill SYNC STDOUT] for PID ${pidToKill}: ${result.stdout.toString().trim()}`);
                    }
                    if (result.stderr && result.stderr.toString().trim()) {
                        console.error(`[Soundpad Taskkill SYNC STDERR] for PID ${pidToKill}: ${result.stderr.toString().trim()}`);
                    }
                    console.log(`[Soundpad Taskkill SYNC] process exited with status ${result.status} for PID ${pidToKill}.`);
                }
            } else {
                console.log(`[Soundpad] Sending SIGTERM to PID: ${pidToKill}.`);
                const killed = soundpadProcess.kill('SIGTERM'); // For non-Windows
                if (killed) {
                    console.log(`[Soundpad] SIGTERM signal sent successfully to PID: ${pidToKill}.`);
                } else {
                    console.error(`[Soundpad] Failed to send SIGTERM signal to PID: ${pidToKill}.`);
                }
            }
        } catch (error) {
            console.error(`[Soundpad] Error during attempt to stop server process PID ${pidToKill}:`, error);
        }
        // Nullify the process handle after attempting to kill.
        // This is important because the 'close' event on the original soundpadProcess
        // might not fire if it's killed externally or if the main app is shutting down.
        soundpadProcess = null;
        console.log(`[Soundpad] soundpadProcess set to null after attempting to stop PID: ${pidToKill}.`);
    } else {
        if (!soundpadProcess) {
            console.log('[Soundpad] Stop command ignored: Server not running or already stopped (soundpadProcess is null).');
        } else if (!soundpadProcess.pid) {
            console.log('[Soundpad] Stop command ignored: Server process object exists but has no PID (it might have exited very quickly or failed to spawn correctly).');
        }
    }
}

/**
 * Ensure the Soundpad server is running, retrying if necessary.
 */
async function ensureServerRunning(port, retries = 3, delayMs = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            await axios.get(`http://localhost:${port}/status`);
            return;
        } catch (err) {
            console.warn(`[Soundpad] Server not responding (attempt ${i + 1}/${retries}), starting server…`);
            startSoundpadServer();
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
    throw new Error('[Soundpad] Server unavailable after retries');
}

/**
 * Adds a sound to Soundpad via the server, with enhanced error handling.
 * @param {string} filePath
 * @param {number} port
 */
async function addSoundToSoundpad(filePath, port) {
    await ensureServerRunning(port);
    const url = `http://localhost:${port}/add`;
    try {
        const response = await axios.post(url, { path: filePath });
        if (response.status !== 200) {
            const detail = response.data?.message || response.statusText;
            throw new Error(`Unexpected response: ${detail}`);
        }
        console.log("[Soundpad] Sound added successfully:", filePath);
        return response.data;
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            switch (status) {
                case 400:
                    throw new Error(`Invalid file: ${data.detail || 'Check file path/extension'}`);
                case 503:
                    throw new Error('Soundpad is not running');
                default:
                    throw new Error(`Server error (${status}): ${data.detail || error.message}`);
            }
        }
        console.log("[Soundpad] Error adding sound:", error);
        throw new Error(error.message);
    }
}

module.exports = {
    startSoundpadServer,
    stopSoundpadServer,
    addSoundToSoundpad,
};