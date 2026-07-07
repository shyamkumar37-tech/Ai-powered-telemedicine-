import { useEffect, useMemo, useRef, useState } from "react";
import SectionCard from "../../components/SectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { finalizeVoiceIntake, processVoiceIntake, startVoiceIntake } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";

const SpeechRecognitionImpl = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

export default function AiVoiceIntakePanel({ onApplySummary }) {
  const { t } = useLanguage();
  const recognitionRef = useRef(null);
  const [sessionId, setSessionId] = useState("");
  const [stepId, setStepId] = useState("symptoms");
  const [prompt, setPrompt] = useState("");
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState(null);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const speechSupported = useMemo(() => Boolean(SpeechRecognitionImpl), []);

  useEffect(() => {
    if (!SpeechRecognitionImpl) {
      return;
    }
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      setTranscript(text);
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
  }, []);

  const startSession = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await startVoiceIntake({});
      setSessionId(data.sessionId);
      setPrompt(data.nextPrompt);
      setStepId("symptoms");
      setTranscript("");
      setSummary(null);
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableStartVoiceIntake")));
    } finally {
      setLoading(false);
    }
  };

  const captureSpeech = () => {
    if (!recognitionRef.current) {
      return;
    }
    setListening(true);
    recognitionRef.current.start();
  };

  const submitStep = async () => {
    if (!sessionId) {
      await startSession();
      return;
    }
    try {
      setError("");
      setLoading(true);
      const data = await processVoiceIntake({
        sessionId,
        stepId,
        transcript
      });
      setPrompt(data.nextPrompt);
      setStepId(data.nextStepId);
      setTranscript("");
      if (data.completed) {
        const summaryData = await finalizeVoiceIntake({ sessionId });
        setSummary(summaryData);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, t("unableProcessVoiceIntake")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title={t("aiVoiceIntakeTitle")}>
      {summary ? (
        <div className="space-y-3 text-sm text-slate-600">
          <p className="font-medium text-ink">{t("aiVoiceIntakeSummary")}</p>
          <p>{summary.summary}</p>
          <p className="text-xs text-slate-500">{summary.disclaimer}</p>
          {onApplySummary ? (
            <button className="btn-primary" type="button" onClick={() => onApplySummary(summary.summary)}>
              {t("applyVoiceIntake")}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">{prompt || t("aiVoiceIntakeHelper")}</p>
          <textarea
            className="field min-h-28 resize-y"
            value={transcript}
            aria-label={t("aiVoiceInput")}
            data-voice-label={t("aiVoiceInput")}
            placeholder={t("aiVoiceInputPlaceholder")}
            onChange={(event) => setTranscript(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={startSession} disabled={loading}>
              {t("startAiVoiceIntake")}
            </button>
            <button className="btn-secondary" type="button" onClick={captureSpeech} disabled={!speechSupported || listening}>
              {speechSupported ? (listening ? t("listening") : t("captureSpeech")) : t("speechUnsupported")}
            </button>
            <button className="btn-primary" type="button" onClick={submitStep} disabled={loading || !transcript.trim()}>
              {loading ? t("saving") : t("submitVoiceStep")}
            </button>
          </div>
          {!speechSupported ? (
            <p className="text-xs text-amber-600">{t("speechUnsupportedHelp")}</p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      )}
    </SectionCard>
  );
}
