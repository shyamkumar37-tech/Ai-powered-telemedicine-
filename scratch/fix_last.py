import re
import os

# 1. i18n.ts
path = 'frontend/src/utils/i18n.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Change translateDisplayText to return null instead of undefined when nothing matches
content = content.replace(
    'export const translateDisplayText = (language: string, value: string | number | null | undefined): string | number | null | undefined => {',
    'export const translateDisplayText = (language: string, value: string | number | null | undefined): string | number | null => {'
)
content = content.replace(
    'return ((displayValueLabels as any).en as Record<string, string>)?.[text]\n    ?? ((displayMessageLabels as any).en as Record<string, string>)?.[text]\n    ?? rawText;',
    'return ((displayValueLabels as any).en as Record<string, string>)?.[text]\n    ?? ((displayMessageLabels as any).en as Record<string, string>)?.[text]\n    ?? rawText\n    ?? null;'
)

# Fix the array.some callback parameter type error
# src/utils/i18n.ts(4886,32): error TS2345: Argument of type '(part: string, index: number) => boolean' is not assignable to parameter of type '(value: string | number | null | undefined, index: number, array: (string | number | null | undefined)[]) => unknown'.
# The some function is called on translatedParts which is an array of what? string | number | null | undefined.
content = content.replace(
    '(part: string, index: number) => part !== (text.split(separator))[index].trim()',
    '(part: any, index: number) => part !== (text.split(separator))[index].trim()'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. LanguageContext.tsx
path = 'frontend/src/context/LanguageContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any lingering undefined returns
content = content.replace(
    'translateUiText: (value: string | number) => string | number | null | undefined;',
    'translateUiText: (value: string | number) => string | number | null;'
)

# Fix setLanguage(t(language)) to cast to string properly
content = re.sub(r'setLanguage\((t\(.*?\))\)', r'setLanguage((\1 as string))', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# 3. Badge.tsx
path = 'frontend/src/components/Badge.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we cast to string | undefined
content = content.replace('as string || ariaLabel || undefined', 'as string | undefined')
content = content.replace('aria-label={translateUiText(voiceLabel) as string | undefined}', 'aria-label={(translateUiText(voiceLabel) as string) || ariaLabel || undefined}')
content = content.replace('data-voice-label={translateUiText(voiceLabel) as string | undefined}', 'data-voice-label={(translateUiText(voiceLabel) as string) || ariaLabel || undefined}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
