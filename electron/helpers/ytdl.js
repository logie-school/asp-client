const ytdlp = require('yt-dlp-exec');

class YoutubeVideoDetails {
    async getVideoDetails(url) {
        try {
            const info = await ytdlp(url, {
                dumpSingleJson: true,
                noCheckCertificate: true,
                noWarnings: true,
                preferFreeFormats: true
            });

            // Get the highest quality thumbnail by checking resolution
            const thumbnail = info.thumbnails.reduce((highest, current) => {
                const currentRes = (current.width || 0) * (current.height || 0);
                const highestRes = (highest.width || 0) * (highest.height || 0);
                return currentRes > highestRes ? current : highest;
            }, { width: 0, height: 0 });

            return {
                title: info.title,
                description: info.description,
                publishedAt: info.upload_date,
                channelTitle: info.uploader,
                channelUrl: info.uploader_url,
                thumbnail: thumbnail.url,
                viewCount: info.view_count,
                likeCount: info.like_count,
                duration: info.duration,
            };
        } catch (error) {
            throw new Error(`YT-DLP Error: ${error.message}`);
        }
    }
}

module.exports = YoutubeVideoDetails;