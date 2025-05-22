const ytdlp = require('yt-dlp-exec');
const ffmpeg = require('ffmpeg-static');

async function downloadVideo(url, outputPath, format = 'mp4', quality = 'medium') {
    const qualityOptions = {
        low: {
            format: format === 'mp3' 
                ? 'bestaudio'
                : 'bv[height<=480]+ba'
        },
        medium: {
            format: format === 'mp3' 
                ? 'bestaudio'
                : 'bv[height<=720]+ba'
        },
        high: {
            format: format === 'mp3' 
                ? 'bestaudio'
                : 'bv+ba'
        }
    };

    const preset = qualityOptions[quality] || qualityOptions.medium;

    const options = {
        output: `${outputPath}/%(title)s.%(ext)s`,
        windowsFilenames: true,
        restrictFilenames: true,
        noCheckCertificates: true,
        preferFreeFormats: true,
        format: preset.format,
        audioQuality: 0,
        addMetadata: true,
        writeSubs: false,        // Disable subtitle downloading
        writeAutoSubs: false,    // Disable auto-generated subtitle downloading
        embedThumbnail: true,
        ffmpegLocation: ffmpeg   // Use the packaged ffmpeg binary
    };

    // Handle MP3 downloads
    if (format === 'mp3') {
        options.extractAudio = true;
        options.audioFormat = 'mp3';
        options.audioQuality = '0'; // Best quality
    } else {
        options.format = preset.format;
        options.remuxVideo = format;
        options.mergeOutputFormat = format;
    }

    try {
        console.log('Downloading with options:', options);
        await ytdlp(url, options);
        return true;
    } catch (error) {
        console.error('Download failed:', error);
        return false;
    }
}

module.exports = { downloadVideo };