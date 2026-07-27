const fs = require('fs');

function dedupe(file) {
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  
  let newLines = [];
  let tDeclared = false;
  
  for (let line of lines) {
    if (line.includes('const { t } = useLanguage();')) {
      if (!tDeclared) {
        newLines.push(line);
        tDeclared = true;
      }
    } else if (line.includes('const { t, language, translateUiText } = useLanguage();')) {
      if (!tDeclared) {
        newLines.push(line);
        tDeclared = true;
      } else {
        newLines.push(line.replace('t, ', ''));
      }
    } else {
      newLines.push(line);
    }
  }
  
  fs.writeFileSync(file, newLines.join('\n'), 'utf8');
  console.log('Fixed', file);
}

dedupe('c:/Users/shyamkumar/Desktop/oose pro/frontend/src/pages/ContactPage.jsx');
dedupe('c:/Users/shyamkumar/Desktop/oose pro/frontend/src/pages/PatientProfileSetupPage.jsx');
