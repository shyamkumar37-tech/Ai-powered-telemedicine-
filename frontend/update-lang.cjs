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
      
      if (c.includes('className="lang"') && !c.includes('<LanguageSwitcher')) {
        const isAiPage = dir.includes('ai');
        const importPath = isAiPage ? '../../components/LanguageSwitcher' : '../components/LanguageSwitcher';
        
        if (!c.includes('LanguageSwitcher')) {
          c = c.replace(/(import .*;\n)(?!import)/, `$1import LanguageSwitcher from "${importPath}";\n`);
        }

        const selectRegex = /<select className="lang"[^>]*>[\s\S]*?<\/select>/g;
        c = c.replace(selectRegex, '<LanguageSwitcher customClass="lang" hideLabel />');

        fs.writeFileSync(fullPath, c);
        console.log('Updated ' + fullPath);
      }
    }
  });
});
