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
      const args = call.getArguments();
      if (args.length === 1 && args[0].getText() === "[]") {
        if (!call.getTypeArguments() || call.getTypeArguments().length === 0) {
          call.addTypeArgument("DynamicStateObject[]");
          madeChanges = true;
          fixedCount++;
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

console.log(`Fixed ${fixedCount} untyped useState([]) occurrences.`);
