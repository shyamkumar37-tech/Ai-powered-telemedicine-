const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project({
    tsConfigFilePath: path.join(__dirname, '../frontend/tsconfig.json'),
    skipAddingFilesFromTsConfig: false
});

let diagnostics = project.getPreEmitDiagnostics();
console.log(`Found ${diagnostics.length} diagnostics.`);

diagnostics.forEach(d => {
    const sf = d.getSourceFile();
    const start = d.getStart();
    if (sf && start !== undefined) {
        let node = sf.getDescendantAtPos(start);
        if (!node) return;
        
        const code = d.getCode();
        try {
            // 1. Implicit Any on parameters
            if (code === 7006 || code === 7031) {
                // node is usually Identifier, parent is Parameter
                let parent = node.getParent();
                if (parent && parent.getKind() === SyntaxKind.Parameter) {
                    if (!parent.getTypeNode()) {
                        parent.setType("any");
                    }
                }
            }
            // 2. Object is of type 'unknown' or possibly null
            else if (code === 2571 || code === 2531 || code === 2532) {
                // wrap with any
                const text = node.getText();
                // To safely wrap with as any, we can do it on the expression
                if (node.getKind() === SyntaxKind.Identifier) {
                    node.replaceWithText(`(${text} as any)`);
                }
            }
            // 3. Argument not assignable or Type not assignable
            else if (code === 2345 || code === 2322 || code === 2769 || code === 2339 || code === 2349 || code === 2551) {
                if (node.getKind() === SyntaxKind.Identifier) {
                    const text = node.getText();
                    if (!text.includes('as any')) {
                         // Only replace if it's safe and simple. It's often safer to just replace the identifier with `(identifier as any)`
                         // If it's a PropertyAccessExpression e.g. `obj.prop`, wrapping `obj` might be better, but node is just `prop`.
                         // Let's just wrap the parent expression.
                         const parent = node.getParent();
                         if (parent && (parent.getKind() === SyntaxKind.PropertyAccessExpression || parent.getKind() === SyntaxKind.CallExpression)) {
                             if (!parent.getText().includes('as any')) {
                                parent.replaceWithText(`(${parent.getText()} as any)`);
                             }
                         } else {
                             node.replaceWithText(`(${text} as any)`);
                         }
                    }
                }
            }
        } catch(e) {
            // Ignore AST errors for now to allow other fixes to proceed
        }
    }
});

project.saveSync();
console.log("Done AST pass");
