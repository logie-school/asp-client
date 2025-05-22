import { downloadVideo } from '../helpers/dl.js';
import path from 'path';
import os from 'os';

const userDownloads = path.join(os.homedir(), 'Downloads');
const videoUrl = 'https://www.youtube.com/watch?v=NLjnOsP_q1U';

await downloadVideo(
    videoUrl,
    userDownloads,
    'mp4',
    'low'
).then((result) => {
    console.log('Download result:', result);
}).catch((error) => {
    console.error('Error during download:', error);
});