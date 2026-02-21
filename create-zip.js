const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const output = fs.createWriteStream(path.join(__dirname, 'test-deploy.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log('ZIP created successfully:', archive.pointer(), 'bytes');
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);

const srcDir = path.join(__dirname, 'test-deploy');

// Add files and directories with forward slashes
function addDir(dir, base) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const zipPath = base ? base + '/' + entry : entry;
        if (fs.statSync(fullPath).isDirectory()) {
            addDir(fullPath, zipPath);
        } else {
            archive.file(fullPath, { name: zipPath });
        }
    }
}

addDir(srcDir, '');
archive.finalize();
