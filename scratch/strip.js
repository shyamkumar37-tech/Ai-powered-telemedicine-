const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const targetDir = path.join(__dirname, '../frontend/src');

walkDir(targetDir, function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('Auto-suppressed during migration')) {
            // Remove block comments: {/* @ts-expect-error - Auto-suppressed during migration */}
            content = content.replace(/\s*\{\/\*\s*@ts-expect-error\s*-\s*Auto-suppressed during migration\s*\*\/\}/g, '');
            // Remove line comments
            content = content.replace(/\s*\/\/\s*@ts-expect-error\s*-\s*Auto-suppressed during migration/g, '');
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
});

console.log("Stripped suppressions");
