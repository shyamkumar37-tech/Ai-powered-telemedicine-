const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "./frontend/tsconfig.json",
});

let fixedCount = 0;

project.getSourceFiles().forEach(sourceFile => {
  let madeChanges = false;
  
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (const call of calls) {
    const expr = call.getExpression();
    if (expr.getText() === "useState" || expr.getText() === "React.useState") {
      if (!call.getTypeArguments() || call.getTypeArguments().length === 0) {
        call.addTypeArgument("DynamicState");
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
          namedImports: ["DynamicState"],
          moduleSpecifier: importPath.startsWith(".") ? importPath : "./" + importPath
       });
    } else {
       const namedImports = existingImport.getNamedImports().map(ni => ni.getName());
       if (!namedImports.includes("DynamicState")) {
          existingImport.addNamedImport("DynamicState");
       }
    }
    sourceFile.saveSync();
  }
});

console.log(`Fixed ${fixedCount} untyped useState occurrences.`);
