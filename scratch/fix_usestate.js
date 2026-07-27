const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "./frontend/tsconfig.json",
});

const sourceFiles = project.getSourceFiles();

let fixedCount = 0;

sourceFiles.forEach(sourceFile => {
  let madeChanges = false;
  
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (const call of calls) {
    const expr = call.getExpression();
    if (expr.getText() === "useState" || expr.getText() === "React.useState") {
      const args = call.getArguments();
      if (args.length === 1) {
        if (!call.getTypeArguments() || call.getTypeArguments().length === 0) {
          if (args[0].getText() === "null") {
            call.addTypeArgument("DynamicStateObject | null");
            madeChanges = true;
            fixedCount++;
          } else if (args[0].getText() === "[]") {
            call.addTypeArgument("DynamicStateObject[]");
            madeChanges = true;
            fixedCount++;
          }
        } else {
          // Replace DynamicState with DynamicStateObject
          const typeArgs = call.getTypeArguments();
          if (typeArgs[0].getText() === "DynamicState | null") {
            call.removeTypeArgument(0);
            call.addTypeArgument("DynamicStateObject | null");
            madeChanges = true;
            fixedCount++;
          }
        }
      }
    }
  }
  
  if (madeChanges) {
    // Add import
    const importPath = path.relative(path.dirname(sourceFile.getFilePath()), path.join(process.cwd(), "frontend/src/types/DynamicState")).replace(/\\/g, '/');
    const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === importPath || i.getModuleSpecifierValue().endsWith("DynamicState"));
    
    if (!existingImport) {
       sourceFile.addImportDeclaration({
          namedImports: ["DynamicState", "DynamicStateObject"],
          moduleSpecifier: importPath.startsWith(".") ? importPath : "./" + importPath
       });
    }
    
    sourceFile.saveSync();
  }
});

console.log(`Fixed ${fixedCount} useState(null) occurrences.`);
