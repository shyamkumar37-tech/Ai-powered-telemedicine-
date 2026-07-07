// @refresh skip
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translateText as requestTextTranslation } from "../services/telecareService";
import { translateDisplayText } from "../utils/i18n";
import { safeJsonParse } from "../utils/safeJson";

const TRANSLATION_CACHE_STORAGE_KEY = "telecareplus-free-text-translation-cache-v1";
const MAX_TRANSLATION_CACHE_ENTRIES = 400;
const translationCache = new Map();
const pendingTranslations = new Map();
let cacheLoaded = false;

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

function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length}-${(hash >>> 0).toString(36)}`;
}

function cacheKey(language, text) {
  return `${language}:${hashText(text)}`;
}

function loadCache() {
  if (cacheLoaded || typeof localStorage === "undefined") {
    return;
  }

  cacheLoaded = true;
  try {
    const raw = localStorage.getItem(TRANSLATION_CACHE_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const entries = safeJsonParse(raw);
    if (!Array.isArray(entries)) {
      localStorage.removeItem(TRANSLATION_CACHE_STORAGE_KEY);
      return;
    }

    entries.forEach((entry) => {
      if (!entry?.key || !entry?.source || !entry?.translated) {
        return;
      }
      translationCache.set(entry.key, {
        ...entry,
        translated: normalizeMojibake(entry.translated)
      });
    });
  } catch {
    localStorage.removeItem(TRANSLATION_CACHE_STORAGE_KEY);
  }
}

function persistCache() {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    const entries = Array.from(translationCache.values())
      .sort((left, right) => (right.cachedAt || 0) - (left.cachedAt || 0))
      .slice(0, MAX_TRANSLATION_CACHE_ENTRIES);
    localStorage.setItem(TRANSLATION_CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage pressure; translations still work for the current session.
  }
}

function readCachedTranslation(language, text) {
  loadCache();
  const entry = translationCache.get(cacheKey(language, text));
  if (!entry || entry.source !== text) {
    return null;
  }
  return normalizeMojibake(entry.translated);
}

function writeCachedTranslation(language, text, translated) {
  loadCache();
  translationCache.set(cacheKey(language, text), {
    key: cacheKey(language, text),
    source: text,
    translated: normalizeMojibake(translated),
    cachedAt: Date.now()
  });

  if (translationCache.size > MAX_TRANSLATION_CACHE_ENTRIES) {
    const oldestKey = Array.from(translationCache.entries())
      .sort((left, right) => (left[1].cachedAt || 0) - (right[1].cachedAt || 0))[0]?.[0];
    if (oldestKey) {
      translationCache.delete(oldestKey);
    }
  }

  persistCache();
}

function shouldTranslateRemotely(language, sourceText, minLength, forceTranslate) {
  if (!sourceText || language === "en") {
    return false;
  }

  const text = sourceText.trim();
  if (!text) {
    return false;
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) || /^(https?:|www\.)/i.test(text)) {
    return false;
  }

  if (forceTranslate) {
    return true;
  }

  if (/^[A-Z0-9_/-]+$/.test(text)) {
    return false;
  }

  if (text.length < minLength && !/[.!?;:]/.test(text)) {
    return false;
  }

  return /[\s,.!?;:|]/.test(text);
}

export function useLocalizedTextState(value, options = {}) {
  const { language } = useLanguage();
  const {
    minLength = 18,
    sourceLanguage = "auto",
    forceTranslate = false
  } = options;
  const sourceText = useMemo(() => {
    if (value === null || value === undefined) {
      return "";
    }
    return typeof value === "string" ? value : String(value);
  }, [value]);

  const fallbackText = useMemo(() => {
    const trimmed = sourceText.trim();
    return trimmed ? translateDisplayText(language, trimmed) : "";
  }, [language, sourceText]);

  const [state, setState] = useState(() => ({
    text: fallbackText,
    originalText: sourceText.trim(),
    translated: false,
    remote: false
  }));

  useEffect(() => {
    const trimmed = sourceText.trim();
    setState({
      text: fallbackText,
      originalText: trimmed,
      translated: Boolean(trimmed && fallbackText && fallbackText !== trimmed),
      remote: false
    });
  }, [fallbackText, sourceText]);

  useEffect(() => {
    const trimmed = sourceText.trim();
    if (!shouldTranslateRemotely(language, trimmed, minLength, forceTranslate)) {
      return undefined;
    }

    const cached = readCachedTranslation(language, trimmed);
    if (cached) {
      setState({
        text: cached,
        originalText: trimmed,
        translated: cached !== trimmed,
        remote: cached !== fallbackText
      });
      return undefined;
    }

    const key = cacheKey(language, trimmed);
    let cancelled = false;

    let pending = pendingTranslations.get(key);
    if (!pending) {
      pending = requestTextTranslation({
        text: trimmed,
        targetLanguage: language,
        sourceLanguage
      })
        .then((response) => {
          const translated = typeof response?.text === "string"
            ? normalizeMojibake(response.text.trim())
            : "";
          if (translated && translated !== trimmed) {
            writeCachedTranslation(language, trimmed, translated);
            return translated;
          }
          return fallbackText;
        })
        .catch(() => fallbackText)
        .finally(() => {
          if (pendingTranslations.get(key) === pending) {
            pendingTranslations.delete(key);
          }
        });
      pendingTranslations.set(key, pending);
    }

    pending.then((resolvedText) => {
      if (!cancelled && resolvedText) {
        setState({
          text: resolvedText,
          originalText: trimmed,
          translated: resolvedText !== trimmed,
          remote: resolvedText !== fallbackText
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fallbackText, language, minLength, sourceLanguage, sourceText, forceTranslate]);

  return state;
}

export function useLocalizedText(value, options = {}) {
  return useLocalizedTextState(value, options).text;
}

export default function LocalizedText({
  as: Component = "span",
  value,
  children,
  preserveOriginal = true,
  minLength,
  sourceLanguage,
  forceTranslate = false,
  ...rest
}) {
  const { language } = useLanguage();
  const sourceValue = value ?? (typeof children === "string" ? children : "");
  const { text, originalText, translated, remote } = useLocalizedTextState(sourceValue, {
    ...(minLength !== undefined ? { minLength } : {}),
    ...(sourceLanguage ? { sourceLanguage } : {}),
    forceTranslate
  });
  const componentProps = { ...rest };

  if (preserveOriginal && translated && originalText && !componentProps.title) {
    componentProps.title = originalText;
  }

  componentProps["data-localization-state"] = translated
    ? (remote ? "remote-translated" : "display-translated")
    : "original";
  if (translated && !componentProps.lang) {
    componentProps.lang = language;
  }

  return <Component {...componentProps}>{text}</Component>;
}
