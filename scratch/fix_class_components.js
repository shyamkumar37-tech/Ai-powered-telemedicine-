const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "./frontend/tsconfig.json",
});

let fixedCount = 0;

project.getSourceFiles().forEach(sourceFile => {
  let madeChanges = false;
  
  const classes = sourceFile.getClasses();
  
  for (const cls of classes) {
    const ext = cls.getExtends();
    if (ext && (ext.getText() === "Component" || ext.getText() === "React.Component" || ext.getText() === "PureComponent" || ext.getText() === "React.PureComponent")) {
      const typeArgs = ext.getTypeArguments();
      if (typeArgs.length === 0) {
        ext.addTypeArgument("DynamicStateObject");
        ext.addTypeArgument("DynamicStateObject");
        madeChanges = true;
        fixedCount++;
      } else if (typeArgs.length === 1) {
        ext.addTypeArgument("DynamicStateObject");
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

console.log(`Fixed ${fixedCount} Class components.`);
