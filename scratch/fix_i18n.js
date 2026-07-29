const fs = require('fs');

const path = 'frontend/src/utils/i18n.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove all suppressions
content = content.replace(/\s*\/\/\s*@ts-expect-error\s*-\s*Auto-suppressed during migration/g, '');

// 2. Fix translateTemplatedPhrase
content = content.replace(
  'function translateTemplatedPhrase(language: DynamicStateObject, text: DynamicStateObject)',
  'function translateTemplatedPhrase(language: string, text: string)'
);
content = content.replace(
  'for (const [pattern, formatter]: DynamicStateObject of (templateRules as DynamicStateObject)[language] || []) {',
  'for (const [pattern, formatter] of (templateRules as Record<string, [RegExp, (match: RegExpMatchArray) => string][]>)[language] || []) {'
);
content = content.replace(
  'const templateRules = {',
  'const templateRules: Record<string, [RegExp, (match: RegExpMatchArray) => string][]> = {'
);
content = content.replace(/\[, item\]: DynamicStateObject/g, '[, item]: RegExpMatchArray');
content = content.replace(/\[, name\]: DynamicStateObject/g, '[, name]: RegExpMatchArray');

// 3. Fix looksLikeMojibake
content = content.replace(
  /function looksLikeMojibake\(value: string \| number\) \{([\s\S]*?)return value\.includes\("Ãƒ"\)([\s\S]*?)\|\| value\.includes\("à¨"\);\n\}/,
  `function looksLikeMojibake(value: string | number) {
  if (!value) return false;
  const str = String(value);
  return str.includes("Ãƒ") || str.includes("Ã‚") || str.includes("Ã¢") || str.includes("ï¿½") || str.includes("Ã Â") || str.includes("à¤") || str.includes("à®") || str.includes("à´") || str.includes("à°") || str.includes("à¨");
}`
);

// 4. Fix translateDisplayText
content = content.replace(
  'export const translateDisplayText = (language: DynamicStateObject, value: string | number) => {',
  'export const translateDisplayText = (language: string, value: string | number | null | undefined): string | null => {'
);

// Fix index accesses by casting to our explicit Type
const dictType = 'Record<string, Record<string, string>>';
content = content.replace(/\(displayValueLabels as DynamicStateObject\)\[language\]/g, `(displayValueLabels as ${dictType})[language]`);
content = content.replace(/\(displayMessageLabels as DynamicStateObject\)\[language\]/g, `(displayMessageLabels as ${dictType})[language]`);
content = content.replace(/\(voiceAccessibilityDisplayLabels as DynamicStateObject\)\[language\]/g, `(voiceAccessibilityDisplayLabels as ${dictType})[language]`);
content = content.replace(/\(labels as DynamicStateObject\)\[language\]/g, `(labels as ${dictType})[language]`);
content = content.replace(/\(labels\.en as DynamicStateObject\)/g, `(labels.en as Record<string, string>)`);
content = content.replace(/\(displayValueLabels\.en as DynamicStateObject\)/g, `(displayValueLabels.en as Record<string, string>)`);
content = content.replace(/\(displayMessageLabels\.en as DynamicStateObject\)/g, `(displayMessageLabels.en as Record<string, string>)`);
content = content.replace(/\(voiceAccessibilityDisplayLabels\.en as DynamicStateObject\)/g, `(voiceAccessibilityDisplayLabels.en as Record<string, string>)`);

// 5. Fix remaining DynamicStateObject usages
content = content.replace(/\(char: DynamicStateObject\)/g, '(char: string)');
content = content.replace(/\(part: DynamicStateObject\)/g, '(part: string)');
content = content.replace(/\(part: DynamicStateObject, index: number \| string\)/g, '(part: string, index: number)');
content = content.replace(/\(source: DynamicStateObject, target: DynamicStateObject\)/g, '(source: string, target: string)');
content = content.replace(/\(language: DynamicStateObject\)/g, '(language: string)');
content = content.replace(/\(language: DynamicStateObject, text: DynamicStateObject\)/g, '(language: string, text: string)');
content = content.replace(/as DynamicStateObject\)/g, 'as any)'); // Fallback
content = content.replace(/\[source, target\]: DynamicStateObject/g, '[source, target]');
content = content.replace(/\(left: DynamicStateObject, right: DynamicStateObject\)/g, '(left: [string, string], right: [string, string])');
content = content.replace(/\(right as DynamicStateObject\)\[0\]/g, 'right[0]');
content = content.replace(/\(left as DynamicStateObject\)\[0\]/g, 'left[0]');
content = content.replace(/\(current: DynamicStateObject, \[source, target\]: DynamicStateObject\)/g, '(current: string, [source, target]: [string, string])');
content = content.replace(/for \(const separator: DynamicStateObject of delimitedSeparators\)/g, 'for (const separator of delimitedSeparators)');
content = content.replace(/key: DynamicStateObject/g, 'key: string');

// Remove the import if it exists
content = content.replace(/import \{ DynamicStateObject \} from "\.\.\/types\/DynamicState";\n/g, '');

fs.writeFileSync(path, content, 'utf8');
