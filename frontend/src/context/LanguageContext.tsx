// @refresh skip
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { translateText as requestTextTranslation } from "../services/telecareService";
import { labels, supportedLanguages, t as translate, translateDisplayText } from "../utils/i18n";
import { safeJsonParse } from "../utils/safeJson";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

const LANGUAGE_STORAGE_KEY = "telecareplus-language";
export const LANGUAGE_CHANGED_EVENT = "telecareplus-language-changed";
const LANGUAGE_RUNTIME_KEY = "__telecareplusLanguage";
const RUNTIME_TRANSLATION_STORAGE_KEY = "telecareplus-runtime-ui-translations-v1";
const missingKeyWarnings = new Set();

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translateUiText: (value: string) => string;
  t: (keyOrLanguage: string, maybeKey?: string) => string;
}

function normalizeUiText(value: any) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function looksLikeMojibake(value: string | number) {
  if (!value) {
    return false;
  }
  // @ts-expect-error - Auto-suppressed during migration
  return value.includes("Ãƒ")
    // @ts-expect-error - Auto-suppressed during migration
    || value.includes("Ã‚")
    // @ts-expect-error - Auto-suppressed during migration
    || value.includes("Ã¢")
    // @ts-expect-error - Auto-suppressed during migration
    || value.includes("ï¿½")
    // @ts-expect-error - Auto-suppressed during migration
    || value.includes("Ã Â")
    // @ts-expect-error - Auto-suppressed during migration
    || value.includes("à¤")
    // @ts-expect-error - Auto-suppressed during migration
    || value.includes("à®")
    // @ts-expect-error - Auto-suppressed during migration
    || value.includes("à´")
    // @ts-expect-error - Auto-suppressed during migration
    || value.includes("à°")
    // @ts-expect-error - Auto-suppressed during migration
    || value.includes("à¨");
}

function normalizeMojibake(value: string | number) {
  if (!looksLikeMojibake(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(String(value), (char: DynamicStateObject) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes).trim();
  } catch {
    return value;
  }
}

function normalizeLanguage(value: string | number) {
  return supportedLanguages.some((item: DynamicStateObject) => item.code === value) ? value : "en";
}

function readLanguageFromSearch(search: DynamicStateObject) {
  try {
    const params = new URLSearchParams(search || "");
    const nextLanguage = params.get("lang");
    return nextLanguage ? normalizeLanguage(nextLanguage) : null;
  } catch {
    return null;
  }
}

function readRuntimeTranslations() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(RUNTIME_TRANSLATION_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== "object") {
      localStorage.removeItem(RUNTIME_TRANSLATION_STORAGE_KEY);
      return {};
    }

    const normalized = {};
    Object.entries(parsed).forEach(([language, entries]: DynamicStateObject) => {
      if (!entries || typeof entries !== "object") {
        return;
      }

      const nextEntries = {};
      Object.entries(entries).forEach(([key, value]: DynamicStateObject) => {
        (nextEntries as DynamicStateObject)[key] = normalizeMojibake(value);
      });
      (normalized as DynamicStateObject)[language] = nextEntries;
    });

    return normalized;
  } catch {
    try {
      localStorage.removeItem(RUNTIME_TRANSLATION_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    return {};
  }
}

function persistRuntimeTranslations(cache: DynamicStateObject) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(RUNTIME_TRANSLATION_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage pressure; runtime translations still work for the current session.
  }
}

function getRuntimeTranslation(cache: DynamicStateObject, language: DynamicStateObject, sourceText: DynamicStateObject) {
  const normalizedText = normalizeUiText(sourceText);
  if (!normalizedText) {
    return "";
  }

  return ((cache as DynamicStateObject)?.[language] as DynamicStateObject)?.[normalizedText] || "";
}

function shouldQueueRuntimeTranslation(language: DynamicStateObject, sourceText: DynamicStateObject, translatedText: DynamicStateObject) {
  if (language === "en") {
    return false;
  }

  const normalizedSource = normalizeUiText(sourceText);
  const normalizedTranslated = normalizeUiText(translatedText);
  if (!normalizedSource || normalizedTranslated !== normalizedSource) {
    return false;
  }

  if (normalizedSource.length > 96) {
    return false;
  }

  if (!/[A-Za-z]/.test(normalizedSource)) {
    return false;
  }

  if (/^[A-Z0-9_/-]+$/.test(normalizedSource)) {
    return false;
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedSource) || /^(https?:|www\.)/i.test(normalizedSource)) {
    return false;
  }

  return true;
}

function persistLanguage(language: DynamicStateObject) {
  const normalizedLanguage = normalizeLanguage(language);

  if (typeof document !== "undefined") {
    // @ts-expect-error - Auto-suppressed during migration
    document.documentElement.lang = normalizedLanguage;
    // @ts-expect-error - Auto-suppressed during migration
    document.documentElement.dataset.language = normalizedLanguage;
    if (document.body) {
      // @ts-expect-error - Auto-suppressed during migration
      document.body.dataset.language = normalizedLanguage;
    }
    const root = document.getElementById("root");
    if (root) {
      // @ts-expect-error - Auto-suppressed during migration
      root.dataset.language = normalizedLanguage;
    }
  }

  if (typeof window !== "undefined") {
    try {
      (window as DynamicStateObject)[LANGUAGE_RUNTIME_KEY] = normalizedLanguage;
    } catch {
      // Ignore runtime persistence failures.
    }
  }

  try {
    // @ts-expect-error - Auto-suppressed during migration
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
  } catch {
    // Ignore storage failures; language still works for the current session.
  }

  try {
    // @ts-expect-error - Auto-suppressed during migration
    sessionStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
  } catch {
    // Ignore session storage failures; language still works for the current session.
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGED_EVENT, {
      detail: normalizedLanguage
    }));
  }

  return normalizedLanguage;
}

function syncLanguageQueryParam(language: DynamicStateObject) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const url = new URL(window.location.href);
    const currentQueryLanguage = url.searchParams.get("lang");

    if (language === "en") {
      if (currentQueryLanguage) {
        url.searchParams.delete("lang");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
      return;
    }

    if (currentQueryLanguage !== language) {
      url.searchParams.set("lang", language);
      window.history.replaceState(window.history.state, "", url.toString());
    }
  } catch {
    // Ignore history update failures; storage-backed language still works.
  }
}

export function applyGlobalLanguage(nextLanguage: DynamicStateObject) {
  const normalizedLanguage = persistLanguage(nextLanguage);
  syncLanguageQueryParam(normalizedLanguage);
  return normalizedLanguage;
}

function buildStaticLanguageApi(language: string, setLanguage: (lang: string) => void = () => {}): LanguageContextType {
  const normalizedLanguage = normalizeLanguage(language);
  return {
    // @ts-expect-error - Auto-suppressed during migration
    language: normalizedLanguage,
    setLanguage,
    translateUiText: (value: string | number) => {
      if (normalizedLanguage === "en") {
        return value;
      }
      return translateDisplayText(normalizedLanguage, value);
    },
    t: (keyOrLanguage: string, maybeKey?: string) => {
      const key = typeof maybeKey === "string" ? maybeKey : keyOrLanguage;
      return translate(normalizedLanguage, key);
    }
  };
}

export const LANGUAGE_CONTEXT_FALLBACK: LanguageContextType = {
  // @ts-expect-error - Auto-suppressed during migration
  get language() {
    return resolveActiveLanguage();
  },
  setLanguage: () => {},
  // @ts-expect-error - Auto-suppressed during migration
  translateUiText: (value: string) => buildStaticLanguageApi(resolveActiveLanguage()).translateUiText(value),
  // @ts-expect-error - Auto-suppressed during migration
  t: (keyOrLanguage: string, maybeKey?: string) => buildStaticLanguageApi(resolveActiveLanguage()).t(keyOrLanguage, maybeKey)
};
const LanguageContext = createContext<LanguageContextType>(LANGUAGE_CONTEXT_FALLBACK);

function readStoredLanguage() {
  if (typeof window !== "undefined") {
    const queryLanguage = readLanguageFromSearch(window.location?.search);
    if (queryLanguage) {
      return queryLanguage;
    }

    try {
      const runtimeLanguage = (window as DynamicStateObject)[LANGUAGE_RUNTIME_KEY];
      if (runtimeLanguage) {
        return normalizeLanguage(runtimeLanguage);
      }
    } catch {
      // Ignore runtime lookup failures and continue to storage lookup.
    }
  }

  try {
    return normalizeLanguage(
      // @ts-expect-error - Auto-suppressed during migration
      localStorage.getItem(LANGUAGE_STORAGE_KEY)
      || sessionStorage.getItem(LANGUAGE_STORAGE_KEY)
    );
  } catch {
    try {
      // @ts-expect-error - Auto-suppressed during migration
      return normalizeLanguage(sessionStorage.getItem(LANGUAGE_STORAGE_KEY));
    } catch {
      if (typeof document !== "undefined" && document.documentElement?.lang) {
        return normalizeLanguage(document.documentElement.lang);
      }
      return "en";
    }
  }
}

export function resolveActiveLanguage() {
  return readStoredLanguage();
}

export interface LanguageProviderProps {
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguageState] = useState<DynamicState>(readStoredLanguage);
  const [runtimeTranslations, setRuntimeTranslations] = useState<DynamicState>(readRuntimeTranslations);
  const [translationQueueVersion, setTranslationQueueVersion] = useState<DynamicState>(0);
  const pendingTranslationsRef = useRef<DynamicState>(new Set());
  const inFlightTranslationsRef = useRef<DynamicState>(new Set());
  const searchLanguage = useMemo(() => readLanguageFromSearch(location.search), [location.search]);
  const activeLanguage = language;

  const setLanguage = (nextLanguage: DynamicStateObject) => {
    const normalizedLanguage = applyGlobalLanguage(nextLanguage);
    setLanguageState(normalizedLanguage);

    const params = new URLSearchParams(location.search);
    if (normalizedLanguage === "en") {
      params.delete("lang");
    } else {
      // @ts-expect-error - Auto-suppressed during migration
      params.set("lang", normalizedLanguage);
    }

    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
        hash: location.hash
      },
      { replace: true }
    );
  };

  useEffect(() => {
    persistLanguage(activeLanguage);
    syncLanguageQueryParam(activeLanguage);
  }, [activeLanguage]);

  useEffect(() => {
    if (!searchLanguage || searchLanguage === activeLanguage) {
      return;
    }

    const normalized = normalizeLanguage(searchLanguage);
    if (normalized !== activeLanguage) {
      persistLanguage(normalized);
      setLanguageState(normalized);
    }
  }, [activeLanguage, searchLanguage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const syncLanguage = (event: DynamicStateObject) => {
      const nextLanguage = normalizeLanguage(
        event?.detail ?? readStoredLanguage()
      );
      setLanguageState((current: DynamicStateObject) => (current === nextLanguage ? current : nextLanguage));
    };

    window.addEventListener("storage", syncLanguage);
    window.addEventListener(LANGUAGE_CHANGED_EVENT, syncLanguage);
    window.addEventListener("popstate", syncLanguage);
    window.addEventListener("pageshow", syncLanguage);
    window.addEventListener("focus", syncLanguage);

    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener(LANGUAGE_CHANGED_EVENT, syncLanguage);
      window.removeEventListener("popstate", syncLanguage);
      window.removeEventListener("pageshow", syncLanguage);
      window.removeEventListener("focus", syncLanguage);
    };
  }, []);

  useEffect(() => {
    persistRuntimeTranslations(runtimeTranslations);
  }, [runtimeTranslations]);

  const enqueueRuntimeTranslation = useCallback((sourceText: DynamicStateObject) => {
    const normalizedText = normalizeUiText(sourceText);
    if (!normalizedText) {
      return;
    }

    if (pendingTranslationsRef.current.has(normalizedText) || inFlightTranslationsRef.current.has(normalizedText)) {
      return;
    }

    pendingTranslationsRef.current.add(normalizedText);
    setTranslationQueueVersion((current: DynamicStateObject) => current + 1);
  }, []);

  const translateUiText = useCallback((value: string | number) => {
    const normalizedValue = normalizeUiText(value);
    if (!normalizedValue || activeLanguage === "en") {
      return value;
    }

    const runtimeTranslation = getRuntimeTranslation(runtimeTranslations, activeLanguage, normalizedValue);
    if (runtimeTranslation) {
      return runtimeTranslation;
    }

    const staticTranslation = translateDisplayText(activeLanguage, normalizedValue);
    if (shouldQueueRuntimeTranslation(activeLanguage, normalizedValue, staticTranslation)) {
      enqueueRuntimeTranslation(normalizedValue);
    }

    return staticTranslation;
  }, [activeLanguage, enqueueRuntimeTranslation, runtimeTranslations]);

  useEffect(() => {
    if (activeLanguage === "en") {
      return undefined;
    }

    let cancelled = false;

    const flushPendingTranslations = async () => {
      while (!cancelled) {
        const batch = Array.from(pendingTranslationsRef.current)
          .filter((sourceText: DynamicStateObject) => !inFlightTranslationsRef.current.has(sourceText) && !getRuntimeTranslation(runtimeTranslations, activeLanguage, sourceText))
          .slice(0, 6);

        if (!batch.length) {
          break;
        }

        batch.forEach((sourceText: DynamicStateObject) => {
          pendingTranslationsRef.current.delete(sourceText);
          inFlightTranslationsRef.current.add(sourceText);
        });

        const resolved = await Promise.all(batch.map(async (sourceText: DynamicStateObject) => {
          try {
            const response = await requestTextTranslation({
              text: sourceText,
              targetLanguage: activeLanguage,
              sourceLanguage: "en"
            });

            const translatedText = normalizeUiText(normalizeMojibake(response?.text));
            return translatedText && translatedText !== sourceText
              ? [sourceText, translatedText]
              : null;
          } catch {
            return null;
          } finally {
            inFlightTranslationsRef.current.delete(sourceText);
          }
        }));

        if (cancelled) {
          return;
        }

        const successful = resolved.filter(Boolean);
        if (successful.length) {
          setRuntimeTranslations((current: DynamicStateObject) => {
            const nextLanguageTranslations = { ...((current as DynamicStateObject)?.[activeLanguage] || {}) };
            successful.forEach(([sourceText, translatedText]: DynamicStateObject) => {
              (nextLanguageTranslations as DynamicStateObject)[sourceText] = translatedText;
            });
            return {
              ...current,
              [activeLanguage]: nextLanguageTranslations
            };
          });
        }
      }
    };

    flushPendingTranslations();

    return () => {
      cancelled = true;
    };
  }, [activeLanguage, runtimeTranslations, translationQueueVersion]);

  const value = useMemo(() => ({
    language: activeLanguage,
    setLanguage,
    translateUiText,
    t: (keyOrLanguage: string, maybeKey?: string) => {
      const key = typeof maybeKey === "string" ? maybeKey : keyOrLanguage;
      if (import.meta.env.DEV && !(labels.en as DynamicStateObject)?.[key] && !missingKeyWarnings.has(key)) {
        missingKeyWarnings.add(key);
        console.warn(`[TeleCare+] Missing i18n key: ${key}`);
      }
      const englishText = (labels.en as DynamicStateObject)?.[key] ?? key;
      const localizedText = ((labels as DynamicStateObject)[activeLanguage] as DynamicStateObject)?.[key] ?? englishText;
      const runtimeTranslation = getRuntimeTranslation(runtimeTranslations, activeLanguage, englishText);
      if (runtimeTranslation) {
        return runtimeTranslation;
      }

      const staticTranslation = activeLanguage === "en"
        ? localizedText
        : translateDisplayText(activeLanguage, localizedText);

      if (shouldQueueRuntimeTranslation(activeLanguage, englishText, staticTranslation)) {
        enqueueRuntimeTranslation(englishText);
      }

      return staticTranslation;
    }
  }), [activeLanguage, enqueueRuntimeTranslation, runtimeTranslations, translateUiText]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  const resolvedLanguage = resolveActiveLanguage();

  if (!context || context === LANGUAGE_CONTEXT_FALLBACK) {
    // @ts-expect-error - Auto-suppressed during migration
    return buildStaticLanguageApi(resolvedLanguage);
  }

  return context;
}
