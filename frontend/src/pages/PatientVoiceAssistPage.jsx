import { useEffect, useMemo, useRef, useState } from "react";
import LocalizedText, { useLocalizedText } from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAccessibility } from "../context/AccessibilityContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchAdaptiveTriage, fetchCopilotRecommendations } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

const SUPPORT_COPY_BASE = {
  browserReadiness: "Browser voice readiness",
  speechPlayback: "Speech playback",
  voiceCapture: "Voice capture",
  enableMicrophone: "Enable microphone",
  enablingMicrophone: "Enabling microphone...",
  microphoneReady: "Microphone access is ready. You can start listening now.",
  microphoneUnavailable: "This browser cannot request microphone access from the page.",
  microphoneBlockedGuidance: "Open your browser site settings for this page and allow microphone access, then try again.",
  ready: "Ready",
  limited: "Limited",
  permissionRequired: "Permission required",
  fallbackTitle: "Fallback guidance",
  fallbackBody: "If listening is unavailable, use the Accessibility toolbar to read the page aloud and continue with keyboard shortcuts.",
  activeLocale: "Active voice locale",
  loadingGuidance: "Loading voice guidance...",
  permissionDenied: "Microphone permission was denied. You can still use the Accessibility tools to read the page aloud.",
  permissionRequiredNotice: "Voice capture needs microphone permission from the browser before it can start.",
  localeVoiceFallback: "A matching voice pack for the selected language was not found, so the browser may use a fallback voice.",
  noSpeechDetected: "No speech was detected. Try again and speak clearly after listening starts.",
  recognitionUnavailable: "Voice capture is not available in this browser right now.",
  recognitionFailed: "Voice capture could not start or continue. Please try again.",
  recognitionNetworkFailed: "Voice capture is unavailable because the browser could not reach its speech service.",
  guidanceUnavailable: "Voice guidance is not available yet. Load patient guidance first, then try again."
};

const RECOGNITION_LOCALE = {
  en: "en-US",
  hi: "hi-IN",
  ml: "ml-IN",
  te: "te-IN",
  pa: "pa-IN",
  ta: "ta-IN"
};

function detectSpeechPlaybackSupport() {
  return typeof window !== "undefined"
    && (
      Boolean(window.speechSynthesis)
      || "speechSynthesis" in window
      || "SpeechSynthesisUtterance" in window
      || typeof window.SpeechSynthesisUtterance === "function"
    );
}

function detectVoiceRecognitionSupport() {
  return typeof window !== "undefined"
    && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

function getLocalizedSupportCopy(translateUiText) {
  return Object.fromEntries(
    Object.entries(SUPPORT_COPY_BASE).map(([key, value]) => [key, translateUiText(value)])
  );
}

function getRecognitionErrorMessage(errorCode, text) {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return text.permissionDenied;
    case "no-speech":
      return text.noSpeechDetected;
    case "network":
      return text.recognitionNetworkFailed;
    default:
      return text.recognitionFailed;
  }
}

async function requestMicrophoneAccess() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export default function PatientVoiceAssistPage() {
  const { auth } = useAuth();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const { speak, stopReading } = useAccessibility();
  const supportText = useMemo(() => getLocalizedSupportCopy(translateUiText), [translateUiText, language]);
  const lowLiteracyTitle = translateUiText("Low literacy voice mode");
  const lowLiteracyBody = translateUiText("Use this mode to hear key actions read aloud before you start voice capture.");
  const lowLiteracyReadLabel = translateUiText("Read page summary");
  const patientId = auth.profileId;
  const [copilot, setCopilot] = useState(null);
  const [adaptive, setAdaptive] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [microphonePermission, setMicrophonePermission] = useState("unknown");
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(detectSpeechPlaybackSupport);
  const [recognitionSupported, setRecognitionSupported] = useState(detectVoiceRecognitionSupport);
  const [voicesReady, setVoicesReady] = useState(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return false;
    }
    return (window.speechSynthesis.getVoices?.() || []).length > 0;
  });
  const recognitionRef = useRef(null);

  const playbackReady = speechSupported || detectSpeechPlaybackSupport();
  const recognitionReady = (recognitionSupported || detectVoiceRecognitionSupport()) && microphonePermission !== "denied";

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled([fetchCopilotRecommendations(patientId), fetchAdaptiveTriage(patientId)])
      .then(([copilotResult, adaptiveResult]) => {
        if (!active) {
          return;
        }
        const nextCopilot = copilotResult.status === "fulfilled" ? copilotResult.value : null;
        const nextAdaptive = adaptiveResult.status === "fulfilled" ? adaptiveResult.value : null;

        setCopilot(nextCopilot);
        setAdaptive(nextAdaptive);

        if (!nextCopilot && !nextAdaptive) {
          setError(getApiErrorMessage(
            copilotResult.status === "rejected" ? copilotResult.reason : adaptiveResult.reason,
            t("unableLoadVoiceSupport")
          ));
        } else {
          setError("");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [patientId, t]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let supportRefreshTimer = null;

    const refreshVoiceSupport = () => {
      setSpeechSupported(detectSpeechPlaybackSupport());
      setRecognitionSupported(detectVoiceRecognitionSupport());
      setVoicesReady((window.speechSynthesis?.getVoices?.() || []).length > 0);
    };

    const handleVoicesChanged = () => {
      refreshVoiceSupport();
    };

    const primeVoiceSupport = () => {
      try {
        window.speechSynthesis?.resume?.();
        window.speechSynthesis?.getVoices?.();
      } catch {
        // Ignore browser-specific warmup failures.
      }
      refreshVoiceSupport();
    };

    refreshVoiceSupport();
    supportRefreshTimer = window.setInterval(() => {
      refreshVoiceSupport();
      if (detectSpeechPlaybackSupport()) {
        window.clearInterval(supportRefreshTimer);
        supportRefreshTimer = null;
      }
    }, 1200);

    window.speechSynthesis?.addEventListener?.("voiceschanged", handleVoicesChanged);
    window.addEventListener("pageshow", primeVoiceSupport);
    window.addEventListener("focus", primeVoiceSupport);
    window.addEventListener("pointerdown", primeVoiceSupport, true);
    window.addEventListener("keydown", primeVoiceSupport, true);

    return () => {
      if (supportRefreshTimer) {
        window.clearInterval(supportRefreshTimer);
      }
      window.speechSynthesis?.removeEventListener?.("voiceschanged", handleVoicesChanged);
      window.removeEventListener("pageshow", primeVoiceSupport);
      window.removeEventListener("focus", primeVoiceSupport);
      window.removeEventListener("pointerdown", primeVoiceSupport, true);
      window.removeEventListener("keydown", primeVoiceSupport, true);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      setMicrophonePermission("unknown");
      return undefined;
    }

    let active = true;
    let permissionStatus;
    navigator.permissions.query({ name: "microphone" })
      .then((status) => {
        if (!active) {
          return;
        }
        permissionStatus = status;
        setMicrophonePermission(status.state || "unknown");
        status.onchange = () => setMicrophonePermission(status.state || "unknown");
      })
      .catch(() => {
        if (active) {
          setMicrophonePermission("unknown");
        }
      });

    return () => {
      active = false;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionSupported) {
      recognitionRef.current = null;
      return undefined;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = RECOGNITION_LOCALE[language] ?? RECOGNITION_LOCALE.en;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setError("");
    };
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      setTranscript(text);
      setListening(false);
      setError("");
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event?.error === "aborted") {
        return;
      }
      setError(getRecognitionErrorMessage(event?.error, supportText));
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // Ignore browser-specific cleanup errors.
      }
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
  }, [language, recognitionSupported, supportText]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        return;
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore browser-specific cleanup issues.
      } finally {
        setListening(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => () => {
    stopReading();
  }, [stopReading]);
  useEffect(() => {
    stopReading();
  }, [language, stopReading]);

  const guidanceSource = useMemo(() => {
    const lines = [];
    if (copilot?.patientActions?.length) {
      lines.push(...copilot.patientActions.slice(0, 3));
    }
    if (adaptive?.questions?.length) {
      lines.push(t("adaptiveTriage"));
      lines.push(...adaptive.questions.slice(0, 3));
    }
    return lines.join(". ");
  }, [adaptive, copilot, t]);
  const localizedGuidanceText = useLocalizedText(guidanceSource, { minLength: 8 });

  const startListening = async () => {
    if (microphonePermission === "denied") {
      setError(supportText.permissionDenied);
      return;
    }
    if (!recognitionRef.current) {
      setError(supportText.recognitionUnavailable);
      return;
    }
    if (listening) {
      return;
    }
    if (microphonePermission === "prompt") {
      const granted = await requestMicrophoneAccess();
      if (!granted) {
        setMicrophonePermission("denied");
        setError(supportText.permissionDenied);
        return;
      }
      setMicrophonePermission("granted");
    }

    setError("");
    try {
      recognitionRef.current.start();
    } catch {
      setListening(false);
      setError(microphonePermission === "prompt" ? supportText.permissionRequiredNotice : supportText.recognitionFailed);
    }
  };

  const enableMicrophone = async () => {
    if (!recognitionSupported) {
      setError(supportText.recognitionUnavailable);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(supportText.microphoneUnavailable);
      return;
    }

    if (requestingPermission) {
      return;
    }

    setRequestingPermission(true);
    setError("");
    try {
      const granted = await requestMicrophoneAccess();
      if (granted) {
        setMicrophonePermission("granted");
        setError("");
        return;
      }

      setMicrophonePermission("denied");
      setError(supportText.permissionDenied);
    } finally {
      setRequestingPermission(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore browser-specific stop errors but ensure UI recovers.
    } finally {
      setListening(false);
    }
  };

  const speakGuidance = () => {
    const voiceText = localizedGuidanceText || guidanceSource;
    if (!playbackReady) {
      setError(t("browserVoiceUnsupported"));
      return;
    }
    if (!voiceText) {
      setError(supportText.guidanceUnavailable);
      return;
    }
    setError("");
    speak(voiceText, language);
  };

  const supported = recognitionSupported || speechSupported || detectVoiceRecognitionSupport() || detectSpeechPlaybackSupport();
  const statusPills = [
    {
      label: supportText.speechPlayback,
      value: !speechSupported
        ? supportText.limited
        : playbackReady
          ? supportText.ready
          : supportText.limited,
      ok: playbackReady
    },
    {
      label: supportText.voiceCapture,
      value: !recognitionSupported
        ? supportText.limited
        : microphonePermission === "denied"
          ? supportText.limited
          : microphonePermission === "prompt"
            ? supportText.permissionRequired
            : supportText.ready,
      ok: recognitionReady
    }
  ];
  const lowLiteracySummary = useMemo(() => ([
    t("voiceAssistHub"),
    t("startListening"),
    t("stopListening"),
    t("speakGuidance"),
    t("capturedTranscript"),
    t("spokenGuidance")
  ].join(". ")), [t]);

  const speakLowLiteracySummary = () => {
    if (!playbackReady) {
      setError(t("browserVoiceUnsupported"));
      return;
    }
    setError("");
    speak(lowLiteracySummary, language);
  };

  return (
    <div className="space-y-6">
      <SectionCard title={t("voiceAssistHub")}>
        <LocalizedText as="p" className="text-sm text-slate-600" value={t("voiceSupportIntro")} minLength={4} />
        {!supported ? (
          <LocalizedText
            as="p"
            className="mt-4 text-sm text-amber-700"
            role="status"
            aria-live="polite"
            value={t("browserVoiceUnsupported")}
            minLength={4}
          />
        ) : null}
        {speechSupported && !voicesReady ? (
          <LocalizedText
            as="p"
            className="mt-4 text-sm text-amber-700"
            role="status"
            aria-live="polite"
            value={supportText.localeVoiceFallback}
            minLength={4}
          />
        ) : null}
        {recognitionSupported && microphonePermission === "prompt" ? (
          <LocalizedText
            as="p"
            className="mt-4 text-sm text-slate-600"
            role="status"
            aria-live="polite"
            value={supportText.permissionRequiredNotice}
            minLength={4}
          />
        ) : null}
        {recognitionSupported && microphonePermission === "denied" ? (
          <LocalizedText
            as="p"
            className="mt-4 text-sm text-amber-700"
            role="status"
            aria-live="polite"
            value={supportText.microphoneBlockedGuidance}
            minLength={4}
          />
        ) : null}
        {error ? (
          <div className="mt-4">
            <ErrorStateCard
              title={translateUiText("Voice support issue")}
              body={error}
            />
          </div>
        ) : null}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {statusPills.map((item) => (
            <div key={item.label} className="rounded-2xl bg-mist px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                <LocalizedText as="span" value={item.label} minLength={4} />
              </p>
              <p className={`mt-2 text-sm font-semibold ${item.ok ? "text-emerald-700" : "text-amber-700"}`}>
                <LocalizedText as="span" value={item.value} minLength={4} />
              </p>
            </div>
          ))}
          <div className="rounded-2xl bg-mist px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              <LocalizedText as="span" value={supportText.activeLocale} minLength={4} />
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {RECOGNITION_LOCALE[language] ?? RECOGNITION_LOCALE.en}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {recognitionSupported && microphonePermission !== "granted" ? (
            <button
              className="btn-secondary"
              type="button"
              disabled={requestingPermission}
              onClick={enableMicrophone}
              aria-label={requestingPermission ? supportText.enablingMicrophone : supportText.enableMicrophone}
              data-voice-label={requestingPermission ? supportText.enablingMicrophone : supportText.enableMicrophone}
            >
              {requestingPermission ? supportText.enablingMicrophone : supportText.enableMicrophone}
            </button>
          ) : null}
          <button
            className="btn-primary"
            type="button"
            disabled={!recognitionReady || listening}
            onClick={startListening}
            aria-label={listening ? t("listening") : t("startListening")}
            data-voice-label={listening ? t("listening") : t("startListening")}
          >
            {listening ? t("listening") : t("startListening")}
          </button>
          <button
            className="btn-secondary"
            type="button"
            disabled={!recognitionReady || !listening}
            onClick={stopListening}
            aria-label={t("stopListening")}
            data-voice-label={t("stopListening")}
          >
            {t("stopListening")}
          </button>
          <button
            className="btn-secondary"
            type="button"
            disabled={!playbackReady || loading}
            onClick={speakGuidance}
            aria-label={t("speakGuidance")}
            data-voice-label={t("speakGuidance")}
          >
            {t("speakGuidance")}
          </button>
        </div>
        {recognitionSupported && microphonePermission === "granted" ? (
          <LocalizedText
            as="p"
            className="mt-4 text-sm text-emerald-700"
            role="status"
            aria-live="polite"
            value={supportText.microphoneReady}
            minLength={4}
          />
        ) : null}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <LocalizedText as="p" className="text-sm font-semibold text-ink" value={supportText.fallbackTitle} minLength={4} />
          <LocalizedText as="p" className="mt-1 text-sm text-slate-600" value={supportText.fallbackBody} minLength={4} />
        </div>
      </SectionCard>
      <SectionCard title={lowLiteracyTitle}>
        <LocalizedText
          as="p"
          className="text-sm text-slate-600"
          value={lowLiteracyBody}
          minLength={4}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="btn-primary"
            type="button"
            onClick={speakLowLiteracySummary}
            disabled={!playbackReady}
            aria-label={lowLiteracyReadLabel}
            data-voice-label={lowLiteracyReadLabel}
          >
            {lowLiteracyReadLabel}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={stopReading}
            aria-label={t("stopListening")}
            data-voice-label={t("stopListening")}
          >
            {t("stopListening")}
          </button>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title={t("capturedTranscript")}>
          <div className="rounded-2xl bg-mist p-5 text-sm text-slate-700" role="status" aria-live="polite">
            {listening
              ? <LocalizedText as="span" value={t("listening")} minLength={4} />
              : transcript
                ? <LocalizedText as="span" value={transcript} minLength={4} />
                : <LocalizedText as="span" value={t("listenSupport")} minLength={4} />}
          </div>
        </SectionCard>
        <SectionCard title={t("spokenGuidance")}>
          {loading ? <LoadingSkeleton lines={3} /> : null}
          {!loading ? (
            <div className="space-y-3">
              {(copilot?.patientActions || []).length || (adaptive?.questions || []).length ? (
                <>
                  {(copilot?.patientActions || []).map((item) => (
                    <LocalizedText key={item} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={item} />
                  ))}
                  {(adaptive?.questions || []).slice(0, 3).map((item) => (
                    <LocalizedText key={item} as="div" className="rounded-2xl bg-mist px-4 py-3 text-sm text-slate-700" value={item} />
                  ))}
                </>
              ) : (
                <EmptyStateCard
                  title={translateUiText("No spoken guidance yet")}
                  body={supportText.guidanceUnavailable}
                />
              )}
            </div>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}
