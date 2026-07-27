const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SRC_DIR = path.join(__dirname, "../frontend/src");

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else if (fullPath.endsWith(".jsx") || fullPath.endsWith(".js")) {
      callback(fullPath);
    }
  }
}

walk(SRC_DIR, (file) => {
  let content = fs.readFileSync(file, "utf8");
  
  // If 't' is not used, skip
  if (!/\bt\(["']/.test(content)) return;

  let modified = false;

  // Case 1: has `const { translateUiText ... } = useLanguage()` but no `t`
  if (content.includes("useLanguage()") && !content.includes(" t ") && !content.includes(", t") && !content.includes("t,")) {
    content = content.replace(
      /const\s*\{\s*([^}]*?translateUiText[^}]*?)\}\s*=\s*useLanguage\(\)/g,
      "const { $1, t } = useLanguage()"
    );
    // Also catch any simple `const { language } = useLanguage()`
    content = content.replace(
      /const\s*\{\s*([^}]*?language[^}]*?)\}\s*=\s*useLanguage\(\)/g,
      (match, p1) => {
        if (p1.includes("t ") || p1.includes(" t,") || p1.includes(",t") || p1.includes("t:")) return match;
        return `const { ${p1}, t } = useLanguage()`;
      }
    );
    modified = true;
  }

  // Case 2: has `translateUiText(` but no `useLanguage()`
  // Case 3: `t(` is used but no `useLanguage` imported
  if (!content.includes("useLanguage")) {
    if (content.includes("import React")) {
        content = content.replace(/import React[^;]+;/, "$&\nimport { useLanguage } from \"../context/LanguageContext\";");
    } else {
        content = "import { useLanguage } from \"../context/LanguageContext\";\n" + content;
    }
    // Inject at start of functional components
    content = content.replace(
      /export default function (\w+)\(([^)]*)\)\s*\{/,
      "export default function $1($2) {\n  const { t } = useLanguage();"
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Fixed", file);
  }
});
