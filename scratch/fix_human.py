import re

path = 'frontend/src/components/triage/HumanBodyModel.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'\s*\{\/\* @ts-expect-error - Auto-suppressed during migration \*\/\}', '', content)
content = re.sub(r'\s*// @ts-expect-error - Auto-suppressed during migration', '', content)

content = re.sub(
    r'export interface HumanBodyModelProps \{\n  onPartClick\?\: \(\.\.\.args\: DynamicStateObject\[\]\) => void;\n    \[key: string\]: ReturnType<typeof JSON\.parse>;\n\}',
    r'''export interface HumanBodyModelProps {
  onPartClick?: (part: string) => void;
}''',
    content
)

content = content.replace('e: DynamicStateObject', 'e: any')
content = content.replace('import { DynamicStateObject } from "./../../types/DynamicState";\n', '')
content = content.replace('onPartClick(', 'onPartClick?.(')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
