const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src');
const contextDir = path.join(srcDir, 'context');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      callback(fullPath);
    }
  }
}

walk(srcDir, (file) => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import { useLanguage } from')) {
    // Determine correct relative path
    const fileDir = path.dirname(file);
    let relativePath = path.relative(fileDir, path.join(contextDir, 'LanguageContext')).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    
    const correctImport = `import { useLanguage } from "${relativePath}";`;
    
    // Regex to match any incorrect relative path for LanguageContext
    const regex = /import\s*\{\s*useLanguage\s*\}\s*from\s*["'][^"']*context\/LanguageContext["'];?/g;
    
    const newContent = content.replace(regex, correctImport);
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log('Fixed import in', file);
    }
  }
});
