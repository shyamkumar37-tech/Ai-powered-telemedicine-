const fs = require('fs');
const path = require('path');

const dirs = ['src/pages', 'src/ai/pages'];

dirs.forEach(dir => {
  const fullDir = path.join(__dirname, dir);
  if (!fs.existsSync(fullDir)) return;

  fs.readdirSync(fullDir).forEach(file => {
    if (file.endsWith('.jsx')) {
      const fullPath = path.join(fullDir, file);
      let c = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;
      if (c.includes('<main role="main">')) {
        c = c.replace(/<main role="main">/g, '<main id="page-main" role="main">');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, c);
        console.log('Updated ' + fullPath);
      }
    }
  });
});
