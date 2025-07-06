const ytdlp = require('yt-dlp-exec');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');
const os = require('os');

// Get the correct resource paths for production
function getResourcePath() {
    if (app.isPackaged) {
        return process.resourcesPath;
    }
    return path.join(__dirname, '../..');
}

function getFfmpegPath() {
    if (app.isPackaged) {
        // First, try the expected path in the resources folder
        const resourcePath = path.join(process.resourcesPath, 'ffmpeg', 'bin', 'ffmpeg.exe');
        console.log('Production ffmpeg path:', resourcePath);
        
        if (fs.existsSync(resourcePath)) {
            console.log('ffmpeg exists at expected path:', resourcePath);
            return resourcePath;
        }
        
        // If not found at the expected path, try alternative locations
        console.log('ffmpeg NOT found at expected path, trying alternatives...');
        
        const alternatives = [
            path.join(process.resourcesPath, 'ffmpeg.exe'),
            path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe'),
            path.join(app.getAppPath(), '..', 'ffmpeg', 'bin', 'ffmpeg.exe'),
            path.join(app.getPath('exe'), '..', 'resources', 'ffmpeg', 'bin', 'ffmpeg.exe'),
            path.join(app.getPath('exe'), '..', 'resources', 'ffmpeg.exe'),
            // Include node_modules path as fallback
            path.join(app.getAppPath(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
        ];
        
        for (const alt of alternatives) {
            console.log('Checking alternative path:', alt);
            if (fs.existsSync(alt)) {
                console.log('Found ffmpeg at alternative path:', alt);
                return alt;
            }
        }
        
        // Last resort, use ffmpeg-static module path
        try {
            const ffmpegStatic = require('ffmpeg-static');
            console.log('Using ffmpeg-static path:', ffmpegStatic);
            return ffmpegStatic;
        } catch (e) {
            console.error('Failed to load ffmpeg-static:', e);
        }
        
        return path.join(__dirname, '../../ffmpeg/bin/ffmpeg.exe');
    }
    
    // In development mode, use the local path
    return path.join(__dirname, '../../ffmpeg/bin/ffmpeg.exe');
}

function getYtDlpPath() {
    if (app.isPackaged) {
        // First, try the expected path in the resources folder
        const resourcePath = path.join(process.resourcesPath, 'yt-dlp-exec', 'bin', 'yt-dlp.exe');
        console.log('Production yt-dlp path:', resourcePath);
        
        if (fs.existsSync(resourcePath)) {
            console.log('yt-dlp exists at expected path:', resourcePath);
            return resourcePath;
        }
        
        // If not found at the expected path, try alternative locations
        console.log('yt-dlp NOT found at expected path, trying alternatives...');
        
        const alternatives = [
            path.join(process.resourcesPath, 'yt-dlp.exe'),
            path.join(process.resourcesPath, 'yt-dlp-exec', 'yt-dlp.exe'),
            path.join(app.getAppPath(), '..', 'yt-dlp-exec', 'bin', 'yt-dlp.exe'),
            path.join(app.getPath('exe'), '..', 'resources', 'yt-dlp-exec', 'bin', 'yt-dlp.exe'),
            // Include direct path to node_modules as fallback
            path.join(app.getAppPath(), 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp.exe'),
        ];
        
        for (const alt of alternatives) {
            console.log('Checking alternative path:', alt);
            if (fs.existsSync(alt)) {
                console.log('Found yt-dlp at alternative path:', alt);
                return alt;
            }
        }
        
        return resourcePath;
    }
    
    console.log('Running in development mode, using bundled yt-dlp');
    // In development mode, use the version from node_modules
    return undefined;
}

async function getVideoDetails(url) {
    try {
        console.log('Attempting to get video details for:', url);
        
        const ffmpegPath = getFfmpegPath();
        const ytdlpPath = getYtDlpPath();
        
        console.log('ffmpeg path:', ffmpegPath);
        console.log('yt-dlp path:', ytdlpPath);
        
        // Verify files exist in production
        if (app.isPackaged) {
            if (ytdlpPath && !fs.existsSync(ytdlpPath)) {
                console.error(`yt-dlp binary not found at: ${ytdlpPath}`);
                throw new Error(`yt-dlp binary not found. Please make sure the application is installed correctly.`);
            }
            // We'll continue even if ffmpeg isn't found, it's only needed for some operations
            if (!fs.existsSync(ffmpegPath)) {
                console.warn(`ffmpeg binary not found at: ${ffmpegPath}. Some operations may fail.`);
            }
        }
        
        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificates: true,
            preferFreeFormats: true,
            ffmpegLocation: ffmpegPath
        };

        if (app.isPackaged && ytdlpPath) {
            // Use a custom ytdlp wrapper for production
            const { spawn } = require('child_process');
            
            return new Promise((resolve, reject) => {
                console.log(`Spawning ${ytdlpPath} to get video info for ${url}`);
                
                // Convert options to command line args
                const args = ['--dump-single-json', '--no-warnings', '--no-check-certificates', 
                              '--prefer-free-formats', url];
                
                // Only add ffmpeg location if it exists
                if (fs.existsSync(ffmpegPath)) {
                    args.push('--ffmpeg-location', ffmpegPath);
                }
                
                console.log(`Command: ${ytdlpPath} ${args.join(' ')}`);
                
                const child = spawn(ytdlpPath, args, {
                    windowsHide: true
                });
                
                let stdout = '';
                let stderr = '';
                
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                    console.error('yt-dlp stderr:', data.toString());
                });
                
                child.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const info = JSON.parse(stdout);
                            console.log('Successfully got video details');
                            
                            // Extract available formats
                            const formats = [];
                            if (info.formats && Array.isArray(info.formats)) {
                                console.log('Raw formats count:', info.formats.length);
                                
                                // Get video formats with height info
                                const videoFormats = info.formats
                                    .filter(f => f.height && f.vcodec !== 'none')
                                    .map(f => ({
                                        format_id: f.format_id,
                                        height: f.height,
                                        quality: `${f.height}p`,
                                        ext: f.ext || 'mp4',
                                        format_note: f.format_note || '',
                                        vcodec: f.vcodec,
                                        acodec: f.acodec,
                                        fps: f.fps || 30,
                                        tbr: f.tbr || 0, // total bitrate
                                        vbr: f.vbr || 0, // video bitrate
                                        preference: f.preference || 0,
                                        has_audio: f.acodec && f.acodec !== 'none',
                                        protocol: f.protocol || '',
                                        filesize: f.filesize || 0
                                    }));
                                
                                console.log('Filtered video formats count:', videoFormats.length);
                                console.log('Video formats by height:');
                                videoFormats.forEach(f => {
                                    console.log(`  ${f.height}p - ID: ${f.format_id}, TBR: ${f.tbr}, VBR: ${f.vbr}, Audio: ${f.has_audio}, ACodec: ${f.acodec}, Pref: ${f.preference}`);
                                });
                                
                                // Group formats by height
                                const formatsByHeight = {};
                                videoFormats.forEach(format => {
                                    if (!formatsByHeight[format.height]) {
                                        formatsByHeight[format.height] = [];
                                    }
                                    formatsByHeight[format.height].push(format);
                                });
                                
                                console.log('Grouped formats by height:');
                                Object.keys(formatsByHeight).forEach(height => {
                                    console.log(`  ${height}p: ${formatsByHeight[height].length} formats`);
                                });
                                
                                // Select the best format for each height
                                const uniqueVideoFormats = [];
                                Object.keys(formatsByHeight).forEach(height => {
                                    const formatsForHeight = formatsByHeight[height];
                                    console.log(`\nProcessing ${height}p formats (${formatsForHeight.length} available):`);
                                    
                                    formatsForHeight.forEach((f, i) => {
                                        console.log(`  [${i}] ID: ${f.format_id}, TBR: ${f.tbr}, VBR: ${f.vbr}, Audio: ${f.has_audio}, ACodec: ${f.acodec}, Pref: ${f.preference}`);
                                    });
                                    
                                    // Sort by priority: audio codec preference, combined formats, then by bitrate, then by preference
                                    const bestFormat = formatsForHeight.sort((a, b) => {
                                        // First, prioritize better audio codecs (AAC > MP3 > Opus > others)
                                        const getAudioCodecScore = (acodec) => {
                                            if (!acodec || acodec === 'none') return 0;
                                            if (acodec.includes('aac')) return 4;
                                            if (acodec.includes('mp3')) return 3;
                                            if (acodec.includes('mp4a')) return 4; // MP4 audio
                                            if (acodec.includes('opus')) return 2;
                                            return 1; // other codecs
                                        };
                                        
                                        const aAudioScore = getAudioCodecScore(a.acodec);
                                        const bAudioScore = getAudioCodecScore(b.acodec);
                                        
                                        if (aAudioScore !== bAudioScore) {
                                            return bAudioScore - aAudioScore;
                                        }
                                        
                                        // Then prioritize combined formats (has both video and audio)
                                        if (a.has_audio !== b.has_audio) {
                                            return b.has_audio ? 1 : -1;
                                        }
                                        
                                        // Then by total bitrate
                                        if (a.tbr !== b.tbr) {
                                            return b.tbr - a.tbr;
                                        }
                                        // Then by video bitrate
                                        if (a.vbr !== b.vbr) {
                                            return b.vbr - a.vbr;
                                        }
                                        // Then by preference
                                        if (a.preference !== b.preference) {
                                            return b.preference - a.preference;
                                        }
                                        // Finally by filesize
                                        return b.filesize - a.filesize;
                                    })[0];
                                    
                                    console.log(`  SELECTED: ID: ${bestFormat.format_id}, TBR: ${bestFormat.tbr}, VBR: ${bestFormat.vbr}, Audio: ${bestFormat.has_audio}, ACodec: ${bestFormat.acodec}`);
                                    
                                    uniqueVideoFormats.push({
                                        format_id: bestFormat.format_id,
                                        height: bestFormat.height,
                                        quality: bestFormat.quality,
                                        ext: bestFormat.ext,
                                        format_note: bestFormat.format_note,
                                        vcodec: bestFormat.vcodec,
                                        acodec: bestFormat.acodec
                                    });
                                });
                                
                                // Sort final results by height descending
                                uniqueVideoFormats.sort((a, b) => b.height - a.height);
                                
                                console.log('\nFinal unique video formats:');
                                uniqueVideoFormats.forEach(f => {
                                    console.log(`  ${f.quality} - ID: ${f.format_id}`);
                                });
                                
                                // Get audio-only formats
                                const audioFormats = info.formats
                                    .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
                                    .map(f => ({
                                        format_id: f.format_id,
                                        quality: f.format_note || 'audio',
                                        ext: f.ext || 'mp3',
                                        abr: f.abr || 128,
                                        acodec: f.acodec
                                    }));
                                
                                formats.push(...uniqueVideoFormats, ...audioFormats);
                                console.log('Total formats being returned:', formats.length);
                            }
                            
                            resolve({
                                title: info.title || 'Untitled Video',
                                description: info.description || '',
                                channelTitle: info.channel || 'Unknown Channel',
                                channelUrl: info.channel_url || '',
                                thumbnail: Array.isArray(info.thumbnails) && info.thumbnails.length > 0 
                                    ? info.thumbnails[info.thumbnails.length - 1].url 
                                    : (info.thumbnail || ''),
                                viewCount: info.view_count || 0,
                                likeCount: info.like_count || 0,
                                duration: info.duration || 0,
                                publishedAt: info.upload_date || '',
                                formats: formats
                            });
                        } catch (error) {
                            console.error('Failed to parse yt-dlp output:', error);
                            console.error('Output was:', stdout);
                            reject(new Error(`Failed to parse video info: ${error.message}`));
                        }
                    } else {
                        console.error(`yt-dlp exited with code ${code}: ${stderr}`);
                        reject(new Error(`Error fetching video info: ${stderr || 'Unknown error'}`));
                    }
                });
                
                child.on('error', (error) => {
                    console.error('Failed to spawn yt-dlp:', error);
                    reject(new Error(`Failed to run yt-dlp: ${error.message}`));
                });
            });
        }

        // In development, use the regular ytdlp-exec module
        console.log('Using yt-dlp-exec module for video details');
        const info = await ytdlp(url, options);
        
        console.log('Successfully got video details');
        
        // Extract available formats
        const formats = [];
        if (info.formats && Array.isArray(info.formats)) {
            console.log('Raw formats count:', info.formats.length);
            
            // Get video formats with height info
            const videoFormats = info.formats
                .filter(f => f.height && f.vcodec !== 'none')
                .map(f => ({
                    format_id: f.format_id,
                    height: f.height,
                    quality: `${f.height}p`,
                    ext: f.ext || 'mp4',
                    format_note: f.format_note || '',
                    vcodec: f.vcodec,
                    acodec: f.acodec,
                    fps: f.fps || 30,
                    tbr: f.tbr || 0, // total bitrate
                    vbr: f.vbr || 0, // video bitrate
                    preference: f.preference || 0,
                    has_audio: f.acodec && f.acodec !== 'none',
                    protocol: f.protocol || '',
                    filesize: f.filesize || 0
                }));
            
            console.log('Filtered video formats count:', videoFormats.length);
            console.log('Video formats by height:');
            videoFormats.forEach(f => {
                console.log(`  ${f.height}p - ID: ${f.format_id}, TBR: ${f.tbr}, VBR: ${f.vbr}, Audio: ${f.has_audio}, ACodec: ${f.acodec}, Pref: ${f.preference}`);
            });
            
            // Group formats by height
            const formatsByHeight = {};
            videoFormats.forEach(format => {
                if (!formatsByHeight[format.height]) {
                    formatsByHeight[format.height] = [];
                }
                formatsByHeight[format.height].push(format);
            });
            
            console.log('Grouped formats by height:');
            Object.keys(formatsByHeight).forEach(height => {
                console.log(`  ${height}p: ${formatsByHeight[height].length} formats`);
            });
            
            // Select the best format for each height
            const uniqueVideoFormats = [];
            Object.keys(formatsByHeight).forEach(height => {
                const formatsForHeight = formatsByHeight[height];
                console.log(`\nProcessing ${height}p formats (${formatsForHeight.length} available):`);
                
                formatsForHeight.forEach((f, i) => {
                    console.log(`  [${i}] ID: ${f.format_id}, TBR: ${f.tbr}, VBR: ${f.vbr}, Audio: ${f.has_audio}, ACodec: ${f.acodec}, Pref: ${f.preference}`);
                });
                
                // Sort by priority: audio codec preference, combined formats, then by bitrate, then by preference
                const bestFormat = formatsForHeight.sort((a, b) => {
                    // First, prioritize better audio codecs (AAC > MP3 > Opus > others)
                    const getAudioCodecScore = (acodec) => {
                        if (!acodec || acodec === 'none') return 0;
                        if (acodec.includes('aac')) return 4;
                        if (acodec.includes('mp3')) return 3;
                        if (acodec.includes('mp4a')) return 4; // MP4 audio
                        if (acodec.includes('opus')) return 2;
                        return 1; // other codecs
                    };
                    
                    const aAudioScore = getAudioCodecScore(a.acodec);
                    const bAudioScore = getAudioCodecScore(b.acodec);
                    
                    if (aAudioScore !== bAudioScore) {
                        return bAudioScore - aAudioScore;
                    }
                    
                    // Then prioritize combined formats (has both video and audio)
                    if (a.has_audio !== b.has_audio) {
                        return b.has_audio ? 1 : -1;
                    }
                    
                    // Then by total bitrate
                    if (a.tbr !== b.tbr) {
                        return b.tbr - a.tbr;
                    }
                    // Then by video bitrate
                    if (a.vbr !== b.vbr) {
                        return b.vbr - a.vbr;
                    }
                    // Then by preference
                    if (a.preference !== b.preference) {
                        return b.preference - a.preference;
                    }
                    // Finally by filesize
                    return b.filesize - a.filesize;
                })[0];
                
                console.log(`  SELECTED: ID: ${bestFormat.format_id}, TBR: ${bestFormat.tbr}, VBR: ${bestFormat.vbr}, Audio: ${bestFormat.has_audio}, ACodec: ${bestFormat.acodec}`);
                
                uniqueVideoFormats.push({
                    format_id: bestFormat.format_id,
                    height: bestFormat.height,
                    quality: bestFormat.quality,
                    ext: bestFormat.ext,
                    format_note: bestFormat.format_note,
                    vcodec: bestFormat.vcodec,
                    acodec: bestFormat.acodec
                });
            });
            
            // Sort final results by height descending
            uniqueVideoFormats.sort((a, b) => b.height - a.height);
            
            console.log('\nFinal unique video formats:');
            uniqueVideoFormats.forEach(f => {
                console.log(`  ${f.quality} - ID: ${f.format_id}`);
            });
            
            // Get audio-only formats
            const audioFormats = info.formats
                .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
                .map(f => ({
                    format_id: f.format_id,
                    quality: f.format_note || 'audio',
                    ext: f.ext || 'mp3',
                    abr: f.abr || 128,
                    acodec: f.acodec
                }));
            
            formats.push(...uniqueVideoFormats, ...audioFormats);
            console.log('Total formats being returned:', formats.length);
        }
        
        return {
            title: info.title || 'Untitled Video',
            description: info.description || '',
            channelTitle: info.channel || 'Unknown Channel',
            channelUrl: info.channel_url || '',
            thumbnail: Array.isArray(info.thumbnails) && info.thumbnails.length > 0 
                ? info.thumbnails[info.thumbnails.length - 1].url 
                : (info.thumbnail || ''),
            viewCount: info.view_count || 0,
            likeCount: info.like_count || 0,
            duration: info.duration || 0,
            publishedAt: info.upload_date || '',
            formats: formats
        };
    } catch (error) {
        console.error('Error in getVideoDetails:', error);
        throw new Error('Failed to fetch video details: ' + error.message);
    }
}

async function downloadVideo(url, outputPath, format = 'mp4', formatId = null) {
    const ffmpegPath = getFfmpegPath();
    const ytdlpPath = getYtDlpPath();

    console.log(`Downloading with format: ${format}, formatId: ${formatId}`);
    console.log(`Using ffmpeg at: ${ffmpegPath}`);
    console.log(`Using yt-dlp at: ${ytdlpPath}`);

    // Determine the format selector based on input
    let formatSelector;
    if (formatId) {
        // Use specific format ID if provided
        if (format === 'mp3') {
            // For audio downloads, we still want best audio even if a video format ID is provided
            formatSelector = 'bestaudio';
        } else {
            // For video downloads, try to get video-only format and add best compatible audio
            formatSelector = `${formatId}+bestaudio[acodec^=mp4a]/best[format_id=${formatId}]+bestaudio[acodec^=aac]/${formatId}+bestaudio`;
        }
    } else {
        // Fallback to generic quality options if no specific format ID
        const qualityOptions = {
            low: {
                format: format === 'mp3' 
                    ? 'bestaudio'
                    : 'worstvideo[height>=360]+bestaudio/worst[height>=360]/best'
            },
            medium: {
                format: format === 'mp3' 
                    ? 'bestaudio'
                    : 'bestvideo[height<=720]+bestaudio/best[height<=720]/best'
            },
            high: {
                format: format === 'mp3' 
                    ? 'bestaudio'
                    : 'bestvideo+bestaudio/best'
            }
        };
        const preset = qualityOptions.medium;
        formatSelector = preset.format;
    }

    console.log(`Using format selector: ${formatSelector}`);

    // Verify files exist in production
    if (app.isPackaged) {
        if (ytdlpPath && !fs.existsSync(ytdlpPath)) {
            throw new Error(`yt-dlp binary not found. Please make sure the application is installed correctly.`);
        }
        // We'll continue even if ffmpeg isn't found, it's only needed for some operations
        if (!fs.existsSync(ffmpegPath)) {
            console.warn(`ffmpeg binary not found at: ${ffmpegPath}. Some operations may fail.`);
        }
    }

    // Ensure output directory exists
    const expandedOutputPath = outputPath.startsWith('~') 
        ? path.join(os.homedir(), outputPath.slice(1))
        : outputPath;
        
    try {
        if (!fs.existsSync(expandedOutputPath)) {
            fs.mkdirSync(expandedOutputPath, { recursive: true });
            console.log(`Created output directory: ${expandedOutputPath}`);
        }
    } catch (e) {
        console.error(`Failed to create output directory: ${e.message}`);
        throw new Error(`Cannot create output directory: ${e.message}`);
    }

    // Download to a temp directory first
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asp-dl-'));
    const tempOutput = path.join(tempDir, '%(title)s.%(ext)s');
    let finalFilePath = null;

    try {
        console.log(`Using temp directory: ${tempDir}`);

        if (app.isPackaged) {
            // In production, use direct spawn - more reliable with packaged apps
            const { spawn } = require('child_process');
            
            let attempt = 1;
            const maxAttempts = 3;
            
            while (attempt <= maxAttempts) {
                console.log(`Download attempt ${attempt}/${maxAttempts}`);
                
                try {
                    // Select args based on the attempt number (progressively simplifies)
                    const args = [
                        url,
                        '--output', tempOutput,
                        '--windows-filenames',
                        '--restrict-filenames',
                        '--no-check-certificates',
                        '--prefer-free-formats',
                        '--no-part', // Important: Don't create .part files
                        '--no-mtime',
                        '--force-overwrites'
                    ];

                    // Add ffmpeg location if it exists
                    if (fs.existsSync(ffmpegPath)) {
                        args.push('--ffmpeg-location', ffmpegPath);
                    }

                    // Add format-specific arguments for mp3 or mp4
                    if (format === 'mp3') {
                        args.push('--extract-audio');
                        args.push('--audio-format', 'mp3');
                        args.push('--audio-quality', '0');
                        args.push('--format', formatSelector);
                    } else {
                        args.push('--format', formatSelector);
                        args.push('--recode-video', 'mp4');
                        // Progressive audio conversion strategies based on attempt
                        if (fs.existsSync(ffmpegPath)) {
                            if (attempt === 1) {
                                console.log('Attempt 1: Using maximally compatible encoding (baseline H.264, stereo AAC)');
                                args.push('--postprocessor-args', 'ffmpeg:-c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -movflags +faststart -c:a aac -ac 2 -ar 44100 -b:a 128k');
                                args.push('--audio-format', 'aac');
                            } else if (attempt === 2) {
                                console.log('Attempt 2: Using simpler AAC conversion with basic H.264');
                                args.push('--postprocessor-args', 'ffmpeg:-c:v libx264 -profile:v main -pix_fmt yuv420p -c:a aac -ac 2 -b:a 128k');
                                args.push('--audio-format', 'aac');
                            } else {
                                console.log('Attempt 3: Using basic audio format conversion only');
                                args.push('--audio-format', 'aac');
                            }
                        } else {
                            console.warn('ffmpeg not found, cannot convert audio codec');
                        }
                    }
                    
                    console.log(`Command: ${ytdlpPath} ${args.join(' ')}`);
                    
                    // Execute the download
                    await new Promise((resolve, reject) => {
                        const child = spawn(ytdlpPath, args, {
                            windowsHide: true
                        });
                        
                        let stdout = '';
                        let stderr = '';
                        
                        child.stdout.on('data', (data) => {
                            const output = data.toString();
                            stdout += output;
                            // Don't log all output to keep console cleaner
                            if (output.includes('%')) {
                                console.log('Download progress:', output.trim());
                            }
                        });
                        
                        child.stderr.on('data', (data) => {
                            stderr += data.toString();
                            console.error('yt-dlp stderr:', data.toString());
                        });
                        
                        child.on('error', (error) => {
                            console.error('yt-dlp spawn error:', error);
                            reject(error);
                        });
                        
                        child.on('close', (code) => {
                            if (code === 0) {
                                resolve();
                            } else {
                                reject(new Error(`yt-dlp exited with code ${code}: ${stderr || stdout}`));
                            }
                        });
                    });
                    
                    // Find the downloaded files (excluding temp files)
                    const allFiles = fs.readdirSync(tempDir);
                    console.log('Files in temp directory:', allFiles);
                    
                    const downloadedFiles = allFiles.filter(f => 
                        !f.endsWith('.part') && 
                        !f.endsWith('.webp') && 
                        !f.match(/\.f\d+\./) &&
                        (format === 'mp3' ? f.endsWith('.mp3') : (f.endsWith('.mp4') || f.endsWith('.mkv')))
                    );
                    
                    if (downloadedFiles.length > 0) {
                        console.log('Downloaded file(s):', downloadedFiles);
                        
                        // Move the file to the output location
                        const sourceFile = path.join(tempDir, downloadedFiles[0]);
                        const targetFile = path.join(expandedOutputPath, downloadedFiles[0]);
                        finalFilePath = targetFile;
                        
                        // Make sure the file isn't already there
                        if (fs.existsSync(targetFile)) {
                            fs.unlinkSync(targetFile);
                        }
                        
                        console.log(`Moving ${sourceFile} to ${targetFile}`);
                        fs.renameSync(sourceFile, targetFile);
                        
                        // Clean up temp directory contents except the main download
                        allFiles.forEach(file => {
                            if (file !== downloadedFiles[0]) {
                                try {
                                    fs.unlinkSync(path.join(tempDir, file));
                                } catch (e) {
                                    console.log(`Failed to delete temp file: ${file}`);
                                }
                            }
                        });
                        
                        return targetFile; // Return the path of the downloaded file
                    }
                    
                    console.warn(`No ${format} files found in temp directory`);
                    attempt++;
                } catch (error) {
                    console.error(`Download attempt ${attempt} failed:`, error);
                    if (attempt >= maxAttempts) throw error;
                    attempt++;
                }
            }
            
            throw new Error('All download attempts failed');
            
        } else {
            // In development, use ytdlp-exec for simpler testing
            console.log('Running in development mode, using yt-dlp-exec');
            
            let attempt = 1;
            const maxAttempts = 3;
            
            while (attempt <= maxAttempts) {
                console.log(`Development download attempt ${attempt}/${maxAttempts}`);
                
                try {
                    const options = {
                        output: tempOutput,
                        windowsFilenames: true,
                        restrictFilenames: true,
                        noCheckCertificates: true,
                        preferFreeFormats: true,
                        ffmpegLocation: ffmpegPath,
                        noPart: true,
                        noMtime: true,
                        forceOverwrites: true
                    };
                    
                    if (format === 'mp3') {
                        options.extractAudio = true;
                        options.audioFormat = 'mp3';
                        options.audioQuality = 0;
                        options.format = formatSelector;
                    } else {
                        options.format = formatSelector;
                        options.recodeVideo = 'mp4';
                        // Force AAC audio codec with Windows-compatible settings for MP4 files
                        if (fs.existsSync(ffmpegPath)) {
                            if (attempt === 1) {
                                console.log('Attempt 1: Using maximally compatible encoding for Windows Media Player');
                                // Use baseline H.264 profile which is most compatible, plus faststart for web/streaming compatibility
                                options.postprocessorArgs = 'ffmpeg:-c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -movflags +faststart -c:a aac -ac 2 -ar 44100 -b:a 128k';
                                options.audioFormat = 'aac';
                            } else if (attempt === 2) {
                                console.log('Attempt 2: Using simpler compatible encoding');
                                options.postprocessorArgs = 'ffmpeg:-c:v libx264 -profile:v main -pix_fmt yuv420p -c:a aac -ac 2 -b:a 128k';
                                options.audioFormat = 'aac';
                            } else {
                                console.log('Attempt 3: Using basic audio conversion only');
                                options.audioFormat = 'aac';
                                delete options.postprocessorArgs;
                            }
                        } else {
                            console.warn('ffmpeg not found, cannot convert audio codec');
                        }
                    }
                    
                    console.log(`Download attempt ${attempt}/${maxAttempts} with options:`, options);
                    await ytdlp(url, options);
                    
                    // Check for successful download
                    const allFiles = fs.readdirSync(tempDir);
                    console.log('Files in temp directory:', allFiles);
                    
                    const downloadedFiles = allFiles.filter(f =>
                        !f.endsWith('.part') &&
                        !f.endsWith('.webp') &&
                        !f.match(/\.f\d+\./) &&
                        (format === 'mp3' ? f.endsWith('.mp3') : (f.endsWith('.mp4') || f.endsWith('.mkv')))
                    );
                    
                    if (downloadedFiles.length > 0) {
                        // Move the file to the output location
                        const sourceFile = path.join(tempDir, downloadedFiles[0]);
                        const targetFile = path.join(expandedOutputPath, downloadedFiles[0]);
                        finalFilePath = targetFile;
                        
                        // Make sure the file isn't already there
                        if (fs.existsSync(targetFile)) {
                            fs.unlinkSync(targetFile);
                        }
                        
                        console.log(`Moving ${sourceFile} to ${targetFile}`);
                        fs.renameSync(sourceFile, targetFile);
                        
                        // Clean up other temp files
                        allFiles.forEach(file => {
                            if (file !== downloadedFiles[0]) {
                                try {
                                    fs.unlinkSync(path.join(tempDir, file));
                                } catch (e) {
                                    console.log(`Failed to delete temp file: ${file}`);
                                }
                            }
                        });
                        
                        return targetFile;
                    }
                    
                    console.warn(`No ${format} files found in temp directory`);
                    attempt++;
                } catch (error) {
                    console.error(`Download attempt ${attempt} failed:`, error);
                    if (attempt >= maxAttempts) throw error;
                    attempt++;
                }
            }
            
            throw new Error('All download attempts failed');
        }
        
    } catch (error) {
        console.error('Download failed:', error);
        // If we failed but a file was somehow created, try to clean it up
        if (finalFilePath && fs.existsSync(finalFilePath)) {
            try {
                fs.unlinkSync(finalFilePath);
            } catch (e) {}
        }
        return false;
    } finally {
        // Always clean up the temp directory
        try {
            fs.rm(tempDir, { recursive: true, force: true }, (err) => {
                if (err) console.error('Failed to delete temp directory:', err);
            });
        } catch (error) {
            console.error('Failed to delete temp directory:', error);
        }
    }
}

module.exports = { getVideoDetails, downloadVideo };