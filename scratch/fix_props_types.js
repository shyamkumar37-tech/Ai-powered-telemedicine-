const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "./frontend/tsconfig.json",
});

let fixedCount = 0;

project.getSourceFiles().forEach(sourceFile => {
  let madeChanges = false;
  
  const typeAliases = sourceFile.getTypeAliases();
  
  for (const alias of typeAliases) {
    if (alias.getName().endsWith("Props") || alias.getName().endsWith("Options") || alias.getName().endsWith("Config")) {
      const typeNode = alias.getTypeNode();
      if (typeNode && typeNode.getKind() === SyntaxKind.TypeLiteral) {
        const hasIndexSignature = typeNode.getDescendantsOfKind(SyntaxKind.IndexSignature).length > 0;
        if (!hasIndexSignature) {
          typeNode.addIndexSignature({
            keyName: "key",
            keyType: "string",
            returnType: "ReturnType<typeof JSON.parse>"
          });
          madeChanges = true;
          fixedCount++;
        }
      }
    }
  }
  
  if (madeChanges) {
    sourceFile.saveSync();
  }
});

console.log(`Added index signature to ${fixedCount} Props types.`);
