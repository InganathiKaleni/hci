const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public');

function rimraf(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest, filter = () => true) {
    if (!fs.existsSync(src)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        ensureDir(dest);
        for (const entry of fs.readdirSync(src)) {
            copyRecursive(path.join(src, entry), path.join(dest, entry), filter);
        }
    } else if (filter(src)) {
        ensureDir(path.dirname(dest));
        fs.copyFileSync(src, dest);
    }
}

// Clean output
rimraf(outDir);
ensureDir(outDir);

// Copy static assets
const include = [
    'index.html', 'Admin.html', 'Lecturer.html', 'Student.html',
    'adminc.html', 'lecturec.html', 'studentc.html',
    'style.css', 'index.css', 'qr-redirect.html', 'script.js', 'sub.js'
];

for (const file of include) {
    const src = path.join(root, file);
    if (fs.existsSync(src)) {
        const dest = path.join(outDir, file);
        copyRecursive(src, dest);
    }
}

// Copy folders
copyRecursive(path.join(root, 'js'), path.join(outDir, 'js'));
copyRecursive(path.join(root, 'css'), path.join(outDir, 'css'));

// Create a default 404 for SPA-like behavior
const indexPath = path.join(root, 'index.html');
if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    fs.writeFileSync(path.join(outDir, '404.html'), html);
}

console.log('Static site built to', outDir);

