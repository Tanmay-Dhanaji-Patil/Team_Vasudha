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
                if (size < 1000) { // Tiny file means it's likely an error page
                    fs.unlinkSync(dest);
                    return reject(new Error('File too small, probably not a font'));
                }
                console.log(`Downloaded ${filename} (${size} bytes)`);
                resolve();
            });
        }).on('error', reject);
    });
}

const fonts = [
    { name: 'Hind-Regular.ttf', urls: ['https://github.com/google/fonts/raw/main/ofl/hind/Hind-Regular.ttf'] },
    { name: 'Hind-Bold.ttf', urls: ['https://github.com/google/fonts/raw/main/ofl/hind/Hind-Bold.ttf'] },
    { name: 'HindVadodara-Regular.ttf', urls: ['https://github.com/google/fonts/raw/main/ofl/hindvadodara/HindVadodara-Regular.ttf'] },
    { name: 'HindVadodara-Bold.ttf', urls: ['https://github.com/google/fonts/raw/main/ofl/hindvadodara/HindVadodara-Bold.ttf'] },

    {
        name: 'NotoSansTelugu-Regular.ttf',
        urls: [
            'https://github.com/notofonts/noto-fonts/raw/main/unhinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf',
            'https://github.com/google/fonts/raw/main/ofl/notosanstelugu/NotoSansTelugu-Regular.ttf',
            'https://github.com/google/fonts/raw/main/ofl/notosanstelugu/static/NotoSansTelugu-Regular.ttf'
        ]
    },
    {
        name: 'NotoSansTelugu-Bold.ttf',
        urls: [
            'https://github.com/notofonts/noto-fonts/raw/main/unhinted/ttf/NotoSansTelugu/NotoSansTelugu-Bold.ttf',
            'https://github.com/google/fonts/raw/main/ofl/notosanstelugu/NotoSansTelugu-Bold.ttf'
        ]
    },
    {
        name: 'NotoSansTamil-Regular.ttf',
        urls: [
            'https://github.com/notofonts/noto-fonts/raw/main/unhinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf',
            'https://github.com/google/fonts/raw/main/ofl/notosanstamil/NotoSansTamil-Regular.ttf'
        ]
    },
    {
        name: 'NotoSansTamil-Bold.ttf',
        urls: [
            'https://github.com/notofonts/noto-fonts/raw/main/unhinted/ttf/NotoSansTamil/NotoSansTamil-Bold.ttf',
            'https://github.com/google/fonts/raw/main/ofl/notosanstamil/NotoSansTamil-Bold.ttf'
        ]
    },
    {
        name: 'NotoSansKannada-Regular.ttf',
        urls: [
            'https://github.com/notofonts/noto-fonts/raw/main/unhinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf',
            'https://github.com/google/fonts/raw/main/ofl/notosanskannada/NotoSansKannada-Regular.ttf'
        ]
    },
    {
        name: 'NotoSansKannada-Bold.ttf',
        urls: [
            'https://github.com/notofonts/noto-fonts/raw/main/unhinted/ttf/NotoSansKannada/NotoSansKannada-Bold.ttf',
            'https://github.com/google/fonts/raw/main/ofl/notosanskannada/NotoSansKannada-Bold.ttf'
        ]
    },
    {
        name: 'NotoSansBengali-Regular.ttf',
        urls: [
            'https://github.com/notofonts/noto-fonts/raw/main/unhinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf',
            'https://github.com/google/fonts/raw/main/ofl/notosansbengali/NotoSansBengali-Regular.ttf'
        ]
    },
    {
        name: 'NotoSansBengali-Bold.ttf',
        urls: [
            'https://github.com/notofonts/noto-fonts/raw/main/unhinted/ttf/NotoSansBengali/NotoSansBengali-Bold.ttf',
            'https://github.com/google/fonts/raw/main/ofl/notosansbengali/NotoSansBengali-Bold.ttf'
        ]
    }
];

async function tryDownload(font) {
    for (const url of font.urls) {
        try {
            await download(url, font.name);
            return;
        } catch (err) {
            console.log(`Failed ${url}: ${err.message}`);
        }
    }
    console.error(`ERROR: All URLs failed for ${font.name}`);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('Starting regional font downloads...');
    for (const font of fonts) {
        await tryDownload(font);
        await sleep(1000);
    }
    console.log('Process completed.');
}

main();
