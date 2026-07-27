const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./frontend/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace all instances of the ugly string
    content = content.replace(/string \| number \| boolean \| null \| undefined \| Record<string, string \| number \| boolean \| null \| undefined>/g, "DynamicState");
    content = content.replace(/Record<string, string \| number \| boolean \| null \| undefined>/g, "DynamicState");
    
    if (content !== original) {
      // add import if missing
      const importPath = "./" + path.relative(path.dirname(filePath), path.join(process.cwd(), "frontend/src/types/DynamicState")).replace(/\\/g, '/');
      if (!content.includes("import { DynamicState }") && !content.includes("import type { DynamicState }")) {
         content = `import { DynamicState } from "${importPath}";\n` + content;
      }
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
console.log("Replaced ugly fallback types with DynamicState.");
