import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalizedText } from "../components/LocalizedText";
import { useAccessibility } from "../context/AccessibilityContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchAdaptiveTriage, fetchCopilotRecommendations } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, Mic, MicOff, Volume2, PlayCircle, StopCircle, AlertTriangle, ShieldCheck, MessageSquare } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

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
      // @ts-expect-error - Auto-suppressed during migration
      || typeof window.SpeechSynthesisUtterance === "function"
    );
}

function detectVoiceRecognitionSupport() {
  return typeof window !== "undefined"
    && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

function getLocalizedSupportCopy(translateUiText: DynamicStateObject) {
  return Object.fromEntries(
    Object.entries(SUPPORT_COPY_BASE).map(([key, value]: DynamicStateObject) => [key, translateUiText(value)])
  );
}

function getRecognitionErrorMessage(errorCode: DynamicStateObject, text: DynamicStateObject) {
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
    stream.getTracks().forEach((track: DynamicStateObject) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export default function PatientVoiceAssistPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const { speak, stopReading } = useAccessibility();
  const supportText = useMemo(() => getLocalizedSupportCopy(translateUiText), [translateUiText, language]);
  const patientId = auth?.profileId;
  
  const [copilot, setCopilot] = useState<DynamicStateObject | null>(null);
  const [adaptive, setAdaptive] = useState<DynamicStateObject | null>(null);
  const [transcript, setTranscript] = useState<DynamicState>("");
  const [listening, setListening] = useState<DynamicState>(false);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");
  const [microphonePermission, setMicrophonePermission] = useState<DynamicState>("unknown");
  const [requestingPermission, setRequestingPermission] = useState<DynamicState>(false);
  const [speechSupported, setSpeechSupported] = useState<DynamicState>(detectSpeechPlaybackSupport);
  const [recognitionSupported, setRecognitionSupported] = useState<DynamicState>(detectVoiceRecognitionSupport);
  const [voicesReady, setVoicesReady] = useState<DynamicState>(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return false;
    return (window.speechSynthesis.getVoices?.() || []).length > 0;
  });
  const recognitionRef = useRef<DynamicState>(null);

  const playbackReady = speechSupported || detectSpeechPlaybackSupport();
  const recognitionReady = (recognitionSupported || detectVoiceRecognitionSupport()) && microphonePermission !== "denied";

  const load = () => {
    if (!patientId) return;
    setLoading(true);
    Promise.allSettled([fetchCopilotRecommendations(patientId), fetchAdaptiveTriage(patientId)])
      .then(([copilotResult, adaptiveResult]: DynamicStateObject) => {
        const nextCopilot = copilotResult.status === "fulfilled" ? copilotResult.value : null;
        const nextAdaptive = adaptiveResult.status === "fulfilled" ? adaptiveResult.value : null;
        setCopilot(nextCopilot);
        setAdaptive(nextAdaptive);
        if (!nextCopilot && !nextAdaptive) {
          setError(getApiErrorMessage(copilotResult.status === "rejected" ? copilotResult.reason : adaptiveResult.reason, t("unableLoadVoiceSupport")));
        } else {
          setError("");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [patientId, t]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let supportRefreshTimer: DynamicStateObject = null;
    const refreshVoiceSupport = () => {
      setSpeechSupported(detectSpeechPlaybackSupport());
      setRecognitionSupported(detectVoiceRecognitionSupport());
      setVoicesReady((window.speechSynthesis?.getVoices?.() || []).length > 0);
    };
    const handleVoicesChanged = () => refreshVoiceSupport();
    const primeVoiceSupport = () => {
      try {
        window.speechSynthesis?.resume?.();
        window.speechSynthesis?.getVoices?.();
      } catch { /* ignore */ }
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
      if (supportRefreshTimer) window.clearInterval(supportRefreshTimer);
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
    let permissionStatus: DynamicStateObject;
    navigator.permissions.query({ name: "microphone" })
      .then((status: DynamicStateObject) => {
        permissionStatus = status;
        setMicrophonePermission(status.state || "unknown");
        status.onchange = () => setMicrophonePermission(status.state || "unknown");
      })
      .catch(() => setMicrophonePermission("unknown"));
    return () => { if (permissionStatus) permissionStatus.onchange = null; };
  }, []);

  useEffect(() => {
    if (!recognitionSupported) {
      recognitionRef.current = null;
      return undefined;
    }
    // @ts-expect-error - Auto-suppressed during migration
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = (RECOGNITION_LOCALE as DynamicStateObject)[language] ?? RECOGNITION_LOCALE.en;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setListening(true); setError(""); };
    recognition.onresult = (event: DynamicStateObject) => {
      const text = ((event.results as DynamicStateObject)?.[0] as DynamicStateObject)?.[0]?.transcript || "";
      setTranscript(text);
      setListening(false);
      setError("");
    };
    recognition.onerror = (event: DynamicStateObject) => {
      setListening(false);
      if (event?.error === "aborted") return;
      setError(getRecognitionErrorMessage(event?.error, supportText));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.abort(); } catch { /* ignore */ }
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
  }, [language, recognitionSupported, supportText]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") return;
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      finally { setListening(false); }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => () => stopReading(), [stopReading]);
  useEffect(() => { stopReading(); }, [language, stopReading]);

  const guidanceSource = useMemo(() => {
    const lines: DynamicStateObject = [];
    if (copilot?.patientActions?.length) lines.push(...copilot.patientActions.slice(0, 3));
    if (adaptive?.questions?.length) {
      lines.push(t("adaptiveTriage"));
      lines.push(...adaptive.questions.slice(0, 3));
    }
    return lines.join(". ");
  }, [adaptive, copilot, t]);
  
  const localizedGuidanceText = useLocalizedText(guidanceSource, { minLength: 8 });

  const startListening = async () => {
    if (microphonePermission === "denied") { setError(supportText.permissionDenied); return; }
    if (!recognitionRef.current) { setError(supportText.recognitionUnavailable); return; }
    if (listening) return;
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
    try { recognitionRef.current.start(); } 
    catch {
      setListening(false);
      setError(microphonePermission === "prompt" ? supportText.permissionRequiredNotice : supportText.recognitionFailed);
    }
  };

  const enableMicrophone = async () => {
    if (!recognitionSupported) { setError(supportText.recognitionUnavailable); return; }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) { setError(supportText.microphoneUnavailable); return; }
    if (requestingPermission) return;
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
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    finally { setListening(false); }
  };

  const speakGuidance = () => {
    const voiceText = localizedGuidanceText || guidanceSource;
    if (!playbackReady) { setError(t("browserVoiceUnsupported")); return; }
    if (!voiceText) { setError(supportText.guidanceUnavailable); return; }
    setError("");
    speak(voiceText, language);
  };

  const speakLowLiteracySummary = () => {
    if (!playbackReady) { setError(t("browserVoiceUnsupported")); return; }
    setError("");
    speak([t("voiceAssistHub"), t("startListening"), t("stopListening"), t("speakGuidance"), t("capturedTranscript"), t("spokenGuidance")].join(". "), language);
  };

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  const supported = recognitionSupported || speechSupported || detectVoiceRecognitionSupport() || detectSpeechPlaybackSupport();

  return (
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("voiceAssist") || "Voice Assist"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("handsFreeVoiceCaptureAndAudibleMedicalGuidance") || "Hands-free voice capture and audible medical guidance."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Volume2 size={12} className="text-primary" />{t("accessibility") || "Accessibility"}</span>
              <div className="inline-flex items-center gap-2 text-xs text-ink-muted bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <User size={14} />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher hideLabel />
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-ink-muted border border-white/10 rounded-element text-sm font-medium hover:bg-white/5 hover:text-ink transition-colors"
            >
              <LogOut size={16} />{t("logout") || "Logout"}</button>
          </div>
        </div>

        <div className="max-w-5xl animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          
          <div className="space-y-10">
            
            {/* Status & Controls Panel */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                 <h3 className="font-display text-xl font-medium">{t("systemStatus") || "System Status"}</h3>
                 <div className="flex-1 h-px bg-white/10"></div>
              </div>
              
              <div className="card-premium">
                <p className="text-sm text-ink-muted mb-6 leading-relaxed">
                  {(t("voiceCaptureNeedsMicrophonePermissionFromTheBrowserBeforeItCanStartYouCanAlsoUseTheAccessibilityToolsToReadThePageAloud") || "Voice capture needs microphone permission from the browser before it can start. You can also use the Accessibility tools to read the page aloud.")}
                </p>
                
                {!supported && (
                  <div className="mb-6 p-4 bg-alert/10 border border-alert/20 rounded-xl flex items-start gap-4">
                    <AlertTriangle size={24} className="text-alert shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-alert mb-1">{t("browserUnsupported") || "Browser Unsupported"}</p>
                      <p className="text-sm text-alert/80 leading-relaxed">{t("yourBrowserDoesNotSupportVoiceAssistFeatures") || "Your browser does not support Voice Assist features."}</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="mb-6 p-4 bg-alert/10 border border-alert/20 rounded-xl flex items-start gap-4">
                    <AlertTriangle size={24} className="text-alert shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-alert mb-1">{t("voiceSupportIssue") || "Voice Support Issue"}</p>
                      <p className="text-sm text-alert/80 leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{supportText.speechPlayback}</p>
                    <p className={`text-base font-semibold ${playbackReady ? 'text-primary' : 'text-alert'}`}>
                      {playbackReady ? supportText.ready : supportText.limited}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{supportText.voiceCapture}</p>
                    <p className={`text-base font-semibold ${recognitionReady ? 'text-primary' : (microphonePermission === 'prompt' ? 'text-amber-500' : 'text-alert')}`}>
                      {!recognitionSupported ? supportText.limited : microphonePermission === "denied" ? supportText.limited : microphonePermission === "prompt" ? supportText.permissionRequired : supportText.ready}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">{supportText.activeLocale}</p>
                    <p className="text-base font-semibold text-ink">
                      {(RECOGNITION_LOCALE as DynamicStateObject)[language] ?? RECOGNITION_LOCALE.en}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {recognitionSupported && microphonePermission !== "granted" && (
                    <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-ink rounded-element text-sm font-medium transition-colors disabled:opacity-50" disabled={requestingPermission} onClick={enableMicrophone}>
                      {requestingPermission ? supportText.enablingMicrophone : supportText.enableMicrophone}
                    </button>
                  )}
                  <button className="btn-primary py-2.5 px-5 flex items-center gap-2" disabled={!recognitionReady || listening} onClick={startListening}>
                    <Mic size={18} className={listening ? "animate-pulse" : ""} /> {listening ? t("listening") : t("startListening")}
                  </button>
                  <button className="px-5 py-2.5 bg-alert/10 hover:bg-alert/20 border border-alert/20 text-alert rounded-element text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2" disabled={!recognitionReady || !listening} onClick={stopListening}>
                    <MicOff size={18} /> {t("stopListening")}
                  </button>
                  <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-ink rounded-element text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2" disabled={!playbackReady || loading} onClick={speakGuidance}>
                    <PlayCircle size={18} /> {t("speakGuidance")}
                  </button>
                  <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-ink rounded-element text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2" onClick={stopReading}>
                    <StopCircle size={18} /> {t("stopReading") || "Stop Reading"}</button>
                </div>

              </div>
            </div>

            {/* Workspace Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Transcript */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                   <h3 className="font-display text-xl font-medium">{t("capturedTranscript") || "Captured Transcript"}</h3>
                   <div className="flex-1 h-px bg-white/10"></div>
                </div>
                
                {!listening && !transcript ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center border border-white/5 rounded-xl border-dashed h-[240px]">
                    <MessageSquare size={40} className="text-ink-muted/30 mb-4" />
                    <h3 className="font-display text-lg mb-2">{t("noTranscriptYet") || "No Transcript Yet"}</h3>
                    <p className="text-sm text-ink-muted max-w-[250px]">Click &quot;Start Listening&quot; to capture your speech and translate it into text.</p>
                  </div>
                ) : (
                  <div className="card-premium h-[240px] !bg-surface">
                    {listening ? (
                      <div className="flex items-center gap-3 text-primary">
                        <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                        <span className="font-semibold tracking-wide">{t("listening") || "Listening..."}</span>
                      </div>
                    ) : (
                      <p className="text-base leading-relaxed text-ink">{transcript}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Guidance */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                   <h3 className="font-display text-xl font-medium">{t("audibleGuidance") || "Audible Guidance"}</h3>
                   <div className="flex-1 h-px bg-white/10"></div>
                </div>
                
                {loading ? (
                   <div className="card-premium h-[240px] flex flex-col gap-4">
                      <div className="h-5 w-4/5 bg-white/10 rounded animate-pulse"></div>
                      <div className="h-5 w-3/5 bg-white/10 rounded animate-pulse"></div>
                   </div>
                ) : (!copilot?.patientActions?.length && !adaptive?.questions?.length) ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center border border-white/5 rounded-xl border-dashed h-[240px]">
                    <ShieldCheck size={40} className="text-ink-muted/30 mb-4" />
                    <h3 className="font-display text-lg mb-2">{t("noActiveGuidance") || "No Active Guidance"}</h3>
                    <p className="text-sm text-ink-muted max-w-[250px]">{t("youHaveNoPendingTriageQuestionsOrRequiredPatientActionsAtThisTime") || "You have no pending triage questions or required patient actions at this time."}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {(copilot?.patientActions || []).map((item: DynamicStateObject, idx: DynamicStateObject) => (
                      <div key={idx} className="card-premium !p-5 hover:border-white/20 transition-colors !bg-surface">
                        <p className="text-sm leading-relaxed text-ink-muted">{item}</p>
                      </div>
                    ))}
                    {(adaptive?.questions || []).slice(0, 3).map((item: DynamicStateObject, idx: DynamicStateObject) => (
                      <div key={`adaptive-${idx}`} className="card-premium !p-5 hover:border-white/20 transition-colors border-l-4 border-l-primary !bg-surface">
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">{t("triageQuestion") || "Triage Question"}</h4>
                        <p className="text-sm leading-relaxed text-ink-muted">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
