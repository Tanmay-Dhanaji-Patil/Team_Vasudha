const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

async function download(url, filename) {
    const dest = path.join(fontsDir, filename);
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return download(res.headers.location, filename).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));

            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                const size = fs.statSync(dest).size;
                console.log(`Downloaded ${filename} (${size} bytes)`);
                resolve();
            });
        }).on('error', reject);
    });
}

async function main() {
    try {
        console.log('Downloading Lohit Devanagari...');
        await download('https://cdnjs.cloudflare.com/ajax/libs/lohit-hindi/2.5.3/Lohit-Devanagari.ttf', 'Lohit-Devanagari.ttf');
        console.log('Finished.');
    } catch (err) {
        console.error('Download failed:', err.message);
    }
}

main();
