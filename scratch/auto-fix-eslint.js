const fs = require('fs');
const report = JSON.parse(fs.readFileSync('../frontend/eslint_report.json', 'utf8'));

report.forEach(fileResult => {
  const tUndefErrors = fileResult.messages.filter(m => m.ruleId === 'no-undef' && m.message === "'t' is not defined");
  if (tUndefErrors.length > 0) {
    let content = fs.readFileSync(fileResult.filePath, 'utf8');
    let modified = false;

    // Fix translation destructuring
    if (content.includes('const { translateUiText = (value) => value } = useLanguage();')) {
      content = content.replace(
        'const { translateUiText = (value) => value } = useLanguage();',
        'const { translateUiText = (value) => value, t } = useLanguage();'
      );
      modified = true;
    } else if (content.includes('const { translateUiText = (value) => value } = useLanguage()')) {
      content = content.replace(
        'const { translateUiText = (value) => value } = useLanguage()',
        'const { translateUiText = (value) => value, t } = useLanguage()'
      );
      modified = true;
    } else if (content.includes('useLanguage()')) {
        // Find const { ... } = useLanguage() and inject t
        content = content.replace(/const\s*\{([^}]+)\}\s*=\s*useLanguage\(\)/, (match, p1) => {
            if (p1.includes('t,') || p1.includes(', t') || p1.includes('t ')) return match;
            return `const {${p1}, t } = useLanguage()`;
        });
        modified = true;
    } else {
        // Need to add import and hook
        if (!content.includes('useLanguage')) {
            if (content.includes('import React')) {
                content = content.replace(/import React[^;]+;/, "$&\nimport { useLanguage } from \"../context/LanguageContext\";");
            } else if (content.includes('import {')) {
                content = content.replace(/import \{[^;]+;/, "$&\nimport { useLanguage } from \"../context/LanguageContext\";");
            } else {
                content = "import { useLanguage } from \"../context/LanguageContext\";\n" + content;
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
            /const (\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/,
            "const $1 = ($2) => {\n  const { t } = useLanguage();"
        );
        modified = true;
    }

    if (modified) {
      fs.writeFileSync(fileResult.filePath, content, 'utf8');
      console.log('Fixed:', fileResult.filePath);
    }
  }
});
