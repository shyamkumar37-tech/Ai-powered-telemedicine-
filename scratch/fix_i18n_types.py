import re

path = 'frontend/src/utils/i18n.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('((displayValueLabels)[language])', '((displayValueLabels as Record<string, Record<string, string>>)[language])')
content = content.replace('((displayMessageLabels)[language])', '((displayMessageLabels as Record<string, Record<string, string>>)[language])')
content = content.replace('((voiceAccessibilityDisplayLabels)[language])', '((voiceAccessibilityDisplayLabels as Record<string, Record<string, string>>)[language])')
content = content.replace('((labels)[language])', '((labels as Record<string, Record<string, string>>)[language])')

content = content.replace('(labels.en)[key]', '(labels.en as Record<string, string>)[key]')
content = content.replace('(labels.en)', '(labels.en as Record<string, string>)')

content = content.replace('((replacementRules)[language] || [])', '((replacementRules as Record<string, [RegExp, string][]>)[language] || [])')

content = content.replace('(current, [pattern, replacement])', '(current: string, [pattern, replacement]: [RegExp, string])')
content = content.replace('(part)', '(part: string)')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
