const readline = require('readline');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const { SingleBar } = require('cli-progress');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const locDir = fs.readFileSync('./locDir.env','utf8');

const cleanFileName = (fileName) => {
    return fileName.replace(/[\/\?<>\\:\*\|"]/g, ' '); // Menghapus karakter yang tidak diizinkan dalam nama file
};

async function ytmp3(url) {
    try {
        const info = await ytdl.getInfo(url);
        const audioTitle = cleanFileName(info.videoDetails.title); // Membersihkan judul audio

        const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        if (!audioFormat) {
            throw new Error('Format audio tidak ditemukan.');
        }

        const targetDir = path.join(locDir);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const progressBar = new SingleBar({
            format: 'Downloading | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} bytes',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        const videoSize = audioFormat.contentLength || 0;
        let receivedBytes = 0;

        const videoStream = ytdl(url, { format: audioFormat });
        const writeStream = fs.createWriteStream(path.join(targetDir, `${audioTitle}.mp3`));

        videoStream.on('progress', (chunkLength, downloaded, total) => {
            receivedBytes += chunkLength;
            progressBar.update(receivedBytes);
        });

        progressBar.start(videoSize, 0);
        videoStream.pipe(writeStream);

        writeStream.on('finish', () => {
            progressBar.stop();
            console.log('Audio berhasil di unduh silahkan buka ' + locDir + `/${audioTitle}.mp3`);
            rl.close();
        });
    } catch (error) {
        console.error('Terjadi kesalahan : ' + error.message);
    }
}

async function download() {
    rl.question('Masukan url youtube : ', async (url) => {
        if (!url) return console.log('Masukan url dengan benar!!');
        ytmp3(url);
    });
}

download();
