const { Project } = require("ts-morph");

const project = new Project({
  tsConfigFilePath: "./frontend/tsconfig.json",
});

let count = 0;
project.getSourceFiles().forEach(sf => {
  const imports = sf.getImportDeclarations();
  for (const imp of imports) {
    if (imp.getModuleSpecifierValue().endsWith("DynamicState")) {
      const namedImports = imp.getNamedImports().map(ni => ni.getName());
      if (namedImports.includes("DynamicState") && !namedImports.includes("DynamicStateObject")) {
        imp.addNamedImport("DynamicStateObject");
        count++;
        sf.saveSync();
      } else if (!namedImports.includes("DynamicStateObject") && sf.getFullText().includes("DynamicStateObject")) {
        imp.addNamedImport("DynamicStateObject");
        count++;
        sf.saveSync();
      }
    }
  }
});
console.log(`Fixed imports in ${count} files.`);
