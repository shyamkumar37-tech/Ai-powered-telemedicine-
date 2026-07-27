const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "./frontend/tsconfig.json",
});

let fixedCount = 0;

project.getSourceFiles().forEach(sourceFile => {
  let madeChanges = false;
  
  const varDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  
  for (const decl of varDeclarations) {
    if (!decl.getTypeNode()) {
      const init = decl.getInitializer();
      if (!init || init.getText() === "null" || init.getText() === "[]" || init.getText() === "undefined") {
        decl.setType("DynamicStateObject");
        madeChanges = true;
        fixedCount++;
      }
    }
  }
  
  if (madeChanges) {
    const importPath = "./" + path.relative(path.dirname(sourceFile.getFilePath()), path.join(process.cwd(), "frontend/src/types/DynamicState")).replace(/\\/g, '/');
    const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === importPath || i.getModuleSpecifierValue().endsWith("DynamicState"));
    
    if (!existingImport) {
       sourceFile.addImportDeclaration({
          namedImports: ["DynamicStateObject"],
          moduleSpecifier: importPath.startsWith(".") ? importPath : "./" + importPath
       });
    } else {
       const namedImports = existingImport.getNamedImports().map(ni => ni.getName());
       if (!namedImports.includes("DynamicStateObject")) {
          existingImport.addNamedImport("DynamicStateObject");
       }
    }
    sourceFile.saveSync();
  }
});

console.log(`Fixed ${fixedCount} VariableDeclarations.`);
