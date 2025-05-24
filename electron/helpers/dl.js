const ytdlp = require('yt-dlp-exec');
const ffmpeg = require('ffmpeg-static');

async function getVideoDetails(url) {
    try {
        const info = await ytdlp(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificates: true,
            preferFreeFormats: true,
            ffmpegLocation: ffmpeg,
        });

        // Return only the fields your frontend expects
        return {
            title: info.title,
            description: info.description,
            channelTitle: info.channel,
            channelUrl: info.channel_url,
            thumbnail: Array.isArray(info.thumbnails) ? info.thumbnails[info.thumbnails.length - 1].url : info.thumbnail,
            viewCount: info.view_count,
            likeCount: info.like_count,
            duration: info.duration,
            publishedAt: info.upload_date,
        };
    } catch (error) {
        throw new Error('Failed to fetch video details');
    }
}

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
        ffmpegLocation: ffmpeg,  // Use the packaged ffmpeg binary
        noMtime: true            // <-- Add this line to prevent setting file mtime to upload date
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

module.exports = { getVideoDetails, downloadVideo };