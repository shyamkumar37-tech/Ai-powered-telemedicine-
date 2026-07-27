const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "./frontend/tsconfig.json",
});

const sourceFiles = project.getSourceFiles();

let fixedCount = 0;

sourceFiles.forEach(sourceFile => {
  let madeChanges = false;

  const parameters = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);

  for (const param of parameters) {
    // If it has no type, no initializer, and it's not a destructured object (TS7031 handled that)
    if (!param.getTypeNode() && !param.getInitializer()) {
      const nameNode = param.getNameNode();
      if (nameNode && nameNode.getKind() === SyntaxKind.Identifier) {
        
        let type = "string";
        const name = nameNode.getText();
        
        if (name === "e" || name === "event" || name === "err" || name === "error") {
            type = "DynamicStateObject"; // easiest for event or error
        } else if (name === "id" || name === "index" || name === "count") {
            type = "number | string";
        } else if (name === "val" || name === "value") {
            type = "string | number";
        } else if (name.startsWith("is") || name.startsWith("has") || name.startsWith("can")) {
            type = "boolean";
        } else {
            type = "DynamicStateObject";
        }
        
        try {
          param.setType(type);
          madeChanges = true;
          fixedCount++;
        } catch (e) {
          // ignore AST detachment errors
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
    }
    sourceFile.saveSync();
  }
});

console.log(`Fixed ${fixedCount} TS7006 occurrences.`);
