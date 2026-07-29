const fs = require('fs');

const path = 'frontend/src/components/triage/HumanBodyModel.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\s*\{\/\*\s*@ts-expect-error\s*-\s*Auto-suppressed during migration\s*\*\/\}/g, '');
content = content.replace(/\s*\/\/\s*@ts-expect-error\s*-\s*Auto-suppressed during migration/g, '');

content = content.replace(
  'export interface HumanBodyModelProps {\n  onPartClick?: (...args: DynamicStateObject[]) => void;\n    [key: string]: ReturnType<typeof JSON.parse>;\n}',
  'export interface HumanBodyModelProps {\n  onPartClick?: (part: string) => void;\n}'
);
content = content.replace(/e: DynamicStateObject/g, 'e: any');
content = content.replace('onPartClick("', 'onPartClick?.("');

content = content.replace(/import \{ DynamicStateObject \} from "\.\.\/\.\.\/types\/DynamicState";\n/g, '');

// Prepend the triple slash reference
content = '/// <reference types="@react-three/fiber" />\n' + content;

fs.writeFileSync(path, content, 'utf8');
