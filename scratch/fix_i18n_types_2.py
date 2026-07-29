import re

path = 'frontend/src/utils/i18n.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix occurrences that don't have the double parens
content = content.replace('(displayValueLabels)[language]', '(displayValueLabels as Record<string, Record<string, string>>)[language]')
content = content.replace('(displayMessageLabels)[language]', '(displayMessageLabels as Record<string, Record<string, string>>)[language]')
content = content.replace('(voiceAccessibilityDisplayLabels)[language]', '(voiceAccessibilityDisplayLabels as Record<string, Record<string, string>>)[language]')
content = content.replace('(labels)[language]', '(labels as Record<string, Record<string, string>>)[language]')

content = content.replace('(labels.en)[key]', '(labels.en as Record<string, string>)[key]')

# Fix the as Record<string, [RegExp, string][]> to as unknown as Record<string, [RegExp, string][]>
content = content.replace('as Record<string, [RegExp, string][]>', 'as unknown as Record<string, [RegExp, string][]>')

# Also fix `part` implicitly having any type in `some`
content = content.replace('(part, index: number | string)', '(part: string, index: number)')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
