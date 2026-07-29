import re

path = 'frontend/src/context/LanguageContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove DynamicState imports
content = re.sub(r'import \{ DynamicStateObject, DynamicState \} from "\./\.\./types/DynamicState";\n', '', content)
content = content.replace(': DynamicStateObject', '')
content = content.replace(': DynamicState', '')
content = content.replace(' as DynamicStateObject', '')

# 2. Add TranslationCache type
content = re.sub(
    r'(const RUNTIME_TRANSLATION_STORAGE_KEY = [^\n]+;\nconst missingKeyWarnings = new Set\(\);\n)',
    r'\1\ntype TranslationCache = Record<string, Record<string, string>>;\n',
    content
)

# 3. looksLikeMojibake
content = re.sub(
    r'function looksLikeMojibake\(value: string \| number\) \{\n  if \(\!value\) \{\n    return false;\n  \}\n(?:  // @ts-expect-error - Auto-suppressed during migration\n)+  return value\.includes\("Ãƒ"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("Ã‚"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("Ã¢"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("ï¿½"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("Ã Â"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à¤"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à®"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à´"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à°"\)\n(?:(?:  )?  // @ts-expect-error - Auto-suppressed during migration\n)+    \|\| value\.includes\("à¨"\);',
    r'''function looksLikeMojibake(value: string | number) {
  if (!value || typeof value !== "string") {
    return false;
  }
  return value.includes("Ãƒ")
    || value.includes("Ã‚")
    || value.includes("Ã¢")
    || value.includes("ï¿½")
    || value.includes("Ã Â")
    || value.includes("à¤")
    || value.includes("à®")
    || value.includes("à´")
    || value.includes("à°")
    || value.includes("à¨");''',
    content
)

# 4. normalizeMojibake
content = re.sub(
    r'function normalizeMojibake\(value: string \| number\) \{\n  if \(\!looksLikeMojibake\(value\)\) \{\n    return value;\n  \}\n\n  try \{\n    const bytes = Uint8Array\.from\(String\(value\), \(char\) => char\.charCodeAt\(0\)\);\n    return new TextDecoder\("utf-8"\)\.decode\(bytes\)\.trim\(\);\n  \} catch \{\n    return value;\n  \}\n\}',
    r'''function normalizeMojibake(value: string | number): string {
  if (!looksLikeMojibake(value)) {
    return String(value);
  }

  try {
    const bytes = Uint8Array.from(String(value), (char: string) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes).trim();
  } catch {
    return String(value);
  }
}''',
    content
)

# 5. normalizeLanguage & readLanguageFromSearch
content = content.replace('function normalizeLanguage(value) {', 'function normalizeLanguage(value: string | null): string {')
content = content.replace('item => item.code === value', '(item) => item.code === value')
content = re.sub(r'return supportedLanguages\.some\(\(item\) => item\.code === value\) \? value : "en";', r'return supportedLanguages.some((item) => item.code === value) ? (value as string) : "en";', content)

content = content.replace('function readLanguageFromSearch(search) {', 'function readLanguageFromSearch(search: string | null): string | null {')

# 6. readRuntimeTranslations
content = re.sub(
    r'function readRuntimeTranslations\(\) \{',
    r'function readRuntimeTranslations(): TranslationCache {',
    content
)
content = re.sub(
    r'const normalized = \{\};\n    Object\.entries\(parsed\)\.forEach\(\(\[language, entries\]\) => \{\n      if \(\!entries \|\| typeof entries \!\=\= "object"\) \{\n        return;\n      \}\n\n      const nextEntries = \{\};\n      Object\.entries\(entries\)\.forEach\(\(\[key, value\]\) => \{\n        normalized\[key\] = normalizeMojibake\(value\);\n      \}\);\n      normalized\[language\] = nextEntries;\n    \}\);',
    r'''const normalized: TranslationCache = {};
    Object.entries(parsed).forEach(([language, entries]) => {
      if (!entries || typeof entries !== "object") {
        return;
      }
      const nextEntries: Record<string, string> = {};
      Object.entries(entries as Record<string, string>).forEach(([key, value]) => {
        nextEntries[key] = normalizeMojibake(value);
      });
      normalized[language] = nextEntries;
    });''',
    content
)

# 7. persistRuntimeTranslations, getRuntimeTranslation, shouldQueue
content = content.replace('function persistRuntimeTranslations(cache) {', 'function persistRuntimeTranslations(cache: TranslationCache) {')
content = content.replace('function getRuntimeTranslation(cache, language, sourceText) {', 'function getRuntimeTranslation(cache: TranslationCache, language: string, sourceText: string) {')
content = re.sub(
    r'return \(\(cache\)\?\.\[language\]\)\?\.\[normalizedText\] \|\| "";',
    r'return cache?.[language]?.[normalizedText] || "";',
    content
)
content = content.replace('function shouldQueueRuntimeTranslation(language, sourceText, translatedText) {', 'function shouldQueueRuntimeTranslation(language: string, sourceText: string, translatedText: string) {')

# 8. persistLanguage
content = re.sub(
    r'function persistLanguage\(language\) \{',
    r'function persistLanguage(language: string) {',
    content
)
content = re.sub(
    r'// @ts-expect-error - Auto-suppressed during migration\n\s+',
    '',
    content
)

content = content.replace('window[LANGUAGE_RUNTIME_KEY]', '(window as any)[LANGUAGE_RUNTIME_KEY]')

# 9. remaining param typings
content = content.replace('function syncLanguageQueryParam(language) {', 'function syncLanguageQueryParam(language: string) {')
content = content.replace('export function applyGlobalLanguage(nextLanguage) {', 'export function applyGlobalLanguage(nextLanguage: string) {')
content = content.replace('const setLanguage = (nextLanguage) => {', 'const setLanguage = (nextLanguage: string) => {')
content = content.replace('const syncLanguage = (event) => {', 'const syncLanguage = (event: Event) => {')
content = content.replace('const enqueueRuntimeTranslation = useCallback((sourceText) => {', 'const enqueueRuntimeTranslation = useCallback((sourceText: string) => {')

content = content.replace('const detail = event?.detail ?? readStoredLanguage();', 'const detail = (event as CustomEvent)?.detail ?? readStoredLanguage();')
content = content.replace('event?.detail ?? readStoredLanguage()', '(event as CustomEvent)?.detail ?? readStoredLanguage()')


# 10. context fallback
content = re.sub(
    r'export const LANGUAGE_CONTEXT_FALLBACK: LanguageContextType = \{\n  get language\(\) \{\n    return resolveActiveLanguage\(\);\n  \},\n  setLanguage: \(\) => \{\},\n  translateUiText: \(value: string\) => buildStaticLanguageApi\(resolveActiveLanguage\(\)\)\.translateUiText\(value\),\n  t: \(keyOrLanguage: string, maybeKey\?: string\) => buildStaticLanguageApi\(resolveActiveLanguage\(\)\)\.t\(keyOrLanguage, maybeKey\)\n\};',
    r'''export const LANGUAGE_CONTEXT_FALLBACK: LanguageContextType = {
  get language() {
    return resolveActiveLanguage();
  },
  setLanguage: () => {},
  translateUiText: (value: string | number) => buildStaticLanguageApi(resolveActiveLanguage()).translateUiText(value as string),
  t: (keyOrLanguage: string, maybeKey?: string) => buildStaticLanguageApi(resolveActiveLanguage()).t(keyOrLanguage, maybeKey)
};''',
    content
)

# 11. State hooks types
content = content.replace('useState(readStoredLanguage)', 'useState<string>(readStoredLanguage)')
content = content.replace('useState(readRuntimeTranslations)', 'useState<TranslationCache>(readRuntimeTranslations)')
content = content.replace('useState(0)', 'useState<number>(0)')
content = content.replace('useRef(new Set())', 'useRef<Set<string>>(new Set())')

content = content.replace('setLanguageState((current) => (current === nextLanguage ? current : nextLanguage));', 'setLanguageState((current: string) => (current === nextLanguage ? current : nextLanguage));')
content = content.replace('setTranslationQueueVersion((current) => current + 1);', 'setTranslationQueueVersion((current: number) => current + 1);')

content = content.replace('.filter((sourceText) => !inFlightTranslationsRef', '.filter((sourceText: string) => !inFlightTranslationsRef')
content = content.replace('batch.forEach((sourceText) => {', 'batch.forEach((sourceText: string) => {')
content = content.replace('batch.map(async (sourceText) => {', 'batch.map(async (sourceText: string) => {')

content = content.replace('setRuntimeTranslations((current) => {', 'setRuntimeTranslations((current: TranslationCache) => {')

content = re.sub(
    r'const successful = resolved\.filter\(Boolean\);',
    r'const successful = resolved.filter((r): r is [string, string] => Boolean(r));',
    content
)

content = content.replace('successful.forEach(([sourceText, translatedText]) => {', 'successful.forEach(([sourceText, translatedText]: [string, string]) => {')
content = content.replace('const nextLanguageTranslations = { ...((current)?.[activeLanguage] || {}) };', 'const nextLanguageTranslations = { ...(current[activeLanguage] || {}) };')

content = re.sub(
    r'export interface LanguageProviderProps \{\n  children\?: ReactNode;\n    \[key: string\]: ReturnType<typeof JSON\.parse>;\n\}',
    r'export interface LanguageProviderProps {\n  children?: ReactNode;\n}',
    content
)

content = content.replace('function readStoredLanguage() {', 'function readStoredLanguage(): string {')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
