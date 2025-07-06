const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { spawn, spawnSync } = require('child_process');
const axios = require('axios');

function getSoundpadServerPath() {
  let serverPath;
  let usePython = false;
  
  if (app.isPackaged) {
    // resourcesPath points to <MyApp>/resources
    serverPath = path.join(process.resourcesPath, 'soundpad-server', 'asp-server.exe');
  } else {
    // dev: project root/soundpad-server
    // First try the updated Python script
    const pythonScript = path.join(app.getAppPath(), 'soundpad-server', 'asp-server-updated.py');
    if (fs.existsSync(pythonScript)) {
      serverPath = pythonScript;
      usePython = true;
    } else {
      serverPath = path.join(app.getAppPath(), 'soundpad-server', 'asp-server.exe');
    }
  }
  
  if (!fs.existsSync(serverPath)) {
    console.error('[Soundpad] Server not found at', serverPath);
    return null;
  }
  
  return { path: serverPath, usePython };
}

let soundpadProcess = null;

function startSoundpadServer() {
    if (soundpadProcess) {
        console.log('[Soundpad] Server already running. PID:', soundpadProcess.pid);
        return;
    }

    const serverInfo = getSoundpadServerPath();
    if (!serverInfo) {
        console.error('[Soundpad] Cannot start server: Executable path not found.');
        return;
    }

    try {
        const serverDir = path.dirname(serverInfo.path);
        let command, args;
        
        if (serverInfo.usePython) {
            command = 'python';
            args = [serverInfo.path, '--headless'];
            console.log(`[Soundpad] Starting Python server: python ${serverInfo.path} --headless in directory: ${serverDir}`);
        } else {
            command = serverInfo.path;
            args = ['--headless'];
            console.log(`[Soundpad] Starting server: ${serverInfo.path} with args: --headless in directory: ${serverDir}`);
        }
        
        soundpadProcess = spawn(command, args, {
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
    console.log(`[Soundpad] Ensuring server is running on port ${port}`);
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(`http://localhost:${port}/status`);
            console.log(`[Soundpad] Server is responding on port ${port}:`, response.data);
            
            // Try to get additional server info if available
            try {
                const infoResponse = await axios.get(`http://localhost:${port}/info`);
                console.log(`[Soundpad] Server info:`, infoResponse.data);
            } catch (infoError) {
                // Info endpoint might not exist, that's okay
                console.log(`[Soundpad] No info endpoint available`);
            }
            
            return;
        } catch (err) {
            console.warn(`[Soundpad] Server not responding (attempt ${i + 1}/${retries}) on port ${port}:`, err.message);
            if (i === 0) {
                console.log('[Soundpad] Stopping any existing server and starting fresh...');
                stopSoundpadServer(); // Stop existing server first
                await new Promise(res => setTimeout(res, 500)); // Wait a bit
                startSoundpadServer();
            }
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
    
    // Define supported file types in the code (includes MP4 for video audio tracks)
    // Server supports: .ac, .flac, .m4a, .mp3, .ogg, .opus, .wav, .wma, .mp4
    const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.opus', '.wma', '.ac', '.mp4'];
    
    // Log the file path for debugging
    console.log("[Soundpad] Attempting to add file:", filePath);
    console.log("[Soundpad] File exists check:", require('fs').existsSync(filePath));
    
    // Get file extension
    const fileExtension = require('path').extname(filePath).toLowerCase();
    console.log("[Soundpad] File extension:", fileExtension);
    
    // Check if file type is supported by our client
    if (!SUPPORTED_EXTENSIONS.includes(fileExtension)) {
        throw new Error(`Unsupported file type: ${fileExtension}. Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    }
    
    // Try different approaches for different file types
    let requestBody = { path: filePath };
    
    // For MP4 files, we know the server might reject them, so try alternatives immediately
    if (fileExtension === '.mp4') {
        console.log("[Soundpad] MP4 file detected, using enhanced compatibility mode...");
    }
    
    try {
        console.log("[Soundpad] Request URL:", url);
        console.log("[Soundpad] Request body:", requestBody);
        
        let response;
        let lastError;
        
        // Try multiple approaches
        const approaches = [
            { path: filePath },
            { file: filePath },
            { audioPath: filePath },
            { videoPath: filePath },
            { soundPath: filePath },
            { filePath: filePath },
            { media: filePath },
            { source: filePath }
        ];
        
        for (let i = 0; i < approaches.length; i++) {
            const body = approaches[i];
            const paramName = Object.keys(body)[0];
            
            try {
                console.log(`[Soundpad] Attempt ${i + 1}: Using parameter '${paramName}'`);
                response = await axios.post(url, body, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                
                console.log(`[Soundpad] Success with parameter '${paramName}'`);
                break;
                
            } catch (error) {
                lastError = error;
                const status = error.response?.status;
                const errorDetail = error.response?.data?.detail || error.message;
                
                console.log(`[Soundpad] Attempt ${i + 1} failed (${paramName}): ${status} - ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
                
                // If it's a 400 error with "File type not allowed", this is likely the definitive answer
                if (status === 400 && (
                    (typeof errorDetail === 'string' && errorDetail.includes('File type not allowed')) ||
                    (Array.isArray(errorDetail) && errorDetail.some(item => 
                        (typeof item === 'string' && item.includes('File type not allowed')) ||
                        (item.msg && item.msg.includes('File type not allowed'))
                    ))
                )) {
                    // File type definitely not supported, no point trying other parameters
                    break;
                }
                
                // For 422 errors, try a few more parameter names but don't try all of them
                if (status === 422 && i >= 3) {
                    break;
                }
                
                // For other errors, stop trying (server down, etc.)
                if (status !== 400 && status !== 422) {
                    break;
                }
            }
        }
        
        // If no approach worked, throw the last error with enhanced message
        if (!response) {
            if (lastError?.response?.status === 400) {
                const errorDetail = lastError.response.data?.detail;
                if ((typeof errorDetail === 'string' && errorDetail.includes('File type not allowed')) ||
                    (Array.isArray(errorDetail) && errorDetail.some(item => 
                        (typeof item === 'string' && item.includes('File type not allowed')) ||
                        (item.msg && item.msg.includes('File type not allowed'))
                    ))) {
                    // Server doesn't support this file type - provide a helpful error
                    throw new Error(`Server doesn't support ${fileExtension} files. The file was downloaded successfully, but couldn't be added to Soundpad.`);
                }
            }
            throw lastError;
        }
        
        console.log("[Soundpad] Server response status:", response.status);
        console.log("[Soundpad] Server response data:", response.data);
        
        if (response.status !== 200) {
            const detail = response.data?.message || response.statusText;
            throw new Error(`Unexpected response: ${detail}`);
        }
        console.log("[Soundpad] Sound added successfully:", filePath);
        return response.data;
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            console.log("[Soundpad] Full server error response:", {
                status,
                statusText: error.response.statusText,
                data,
                headers: error.response.headers,
                filePath,
                fileExtension
            });
            
            // Log the detailed error structure for debugging
            if (data && data.detail) {
                console.log("[Soundpad] Error detail structure:", JSON.stringify(data.detail, null, 2));
            }
            
            // Extract detailed error message
            let errorMessage = 'Unknown error';
            if (data) {
                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data.detail) {
                    // Handle nested error details (arrays of objects)
                    if (Array.isArray(data.detail)) {
                        errorMessage = data.detail.map(item => {
                            if (typeof item === 'string') return item;
                            if (item.msg) return item.msg;
                            if (item.message) return item.message;
                            return JSON.stringify(item);
                        }).join(', ');
                    } else if (typeof data.detail === 'string') {
                        errorMessage = data.detail;
                    } else {
                        errorMessage = JSON.stringify(data.detail);
                    }
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (data.error) {
                    errorMessage = data.error;
                } else {
                    errorMessage = JSON.stringify(data);
                }
            }
            
            switch (status) {
                case 400:
                    if ((typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('file type not allowed')) ||
                        errorMessage.toLowerCase().includes('not allowed')) {
                        throw new Error(`File type ${fileExtension} not supported by Soundpad server. Download completed successfully.`);
                    }
                    throw new Error(`Invalid file: ${errorMessage}`);
                case 422:
                    throw new Error(`Invalid request format: ${errorMessage}`);
                case 503:
                    throw new Error('Soundpad is not running');
                default:
                    throw new Error(`Server error (${status}): ${errorMessage}`);
            }
        } else if (error.request) {
            console.log("[Soundpad] No response received:", error.request);
            throw new Error('No response from server');
        } else {
            console.log("[Soundpad] Request setup error:", error.message);
            throw new Error(error.message);
        }
    }
}

module.exports = {
    startSoundpadServer,
    stopSoundpadServer,
    addSoundToSoundpad,
};