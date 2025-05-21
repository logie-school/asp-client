const { get } = require('http');
const YoutubeVideoDetails = require('../helpers/ytdl.js');

const youtube = new YoutubeVideoDetails();

async function getDetails() {
    try {
        const details = await youtube.getVideoDetails('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        console.log(details);
    } catch (error) {
        console.error(error);
    }
}

console.log(getDetails());