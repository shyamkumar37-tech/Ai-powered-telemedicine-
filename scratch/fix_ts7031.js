const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: "./frontend/tsconfig.json",
});

const sourceFiles = project.getSourceFiles();

let fixedCount = 0;

sourceFiles.forEach(sourceFile => {
  let madeChanges = true;
  
  while (madeChanges) {
    madeChanges = false;
    const functions = [
      ...sourceFile.getFunctions(),
      ...sourceFile.getVariableDeclarations().map(v => v.getInitializerIfKind(SyntaxKind.ArrowFunction)).filter(Boolean)
    ];

    for (const func of functions) {
      if (madeChanges) break;
      try {
        const nameNode = func.getNameNode ? func.getNameNode() : (func.getParentIfKind(SyntaxKind.VariableDeclaration)?.getNameNode());
        if (!nameNode) continue;
        const name = nameNode.getText();
        if (!/^[A-Z]/.test(name)) continue;

        const parameters = func.getParameters();
        if (parameters.length === 1) {
          const param = parameters[0];
          const paramNameNode = param.getNameNode();
          
          if (paramNameNode && paramNameNode.getKind() === SyntaxKind.ObjectBindingPattern && !param.getTypeNode()) {
            const props = paramNameNode.getElements().map(e => e.getNameNode().getText());
            const interfaceName = `${name}Props`;
            
            // Apply changes
            param.setType(interfaceName);
            
            if (!sourceFile.getInterface(interfaceName)) {
               let interfaceText = `export interface ${interfaceName} {\n`;
               props.forEach(p => {
                 let type = "DynamicState";
                 if (p === "children") type = "ReactNode";
                 else if (p.startsWith("on")) type = "(...args: never[]) => void";
                 
                 interfaceText += `  ${p}?: ${type};\n`;
               });
               interfaceText += `}\n\n`;
               
               sourceFile.insertText(func.getStart(), interfaceText);
            }
            
            if (props.some(p => p !== "children" && !p.startsWith("on"))) {
               const importPath = "./" + path.relative(path.dirname(sourceFile.getFilePath()), path.join(process.cwd(), "frontend/src/types/DynamicState")).replace(/\\/g, '/');
               const existingImport = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === importPath || i.getModuleSpecifierValue().endsWith("DynamicState"));
               
               if (!existingImport) {
                  sourceFile.addImportDeclaration({
                     namedImports: ["DynamicState"],
                     moduleSpecifier: importPath
                  });
               }
            }
            
            if (props.includes("children")) {
               const imports = sourceFile.getImportDeclarations();
               const reactImport = imports.find(i => i.getModuleSpecifierValue() === "react");
               if (reactImport) {
                  const namedImports = reactImport.getNamedImports().map(ni => ni.getName());
                  if (!namedImports.includes("ReactNode")) {
                      reactImport.addNamedImport("ReactNode");
                  }
               } else {
                  sourceFile.addImportDeclaration({
                      namedImports: ["ReactNode"],
                      moduleSpecifier: "react"
                  });
               }
            }
            
            madeChanges = true;
            fixedCount++;
          }
        }
      } catch (e) {
        // ignore ast errors and retry
      }
    }
    
    if (madeChanges) {
      sourceFile.saveSync();
    }
  }
});

console.log(`Fixed ${fixedCount} TS7031 occurrences.`);
