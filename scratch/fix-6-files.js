const fs = require('fs');
const files = [
  'c:/Users/shyamkumar/Desktop/oose pro/frontend/src/components/booking/DoctorCard.jsx',
  'c:/Users/shyamkumar/Desktop/oose pro/frontend/src/components/ui/DatePicker.jsx',
  'c:/Users/shyamkumar/Desktop/oose pro/frontend/src/components/ui/Modal.jsx',
  'c:/Users/shyamkumar/Desktop/oose pro/frontend/src/pages/ContactPage.jsx',
  'c:/Users/shyamkumar/Desktop/oose pro/frontend/src/pages/PatientProfileSetupPage.jsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('const { t } = useLanguage()')) return;
  
  if (!content.includes('useLanguage')) {
    if (content.includes('import React')) {
        content = content.replace(/import React[^;]+;/, "$&\nimport { useLanguage } from \"../context/LanguageContext\";");
    } else {
        content = "import { useLanguage } from \"../../context/LanguageContext\";\n" + content;
    }
  }
  
  content = content.replace(
      /export default function (\w+)\(([^)]*)\)\s*\{/,
      "export default function $1($2) {\n  const { t } = useLanguage();"
  );
  content = content.replace(
      /export function (\w+)\(([^)]*)\)\s*\{/,
      "export function $1($2) {\n  const { t } = useLanguage();"
  );
  content = content.replace(
      /function (\w+)\(([^)]*)\)\s*\{/,
      "function $1($2) {\n  const { t } = useLanguage();"
  );
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
});
