import re
import os

# 1. Badge.tsx
path = 'frontend/src/components/Badge.tsx'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('aria-label={translateUiText(voiceLabel) || ariaLabel}', 'aria-label={translateUiText(voiceLabel) as string || ariaLabel || undefined}')
    content = content.replace('data-voice-label={translateUiText(voiceLabel) || ariaLabel}', 'data-voice-label={translateUiText(voiceLabel) as string || ariaLabel || undefined}')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 2. HumanBodyModel.tsx
path = 'frontend/src/components/triage/HumanBodyModel.tsx'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    # "Cannot invoke an object which is possibly 'undefined'." - actually we changed onPartClick("Head") to onPartClick?.("Head") but maybe it missed some.
    content = content.replace('onPartClick("', 'onPartClick?.("')
    
    # Intrinsic elements issue: since this is R3F without global types, we can use JSX.IntrinsicElements declaration
    decl = '''declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      meshStandardMaterial: any;
    }
  }
}
'''
    if 'declare global {' not in content:
        content = decl + content
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 3. LanguageContext.tsx
path = 'frontend/src/context/LanguageContext.tsx'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Fix the interface of translateUiText
    content = content.replace(
        'translateUiText: (value: string) => string;',
        'translateUiText: (value: string | number) => string | number | null;'
    )
    # Fix the argument of type string | null is not assignable to string
    # Context lines 416, 512
    # `setLanguage(t(language))` -> `setLanguage(t(language) as string)` maybe?
    # It's better to just regex replace `(t(.*?))` with `(t\1 as string)` where used in setLanguage.
    # Actually, we can just replace `setLanguage(t(language))` to `setLanguage(t(language) as string)` if it exists.
    # Or replace `=> string | number | null` to `=> any` just for the interface? No, user wants explicit.
    content = re.sub(r'setLanguage\((t\(.*?\))\)', r'setLanguage(\1 as string)', content)
    # Also line 244: Type '(value: string | number) => string | number | null' is not assignable to type '(value: string) => string'.
    # I already changed LanguageContextType above.
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 4. telemetry.ts
path = 'frontend/src/services/telemetry.ts'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(
        'function sanitizePayload(value: any, key: string = "") {',
        'function sanitizePayload(value: any, key: string = ""): any {'
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 5. i18n.ts
path = 'frontend/src/utils/i18n.ts'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Property 'en' does not exist on type displayValueLabels
    content = content.replace('(displayValueLabels.en as Record<string, string>)', '((displayValueLabels as any).en as Record<string, string>)')
    content = content.replace('(displayMessageLabels.en as Record<string, string>)', '((displayMessageLabels as any).en as Record<string, string>)')
    content = content.replace('(voiceAccessibilityDisplayLabels.en as Record<string, string>)', '((voiceAccessibilityDisplayLabels as any).en as Record<string, string>)')
    
    # Property 'includes' does not exist on type 'string | number'
    # My previous script might have missed the template translations for `translateTemplatedPhrase`.
    # No, line 4772 is looksLikeMojibake.
    # In looksLikeMojibake, I missed the replacement.
    content = re.sub(
        r'function looksLikeMojibake\(value: string \| number\) \{([\s\S]*?)return value\.includes\("Ãƒ"\)([\s\S]*?)\|\| value\.includes\("à¨"\);\n\}',
        r'''function looksLikeMojibake(value: string | number) {
  if (!value) return false;
  const str = String(value);
  return str.includes("Ãƒ") || str.includes("Ã‚") || str.includes("Ã¢") || str.includes("ï¿½") || str.includes("Ã Â") || str.includes("à¤") || str.includes("à®") || str.includes("à´") || str.includes("à°") || str.includes("à¨");
}''',
        content
    )
    # Type '"" | null | undefined' is not assignable to type 'string | null'
    # line 4799: export const translateDisplayText = ... : string | null => {
    # If value is "" it returns "". "" is string. But maybe it returns value which is undefined?
    # Change signature to `...): string | number | null | undefined => {`
    content = content.replace(
        'export const translateDisplayText = (language: string, value: string | number | null | undefined): string | null => {',
        'export const translateDisplayText = (language: string, value: string | number | null | undefined): string | number | null | undefined => {'
    )
    # Property 'trim' does not exist on type 'string | number'.
    content = content.replace('const text = rawText.trim();', 'const text = String(rawText).trim();')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
