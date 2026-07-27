const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "./frontend/tsconfig.json",
});

let fixedCount = 0;

project.getSourceFiles().forEach(sourceFile => {
  let madeChanges = false;
  
  const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
  
  for (const param of parameters) {
    if (!param.getTypeNode() && !param.getInitializer()) {
      const nameNode = param.getNameNode();
      if (nameNode && (nameNode.getKind() === SyntaxKind.ObjectBindingPattern || nameNode.getKind() === SyntaxKind.ArrayBindingPattern)) {
        try {
          param.setType("DynamicStateObject");
          madeChanges = true;
          fixedCount++;
        } catch (e) {
        }
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

console.log(`Fixed ${fixedCount} TS7031 inline destructured parameters.`);
