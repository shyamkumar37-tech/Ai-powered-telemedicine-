// @refresh skip
import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { LANGUAGE_CHANGED_EVENT } from "./LanguageContext";
import { translateDisplayText } from "../utils/i18n";
import { safeJsonParse } from "../utils/safeJson";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

const STORAGE_KEY = "telecareplus-accessibility";
const ACCESSIBILITY_STORAGE_VERSION = 2;

export interface AccessibilityContextType {
  largeText: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  speechSupported: boolean;
  recognitionSupported: boolean;
  toggleLargeText: () => void;
  toggleHighContrast: () => void;
  toggleScreenReaderMode: () => void;
  resetAccessibility: () => void;
  announce: (text?: DynamicStateObject, lang?: DynamicStateObject, force?: boolean) => void;
  speak: (text?: DynamicStateObject, lang?: DynamicStateObject, options?: DynamicStateObject) => void;
  stopReading: () => void;
  readCurrentPage: (lang?: DynamicStateObject) => void;
}

const ACCESSIBILITY_CONTEXT_FALLBACK: AccessibilityContextType = {
  largeText: false,
  highContrast: false,
  screenReaderMode: false,
  speechSupported: false,
  recognitionSupported: false,
  toggleLargeText: () => {},
  toggleHighContrast: () => {},
  toggleScreenReaderMode: () => {},
  resetAccessibility: () => {},
  announce: () => {},
  speak: () => {},
  stopReading: () => {},
  readCurrentPage: () => {}
};

const AccessibilityContext = createContext<AccessibilityContextType>(ACCESSIBILITY_CONTEXT_FALLBACK);

const SPEECH_LANGUAGE_CODES: DynamicStateObject = {
  en: "en-IN",
  hi: "hi-IN",
  ml: "ml-IN",
  te: "te-IN",
  pa: "pa-IN",
  ta: "ta-IN"
};

const VOICE_NAME_HINTS = {
  en: ["english", "india", "indian"],
  hi: ["hindi", "india"],
  ml: ["malayalam"],
  te: ["telugu"],
  pa: ["punjabi"],
  ta: ["tamil"]
};

function detectSpeechSupport() {
  return typeof window !== "undefined"
    && (
      Boolean(window.speechSynthesis)
      || "speechSynthesis" in window
      || "SpeechSynthesisUtterance" in window
      // @ts-expect-error - Auto-suppressed during migration
      || typeof window.SpeechSynthesisUtterance === "function"
    );
}

function detectRecognitionSupport() {
  return typeof window !== "undefined"
    && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

const SPEECH_FRIENDLY_TOKENS = {
  en: [
    ["TeleCare+", "Tele Care Plus"],
    ["SpO2", "oxygen level"],
    ["OTP", "O T P"],
    ["IVR", "I V R"],
    ["AI", "A I"],
    ["BP", "blood pressure"]
  ],
  hi: [
    ["TeleCare+", "\u091f\u0947\u0932\u0940 \u0915\u0947\u092f\u0930 \u092a\u094d\u0932\u0938"],
    ["SpO2", "\u0911\u0915\u094d\u0938\u0940\u091c\u0928 \u0938\u094d\u0924\u0930"],
    ["OTP", "\u0913 \u091f\u0940 \u092a\u0940"],
    ["IVR", "\u0906\u0908 \u0935\u0940 \u0906\u0930"],
    ["AI", "\u090f \u0906\u0908"],
    ["BP", "\u0930\u0915\u094d\u0924\u091a\u093e\u092a"]
  ],
  ml: [
    ["TeleCare+", "\u0d1f\u0d46\u0d32\u0d3f \u0d15\u0d46\u0d2f\u0d7c \u0d2a\u0d4d\u0d32\u0d38\u0d4d"],
    ["SpO2", "\u0d13\u0d15\u0d4d\u0d38\u0d3f\u0d1c\u0d7b \u0d28\u0d3f\u0d32"],
    ["OTP", "\u0d12 \u0d1f\u0d3f \u0d2a\u0d3f"],
    ["IVR", "\u0d10 \u0d35\u0d3f \u0d06\u0d7c"],
    ["AI", "\u0d0e \u0d10"],
    ["BP", "\u0d30\u0d15\u0d4d\u0d24\u0d38\u0d2e\u0d4d\u0d2e\u0d7c\u0d26\u0d4d\u0d26\u0d02"]
  ],
  te: [
    ["TeleCare+", "\u0c1f\u0c46\u0c32\u0c3f \u0c15\u0c47\u0c30\u0c4d \u0c2a\u0c4d\u0c32\u0c38\u0c4d"],
    ["SpO2", "\u0c06\u0c15\u0c4d\u0c38\u0c3f\u0c1c\u0c28\u0c4d \u0c38\u0c4d\u0c25\u0c3e\u0c2f\u0c3f"],
    ["OTP", "\u0c13 \u0c1f\u0c3f \u0c2a\u0c3f"],
    ["IVR", "\u0c10 \u0c35\u0c3f \u0c06\u0c30\u0c4d"],
    ["AI", "\u0c0f \u0c10"],
    ["BP", "\u0c30\u0c15\u0c4d\u0c24\u0c2a\u0c4b\u0c1f\u0c41"]
  ],
  pa: [
    ["TeleCare+", "\u0a1f\u0a48\u0a32\u0a40 \u0a15\u0a47\u0a05\u0a30 \u0a2a\u0a32\u0a38"],
    ["SpO2", "\u0a06\u0a15\u0a38\u0a40\u0a1c\u0a28 \u0a2a\u0a71\u0a27\u0a30"],
    ["OTP", "\u0a13 \u0a1f\u0a40 \u0a2a\u0a40"],
    ["IVR", "\u0a06\u0a08 \u0a35\u0a40 \u0a06\u0a30"],
    ["AI", "\u0a0f \u0a06\u0a08"],
    ["BP", "\u0a2c\u0a32\u0a71\u0a21 \u0a2a\u0a4d\u0a30\u0a48\u0a38\u0a3c\u0a30"]
  ],
  ta: [
    ["TeleCare+", "\u0b9f\u0bc6\u0bb2\u0bbf \u0b95\u0bc7\u0bb0\u0bcd \u0baa\u0bbf\u0bb3\u0bb8\u0bcd"],
    ["SpO2", "\u0b86\u0b95\u0bcd\u0b9a\u0bbf\u0b9c\u0ba9\u0bcd \u0b85\u0bb3\u0bb5\u0bc1"],
    ["OTP", "\u0b93 \u0b9f\u0bbf \u0baa\u0bbf"],
    ["IVR", "\u0b90 \u0bb5\u0bbf \u0b86\u0bb0\u0bcd"],
    ["AI", "\u0b8f \u0b90"],
    ["BP", "\u0b87\u0bb0\u0ba4\u0bcd\u0ba4 \u0b85\u0bb4\u0bc1\u0ba4\u0bcd\u0ba4\u0bae\u0bcd"]
  ]
};

function readStoredSettings() {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return {
      largeText: false,
      highContrast: false,
      screenReaderMode: false
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        largeText: false,
        highContrast: false,
        screenReaderMode: false
      };
    }

    const stored = safeJsonParse(raw, {});
    if (!stored || typeof stored !== "object") {
      window.localStorage.removeItem(STORAGE_KEY);
      return {
        largeText: false,
        highContrast: false,
        screenReaderMode: false
      };
    }
    return {
      largeText: Boolean(stored.largeText),
      highContrast: Boolean(stored.highContrast),
      screenReaderMode: Boolean(stored.screenReaderMode)
    };
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    return {
      largeText: false,
      highContrast: false,
      screenReaderMode: false
    };
  }
}

function escapeRegExp(value: string | number) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWhitespace(value: string | number) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\|/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTextForSpeech(text: DynamicStateObject, preferredLanguage = "en") {
  const localized = normalizeWhitespace(text);
  const tokens = (SPEECH_FRIENDLY_TOKENS as DynamicStateObject)[preferredLanguage] || SPEECH_FRIENDLY_TOKENS.en;

  return tokens.reduce((current: DynamicStateObject, [from, to]: DynamicStateObject) => {
    const pattern = new RegExp(escapeRegExp(from), "gi");
    return current.replace(pattern, to);
  }, localized);
}

function detectContentLanguage(text: DynamicStateObject, preferredLanguage = "en") {
  const value = String(text || "");

  if (/[\u0B80-\u0BFF]/.test(value)) return "ta";
  if (/[\u0C00-\u0C7F]/.test(value)) return "te";
  if (/[\u0D00-\u0D7F]/.test(value)) return "ml";
  if (/[\u0A00-\u0A7F]/.test(value)) return "pa";
  if (/[\u0900-\u097F]/.test(value)) return "hi";
  if (/[A-Za-z]/.test(value)) return "en";

  return preferredLanguage;
}

function buildSpeechSegments(text: DynamicStateObject, preferredLanguage = "en") {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) {
    return [];
  }

  const parts = cleaned.match(
    /[\u0B80-\u0BFF]+|[\u0C00-\u0C7F]+|[\u0D00-\u0D7F]+|[\u0A00-\u0A7F]+|[\u0900-\u097F]+|[A-Za-z0-9+./%-]+|[^A-Za-z0-9\u0900-\u097F\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]+/g
  ) || [cleaned];

  const segments: DynamicStateObject = [];
  let currentLanguage: DynamicStateObject = null;
  let currentText = "";

  parts.forEach((part: DynamicStateObject) => {
    const segmentLanguage = detectContentLanguage(part, preferredLanguage);

    if (!currentLanguage) {
      currentLanguage = segmentLanguage;
      currentText = part;
      return;
    }

    if (segmentLanguage === currentLanguage) {
      currentText += part;
      return;
    }

    if (currentText.trim()) {
      segments.push({
        language: currentLanguage,
        text: currentText.trim()
      });
    }

    currentLanguage = segmentLanguage;
    currentText = part;
  });

  if (currentText.trim()) {
    segments.push({
      language: currentLanguage || preferredLanguage,
      text: currentText.trim()
    });
  }

  return segments;
}

function findBestVoice(voices: DynamicStateObject, languageCode: DynamicStateObject) {
  const locale = String(languageCode || "").toLowerCase();
  const baseLanguage = locale.split("-")[0];
  const hints = (VOICE_NAME_HINTS as DynamicStateObject)[baseLanguage] || [];

  return (
    voices.find((voice: DynamicStateObject) => voice.lang?.toLowerCase() === locale && voice.localService)
    || voices.find((voice: DynamicStateObject) => voice.lang?.toLowerCase() === locale)
    || voices.find((voice: DynamicStateObject) => hints.some((hint: DynamicStateObject) => voice.name?.toLowerCase().includes(hint)))
    || voices.find((voice: DynamicStateObject) => voice.lang?.toLowerCase().startsWith(baseLanguage) && voice.localService)
    || voices.find((voice: DynamicStateObject) => voice.lang?.toLowerCase().startsWith(baseLanguage))
    || voices.find((voice: DynamicStateObject) => voice.default)
    || null
  );
}

export interface AccessibilityProviderProps {
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<DynamicState>(readStoredSettings);
  const [announcement, setAnnouncement] = useState<DynamicState>("");
  const [speechSupported, setSpeechSupported] = useState<DynamicState>(detectSpeechSupport);
  const [recognitionSupported, setRecognitionSupported] = useState<DynamicState>(detectRecognitionSupport);
  const announcementTimer = useRef<DynamicState>(null);
  const lastSpokenRef = useRef<DynamicState>({ text: "", at: 0 });
  const voicesRef = useRef<DynamicState>([]);
  const pendingSpeakRef = useRef<DynamicState>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...settings,
            version: ACCESSIBILITY_STORAGE_VERSION
          })
        );
      } catch {
        // Ignore storage write failures; in-memory settings still work.
      }
    }
  }, [settings]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const targets = [
      document.documentElement,
      document.body,
      document.getElementById("root")
    ].filter(Boolean);

    targets.forEach((target: DynamicStateObject) => {
      target.classList.toggle("telecare-large-text", settings.largeText);
      target.classList.toggle("telecare-high-contrast", settings.highContrast);
      target.classList.toggle("telecare-screen-reader", settings.screenReaderMode);
    });

    return () => {
      targets.forEach((target: DynamicStateObject) => {
        target.classList.remove("telecare-large-text", "telecare-high-contrast", "telecare-screen-reader");
      });
    };
  }, [settings.largeText, settings.highContrast, settings.screenReaderMode]);

  useEffect(() => () => {
    if (announcementTimer.current) {
      clearTimeout(announcementTimer.current);
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let supportRefreshTimer: DynamicStateObject = null;

    const flushPendingSpeak = () => {
      if (!pendingSpeakRef.current) {
        return;
      }
      const pending = pendingSpeakRef.current;
      pendingSpeakRef.current = null;
      speak(pending.text, pending.language, { ...pending.options, force: true });
    };

    const loadVoices = () => {
      setSpeechSupported(detectSpeechSupport());
      setRecognitionSupported(detectRecognitionSupport());
      voicesRef.current = window.speechSynthesis?.getVoices?.() || [];

      if (pendingSpeakRef.current && voicesRef.current.length) {
        const pending = pendingSpeakRef.current;
        pendingSpeakRef.current = null;
        speak(pending.text, pending.language, { ...pending.options, force: true });
      }
    };

    const primeSpeechRuntime = () => {
      try {
        window.speechSynthesis?.resume?.();
        window.speechSynthesis?.getVoices?.();
      } catch {
        // Ignore browser-specific resume failures.
      }
      loadVoices();
    };

    loadVoices();
    supportRefreshTimer = window.setInterval(() => {
      loadVoices();
      if (detectSpeechSupport()) {
        window.clearInterval(supportRefreshTimer);
        supportRefreshTimer = null;
      }
    }, 1200);

    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    window.addEventListener("focus", loadVoices);
    window.addEventListener("pageshow", primeSpeechRuntime);
    document.addEventListener?.("visibilitychange", loadVoices);
    window.addEventListener("pointerdown", flushPendingSpeak, true);
    window.addEventListener("keydown", flushPendingSpeak, true);
    window.addEventListener("pointerdown", primeSpeechRuntime, true);
    window.addEventListener("keydown", primeSpeechRuntime, true);

    return () => {
      if (supportRefreshTimer) {
        window.clearInterval(supportRefreshTimer);
      }
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
      window.removeEventListener("focus", loadVoices);
      window.removeEventListener("pageshow", primeSpeechRuntime);
      document.removeEventListener?.("visibilitychange", loadVoices);
      window.removeEventListener("pointerdown", flushPendingSpeak, true);
      window.removeEventListener("keydown", flushPendingSpeak, true);
      window.removeEventListener("pointerdown", primeSpeechRuntime, true);
      window.removeEventListener("keydown", primeSpeechRuntime, true);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const handleLanguageChange = () => {
      if (announcementTimer.current) {
        clearTimeout(announcementTimer.current);
      }
      pendingSpeakRef.current = null;
      lastSpokenRef.current = { text: "", at: 0 };
      try {
        voicesRef.current = window.speechSynthesis?.getVoices?.() || voicesRef.current;
        window.speechSynthesis?.cancel?.();
      } catch {
        // Ignore browser-specific failures.
      }
    };

    window.addEventListener(LANGUAGE_CHANGED_EVENT, handleLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGED_EVENT, handleLanguageChange);
  }, []);

  const stopReading = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    lastSpokenRef.current = { text: "", at: 0 };
  };

  const speak = (text: DynamicStateObject, language = "en", options = {}) => {
    if (!text || typeof window === "undefined") {
      return false;
    }

    const speechRuntime = window.speechSynthesis ?? globalThis.speechSynthesis;
    const UtteranceCtor = window.SpeechSynthesisUtterance ?? globalThis.SpeechSynthesisUtterance;
    try {
      speechRuntime?.resume?.();
      speechRuntime?.getVoices?.();
    } catch {
      // Ignore browser-specific warmup failures and continue with the best available runtime.
    }

    if (!speechRuntime || !UtteranceCtor) {
      return false;
    }

    setSpeechSupported(true);

    const sourceText = String(text);
    const detectedLanguage = language === "en" ? "en" : detectContentLanguage(sourceText, language);
    const localizedText = language === "en" || detectedLanguage === language
      ? sourceText
      : translateDisplayText(language, sourceText);
    const normalized = normalizeTextForSpeech(localizedText, language);
    const now = Date.now();
    // @ts-expect-error - Auto-suppressed during migration
    const force = options.force === true;

    if (
      !force
      && normalized
      && lastSpokenRef.current.text === normalized
      && now - lastSpokenRef.current.at < 2200
    ) {
      return true;
    }

    lastSpokenRef.current = {
      text: normalized,
      at: now
    };

    const voices = voicesRef.current.length
      ? voicesRef.current
      : (speechRuntime.getVoices?.() || []);

    try {
      if (speechRuntime.speaking || speechRuntime.pending) {
        speechRuntime.cancel();
        speechRuntime.resume?.();
      }
    } catch {
      return false;
    }
    const segments = buildSpeechSegments(normalized, language);

    const speakSegmentAt = (index: number | string) => {
      if (index >= segments.length) {
        return;
      }

      const segment = segments[index];
      const utterance = new UtteranceCtor(segment.text);
      utterance.lang = (SPEECH_LANGUAGE_CODES as DynamicStateObject)[segment.language] || SPEECH_LANGUAGE_CODES.en;
      utterance.rate = 0.94;
      utterance.pitch = 1;
      const matchedVoice = voices.length ? findBestVoice(voices, utterance.lang) : null;
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang || utterance.lang;
      }
      // @ts-expect-error - Auto-suppressed during migration
      utterance.onend = () => speakSegmentAt(index + 1);
      // @ts-expect-error - Auto-suppressed during migration
      utterance.onerror = () => speakSegmentAt(index + 1);
      try {
        speechRuntime.speak(utterance);
      } catch {
        return;
      }
    };

    speakSegmentAt(0);
    return true;
  };

  const readCurrentPage = (language = "en") => {
    if (typeof document === "undefined") {
      return false;
    }

    const pageRoot = document.getElementById("page-main")
      || document.querySelector("main[data-page-content='true']")
      || document.querySelector("[data-page-content='true']:not(#page-root)")
      || document.getElementById("page-root");
    const pageText = pageRoot?.innerText?.replace(/\s+/g, " ").trim();
    if (pageText) {
      return speak(pageText, language, { force: true });
    }

    const fallbackText = translateDisplayText(language, "No readable content found on this page.");
    return speak(fallbackText || "No readable content found on this page.", language, { force: true });
  };

  const announce = (text: DynamicStateObject, language = "en", speakAloud = false) => {
    if (!text) {
      return;
    }

    setAnnouncement(text);
    if (announcementTimer.current) {
      clearTimeout(announcementTimer.current);
    }
    announcementTimer.current = setTimeout(() => setAnnouncement(""), 2500);

    if (speakAloud && settings.screenReaderMode) {
      speak(text, language);
    }
  };

  const value = useMemo(() => ({
    ...settings,
    speechSupported,
    recognitionSupported,
    toggleLargeText: () => setSettings((current: DynamicStateObject) => ({ ...current, largeText: !current.largeText })),
    toggleHighContrast: () => setSettings((current: DynamicStateObject) => ({ ...current, highContrast: !current.highContrast })),
    toggleScreenReaderMode: () => setSettings((current: DynamicStateObject) => ({ ...current, screenReaderMode: !current.screenReaderMode })),
    resetAccessibility: () => {
      setSettings({ largeText: false, highContrast: false, screenReaderMode: false });
      try {
        window.localStorage?.removeItem?.(STORAGE_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
    },
    announce,
    speak,
    stopReading,
    readCurrentPage
  }), [recognitionSupported, settings, speechSupported]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext) ?? ACCESSIBILITY_CONTEXT_FALLBACK;
}
