import fs from "fs";
import path from "path";

const root = path.resolve("frontend", "src");
const exts = new Set([".js", ".jsx", ".ts", ".tsx"]);
const files = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (exts.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
};

walk(root);

const imports = new Map();
const importRegex = /^\s*import\s+.*from\s+['"]([^'"]+)['"]/gm;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = importRegex.exec(content))) {
    const mod = match[1];
    if (mod.startsWith(".") || mod.startsWith("/")) {
      continue;
    }
    if (!imports.has(mod)) {
      imports.set(mod, new Set());
    }
    imports.get(mod).add(file);
  }
}

const packages = Array.from(imports.keys()).sort();
packages.forEach((pkg) => {
  console.log(pkg);
});
