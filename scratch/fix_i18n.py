import re

path = 'frontend/src/utils/i18n.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. looksLikeMojibake
content = re.sub(
    r'function looksLikeMojibake\(value: string \| number\) \{\n  if \(\!value\) \{\n    return false;\n  \}\n(?:  // @ts-expect-error - Auto-suppressed during migration\n)+  return value\.includes\("Ãƒ"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("Ã‚"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("Ã¢"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("ï¿½"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("Ã Â"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à¤"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à®"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à´"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à°"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à¨"\);',
    r'''function looksLikeMojibake(value: string | number) {
  if (!value) {
    return false;
  }
  const str = String(value);
  return str.includes("Ãƒ")
    || str.includes("Ã‚")
    || str.includes("Ã¢")
    || str.includes("ï¿½")
    || str.includes("Ã Â")
    || str.includes("à¤")
    || str.includes("à®")
    || str.includes("à´")
    || str.includes("à°")
    || str.includes("à¨");''',
    content
)

# 2. translateTemplatedPhrase
content = re.sub(
    r'// @ts-expect-error - Auto-suppressed during migration\nfunction translateTemplatedPhrase\(language: DynamicStateObject, text: DynamicStateObject\) \{\n  // @ts-expect-error - Auto-suppressed during migration\n  const templateRules = \{',
    r'''function translateTemplatedPhrase(language: string, text: string) {
  const templateRules: Record<string, [RegExp, (match: string[]) => string][]> = {''',
    content
)

# Replace all internal rules matching `( [, item]: DynamicStateObject )` to `( [, item]: string[] )` etc
# actually it's easier to just strip the typings and suppressions inside templateRules
content = re.sub(r'// @ts-expect-error - Auto-suppressed during migration\n\s+', '', content)
content = content.replace(': DynamicStateObject', '')
content = content.replace(' as DynamicStateObject', '')

# 3. translateDisplayText
content = re.sub(
    r'export const translateDisplayText = \(language, value\) => \{',
    r'export const translateDisplayText = (language: string, value: string | number | null | undefined) => {',
    content
)

# But wait, we stripped 'as DynamicStateObject' from everything, let's fix the explicit ones
content = re.sub(
    r'export const translateDisplayText = \(language, value: string \| number\) => \{',
    r'export const translateDisplayText = (language: string, value: string | number | null | undefined) => {',
    content
)

content = content.replace('const text = rawText.trim();', 'const text = rawText.trim();')
content = content.replace('for (const separator of delimitedSeparators)', 'for (const separator of delimitedSeparators)')

# replace any leftover `DynamicStateObject`
content = content.replace('DynamicStateObject', 'any')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
