// @refresh skip
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { translateText as requestTextTranslation } from "../services/telecareService";
import { labels, supportedLanguages, t as translate, translateDisplayText } from "../utils/i18n";
import { safeJsonParse } from "../utils/safeJson";

const LANGUAGE_STORAGE_KEY = "telecareplus-language";
export const LANGUAGE_CHANGED_EVENT = "telecareplus-language-changed";
const LANGUAGE_RUNTIME_KEY = "__telecareplusLanguage";
const RUNTIME_TRANSLATION_STORAGE_KEY = "telecareplus-runtime-ui-translations-v1";
const missingKeyWarnings = new Set();

function normalizeUiText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function looksLikeMojibake(value) {
  if (!value) {
    return false;
  }
  return value.includes("Ãƒ")
    || value.includes("Ã‚")
    || value.includes("Ã¢")
    || value.includes("ï¿½")
    || value.includes("Ã Â")
    || value.includes("à¤")
    || value.includes("à®")
    || value.includes("à´")
    || value.includes("à°")
    || value.includes("à¨");
}

function normalizeMojibake(value) {
  if (!looksLikeMojibake(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(String(value), (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes).trim();
  } catch {
    return value;
  }
}

function normalizeLanguage(value) {
  return supportedLanguages.some((item) => item.code === value) ? value : "en";
}

function readLanguageFromSearch(search) {
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
    Object.entries(parsed).forEach(([language, entries]) => {
      if (!entries || typeof entries !== "object") {
        return;
      }

      const nextEntries = {};
      Object.entries(entries).forEach(([key, value]) => {
        nextEntries[key] = normalizeMojibake(value);
      });
      normalized[language] = nextEntries;
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

function persistRuntimeTranslations(cache) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(RUNTIME_TRANSLATION_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage pressure; runtime translations still work for the current session.
  }
}

function getRuntimeTranslation(cache, language, sourceText) {
  const normalizedText = normalizeUiText(sourceText);
  if (!normalizedText) {
    return "";
  }

  return cache?.[language]?.[normalizedText] || "";
}

function shouldQueueRuntimeTranslation(language, sourceText, translatedText) {
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

function persistLanguage(language) {
  const normalizedLanguage = normalizeLanguage(language);

  if (typeof document !== "undefined") {
    document.documentElement.lang = normalizedLanguage;
    document.documentElement.dataset.language = normalizedLanguage;
    if (document.body) {
      document.body.dataset.language = normalizedLanguage;
    }
    const root = document.getElementById("root");
    if (root) {
      root.dataset.language = normalizedLanguage;
    }
  }

  if (typeof window !== "undefined") {
    try {
      window[LANGUAGE_RUNTIME_KEY] = normalizedLanguage;
    } catch {
      // Ignore runtime persistence failures.
    }
  }

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
  } catch {
    // Ignore storage failures; language still works for the current session.
  }

  try {
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

function syncLanguageQueryParam(language) {
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

export function applyGlobalLanguage(nextLanguage) {
  const normalizedLanguage = persistLanguage(nextLanguage);
  syncLanguageQueryParam(normalizedLanguage);
  return normalizedLanguage;
}

function buildStaticLanguageApi(language, setLanguage = () => {}) {
  const normalizedLanguage = normalizeLanguage(language);
  return {
    language: normalizedLanguage,
    setLanguage,
    translateUiText: (value) => {
      if (normalizedLanguage === "en") {
        return value;
      }
      return translateDisplayText(normalizedLanguage, value);
    },
    t: (keyOrLanguage, maybeKey) => {
      const key = typeof maybeKey === "string" ? maybeKey : keyOrLanguage;
      return translate(normalizedLanguage, key);
    }
  };
}

export const LANGUAGE_CONTEXT_FALLBACK = {
  get language() {
    return resolveActiveLanguage();
  },
  setLanguage: () => {},
  translateUiText: (value) => buildStaticLanguageApi(resolveActiveLanguage()).translateUiText(value),
  t: (keyOrLanguage, maybeKey) => buildStaticLanguageApi(resolveActiveLanguage()).t(keyOrLanguage, maybeKey)
};
const LanguageContext = createContext(LANGUAGE_CONTEXT_FALLBACK);

function readStoredLanguage() {
  if (typeof window !== "undefined") {
    const queryLanguage = readLanguageFromSearch(window.location?.search);
    if (queryLanguage) {
      return queryLanguage;
    }

    try {
      const runtimeLanguage = window[LANGUAGE_RUNTIME_KEY];
      if (runtimeLanguage) {
        return normalizeLanguage(runtimeLanguage);
      }
    } catch {
      // Ignore runtime lookup failures and continue to storage lookup.
    }
  }

  try {
    return normalizeLanguage(
      localStorage.getItem(LANGUAGE_STORAGE_KEY)
      || sessionStorage.getItem(LANGUAGE_STORAGE_KEY)
    );
  } catch {
    try {
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

export function LanguageProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguageState] = useState(readStoredLanguage);
  const [runtimeTranslations, setRuntimeTranslations] = useState(readRuntimeTranslations);
  const [translationQueueVersion, setTranslationQueueVersion] = useState(0);
  const pendingTranslationsRef = useRef(new Set());
  const inFlightTranslationsRef = useRef(new Set());
  const searchLanguage = useMemo(() => readLanguageFromSearch(location.search), [location.search]);
  const activeLanguage = language;

  const setLanguage = (nextLanguage) => {
    const normalizedLanguage = applyGlobalLanguage(nextLanguage);
    setLanguageState(normalizedLanguage);

    const params = new URLSearchParams(location.search);
    if (normalizedLanguage === "en") {
      params.delete("lang");
    } else {
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

    const syncLanguage = (event) => {
      const nextLanguage = normalizeLanguage(
        event?.detail ?? readStoredLanguage()
      );
      setLanguageState((current) => (current === nextLanguage ? current : nextLanguage));
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

  const enqueueRuntimeTranslation = useCallback((sourceText) => {
    const normalizedText = normalizeUiText(sourceText);
    if (!normalizedText) {
      return;
    }

    if (pendingTranslationsRef.current.has(normalizedText) || inFlightTranslationsRef.current.has(normalizedText)) {
      return;
    }

    pendingTranslationsRef.current.add(normalizedText);
    setTranslationQueueVersion((current) => current + 1);
  }, []);

  const translateUiText = useCallback((value) => {
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
          .filter((sourceText) => !inFlightTranslationsRef.current.has(sourceText) && !getRuntimeTranslation(runtimeTranslations, activeLanguage, sourceText))
          .slice(0, 6);

        if (!batch.length) {
          break;
        }

        batch.forEach((sourceText) => {
          pendingTranslationsRef.current.delete(sourceText);
          inFlightTranslationsRef.current.add(sourceText);
        });

        const resolved = await Promise.all(batch.map(async (sourceText) => {
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
          setRuntimeTranslations((current) => {
            const nextLanguageTranslations = { ...(current?.[activeLanguage] || {}) };
            successful.forEach(([sourceText, translatedText]) => {
              nextLanguageTranslations[sourceText] = translatedText;
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
    t: (keyOrLanguage, maybeKey) => {
      const key = typeof maybeKey === "string" ? maybeKey : keyOrLanguage;
      if (import.meta.env.DEV && !labels.en?.[key] && !missingKeyWarnings.has(key)) {
        missingKeyWarnings.add(key);
        console.warn(`[TeleCare+] Missing i18n key: ${key}`);
      }
      const englishText = labels.en?.[key] ?? key;
      const localizedText = labels[activeLanguage]?.[key] ?? englishText;
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
    return buildStaticLanguageApi(resolvedLanguage);
  }

  return context;
}
