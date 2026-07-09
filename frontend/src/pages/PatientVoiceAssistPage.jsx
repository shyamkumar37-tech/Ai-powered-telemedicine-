import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LocalizedText, { useLocalizedText } from "../components/LocalizedText";
import { useAccessibility } from "../context/AccessibilityContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchAdaptiveTriage, fetchCopilotRecommendations } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, Mic, MicOff, Volume2, PlayCircle, StopCircle, RefreshCw, AlertTriangle, ShieldCheck, MessageSquare } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

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
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const { speak, stopReading } = useAccessibility();
  const supportText = useMemo(() => getLocalizedSupportCopy(translateUiText), [translateUiText, language]);
  const patientId = auth?.profileId;
  
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
    if (typeof window === "undefined" || !window.speechSynthesis) return false;
    return (window.speechSynthesis.getVoices?.() || []).length > 0;
  });
  const recognitionRef = useRef(null);

  const playbackReady = speechSupported || detectSpeechPlaybackSupport();
  const recognitionReady = (recognitionSupported || detectVoiceRecognitionSupport()) && microphonePermission !== "denied";

  const load = () => {
    if (!patientId) return;
    setLoading(true);
    Promise.allSettled([fetchCopilotRecommendations(patientId), fetchAdaptiveTriage(patientId)])
      .then(([copilotResult, adaptiveResult]) => {
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
    let supportRefreshTimer = null;
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
      } catch {}
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
    let permissionStatus;
    navigator.permissions.query({ name: "microphone" })
      .then((status) => {
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
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = RECOGNITION_LOCALE[language] ?? RECOGNITION_LOCALE.en;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { setListening(true); setError(""); };
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      setTranscript(text);
      setListening(false);
      setError("");
    };
    recognition.onerror = (event) => {
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
      try { recognition.abort(); } catch {}
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
  }, [language, recognitionSupported, supportText]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") return;
      try { recognitionRef.current?.stop(); } catch {}
      finally { setListening(false); }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => () => stopReading(), [stopReading]);
  useEffect(() => { stopReading(); }, [language, stopReading]);

  const guidanceSource = useMemo(() => {
    const lines = [];
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
    try { recognitionRef.current?.stop(); } catch {}
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
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />
        
        <main id="page-main" role="main">
          <div className="topbar">
            <div>
              <h1 className="serif">Voice Assist</h1>
              <p>Hands-free voice capture and audible medical guidance.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Volume2 />Accessibility
              </div>
              <div className="signed-in" style={{ marginTop: '12px', marginLeft: '8px' }}>
                <User />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <button className="btn-ghost" onClick={handleLogout} aria-label="Log out">
                <LogOut />Logout
              </button>
            </div>
          </div>

          <div className="booking-layout">
            <div style={{ flex: 1, padding: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              
              <div className="space-y-8">
                
                {/* Status & Controls Panel */}
                <div className="tct-animate-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                     <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>System Status</h3>
                     <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                  </div>
                  
                  <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)', marginBottom: '24px' }}>
                      {translateUiText("Voice capture needs microphone permission from the browser before it can start. You can also use the Accessibility tools to read the page aloud.")}
                    </p>
                    
                    {!supported && (
                      <div style={{ padding: '16px', background: 'var(--tct-coral-dim)', color: 'var(--tct-coral)', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} />
                        <div>
                          <p style={{ fontWeight: '600' }}>Browser Unsupported</p>
                          <p style={{ fontSize: '13px', marginTop: '4px' }}>Your browser does not support Voice Assist features.</p>
                        </div>
                      </div>
                    )}
                    
                    {error && (
                      <div style={{ padding: '16px', background: 'var(--tct-coral-dim)', color: 'var(--tct-coral)', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} />
                        <div>
                          <p style={{ fontWeight: '600' }}>Voice Support Issue</p>
                          <p style={{ fontSize: '13px', marginTop: '4px' }}>{error}</p>
                        </div>
                      </div>
                    )}

                    <div className="doctors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{supportText.speechPlayback}</p>
                        <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: '600', color: playbackReady ? 'var(--tct-teal)' : 'var(--tct-coral)' }}>
                          {playbackReady ? supportText.ready : supportText.limited}
                        </p>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{supportText.voiceCapture}</p>
                        <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: '600', color: recognitionReady ? 'var(--tct-teal)' : (microphonePermission === 'prompt' ? '#C9A24B' : 'var(--tct-coral)') }}>
                          {!recognitionSupported ? supportText.limited : microphonePermission === "denied" ? supportText.limited : microphonePermission === "prompt" ? supportText.permissionRequired : supportText.ready}
                        </p>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{supportText.activeLocale}</p>
                        <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
                          {RECOGNITION_LOCALE[language] ?? RECOGNITION_LOCALE.en}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {recognitionSupported && microphonePermission !== "granted" && (
                        <button className="btn-secondary" disabled={requestingPermission} onClick={enableMicrophone}>
                          {requestingPermission ? supportText.enablingMicrophone : supportText.enableMicrophone}
                        </button>
                      )}
                      <button className="btn-primary" disabled={!recognitionReady || listening} onClick={startListening} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mic size={16} /> {listening ? t("listening") : t("startListening")}
                      </button>
                      <button className="btn-secondary" disabled={!recognitionReady || !listening} onClick={stopListening} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MicOff size={16} /> {t("stopListening")}
                      </button>
                      <button className="btn-secondary" disabled={!playbackReady || loading} onClick={speakGuidance} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PlayCircle size={16} /> {t("speakGuidance")}
                      </button>
                      <button className="btn-secondary" onClick={stopReading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StopCircle size={16} /> Stop Reading
                      </button>
                    </div>

                  </div>
                </div>

                {/* Workspace Panels */}
                <div className="doctors-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                  
                  {/* Transcript */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                       <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Captured Transcript</h3>
                       <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                    </div>
                    
                    {!listening && !transcript ? (
                      <div className="empty-state" style={{ minHeight: '240px' }}>
                        <MessageSquare />
                        <h3>No Transcript Yet</h3>
                        <p>Click "Start Listening" to capture your speech and translate it into text.</p>
                      </div>
                    ) : (
                      <div className="doctor-card" style={{ cursor: 'default', padding: '24px', minHeight: '240px' }}>
                        {listening ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--tct-teal)' }}>
                            <div className="skeleton-pulse" style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--tct-teal)' }}></div>
                            <span style={{ fontWeight: '600' }}>Listening...</span>
                          </div>
                        ) : (
                          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#FFFFFF' }}>{transcript}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Guidance */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                       <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Audible Guidance</h3>
                       <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                    </div>
                    
                    {loading ? (
                       <div className="doctor-card" style={{ cursor: 'default', padding: '24px', minHeight: '240px' }}>
                          <div className="skeleton-pulse" style={{ height: '24px', width: '80%', borderRadius: '4px', marginBottom: '16px' }}></div>
                          <div className="skeleton-pulse" style={{ height: '24px', width: '60%', borderRadius: '4px' }}></div>
                       </div>
                    ) : (!copilot?.patientActions?.length && !adaptive?.questions?.length) ? (
                      <div className="empty-state" style={{ minHeight: '240px' }}>
                        <ShieldCheck />
                        <h3>No Active Guidance</h3>
                        <p>You have no pending triage questions or required patient actions at this time.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(copilot?.patientActions || []).map((item, idx) => (
                          <div key={idx} className="doctor-card" style={{ cursor: 'default', padding: '20px' }}>
                            <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0' }}>{item}</p>
                          </div>
                        ))}
                        {(adaptive?.questions || []).slice(0, 3).map((item, idx) => (
                          <div key={`adaptive-${idx}`} className="doctor-card" style={{ cursor: 'default', padding: '20px', borderLeft: '4px solid var(--tct-teal)' }}>
                            <h4 style={{ fontSize: '12px', color: 'var(--tct-teal)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Triage Question</h4>
                            <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0' }}>{item}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
