import { useEffect, useRef, useState } from "react";
import PremiumSectionCard from "../../components/PremiumSectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { transcribeAudioToSoapNote } from "../services/aiService";
import { Mic, MicOff, CheckCircle2, FileText, Loader2, AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "../../utils/apiError";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

export interface AiMedicalScribePanelProps {
  onSoapNoteGenerated?: (...args: DynamicStateObject[]) => void;
  webrtcStream?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AiMedicalScribePanel({ onSoapNoteGenerated, webrtcStream }: AiMedicalScribePanelProps) {
  const { t } = useLanguage();
  const mediaRecorderRef = useRef<DynamicState>(null);
  const chunksRef = useRef<DynamicState>([]);
  const fallbackStreamRef = useRef<DynamicState>(null);
  
  const [listening, setListening] = useState<DynamicState>(false);
  const [loading, setLoading] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");
  const [soapData, setSoapData] = useState<DynamicStateObject | null>(null);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (fallbackStreamRef.current) {
        fallbackStreamRef.current.getTracks().forEach((track: DynamicStateObject) => track.stop());
      }
    };
  }, []);

  const toggleRecording = async () => {
    if (listening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setListening(false);
    } else {
      setError("");
      setSoapData(null);
      chunksRef.current = [];
      
      let streamToRecord = webrtcStream;
      
      if (!streamToRecord) {
        try {
          fallbackStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamToRecord = fallbackStreamRef.current;
        } catch (err: DynamicStateObject) {
          setError("Microphone access denied or not available. Please start a call first.");
          return;
        }
      }

      try {
        const recorder = new MediaRecorder(streamToRecord);
        recorder.ondataavailable = (e: DynamicStateObject) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          processAudioBlob(blob);
          if (fallbackStreamRef.current) {
            fallbackStreamRef.current.getTracks().forEach((t: DynamicStateObject) => t.stop());
            fallbackStreamRef.current = null;
          }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setListening(true);
      } catch (err: DynamicStateObject) {
        setError("Failed to start recording. " + err.message);
      }
    }
  };

  const processAudioBlob = async (blob: DynamicStateObject) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "consultation.webm");
      const result = await transcribeAudioToSoapNote(formData);
      setSoapData(result);
      if (onSoapNoteGenerated) {
        onSoapNoteGenerated(result);
      }
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, "Failed to generate SOAP note"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumSectionCard title="AI Medical Scribe" icon={<FileText className="w-5 h-5 text-amber-400" />}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
          <div>
            <h3 className="text-sm font-semibold text-ink/90">{t("voiceToTextSOAPNotes") || "Voice-to-Text SOAP Notes"}</h3>
            <p className="text-xs text-ink-muted mt-1">Record the consultation (both sides) and auto-generate structured clinical notes using Gemini.</p>
          </div>
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              listening
                ? "bg-alert/10 text-alert hover:bg-alert/20 animate-pulse border border-alert/20"
                : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listening ? "Stop Recording" : "Start Recording"}
          </button>
        </div>

        {listening && (
          <div className="p-3 rounded-xl bg-canvas/50 border border-white/10 flex items-center gap-2 shadow-inner">
             <div className="w-2 h-2 rounded-full bg-alert animate-ping shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
             <span className="text-sm text-ink-muted/90 font-medium">{t("capturingConsultationAudioClickStopWhenFinished") || "Capturing consultation audio... Click Stop when finished."}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 text-primary">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm font-medium">{t("geminiIsTranscribingAndStructuringSOAPNote") || "Gemini is transcribing and structuring SOAP note..."}</span>
          </div>
        )}

        {error && (
          <div className="text-sm font-semibold text-alert flex items-center gap-2 p-3 bg-alert/5 rounded-xl border border-alert/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
             <AlertCircle className="w-4 h-4" />
             {error}
          </div>
        )}

        {soapData && !loading && (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 shadow-inner">
            <div className="flex items-center text-primary text-sm font-bold tracking-wider uppercase mb-1">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {t("readyForReview") || "Ready for Review"}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-widest">{t("subjective") || "Subjective"}</span>
                <p className="text-sm text-ink/90 mt-1.5 leading-relaxed">{soapData.subjective}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-widest">{t("objective") || "Objective"}</span>
                <p className="text-sm text-ink/90 mt-1.5 leading-relaxed">{soapData.objective}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-widest">{t("assessment") || "Assessment"}</span>
                <p className="text-sm text-ink/90 mt-1.5 leading-relaxed">{soapData.assessment}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-widest">{t("plan") || "Plan"}</span>
                <p className="text-sm text-ink/90 mt-1.5 leading-relaxed">{soapData.plan}</p>
              </div>
            </div>
            <div className="mt-3 bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-widest">{t("fullTranscript") || "Full Transcript"}</span>
                <p className="text-xs text-ink-muted/80 mt-1.5 whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-hide leading-relaxed">{soapData.fullNotes}</p>
            </div>
            <div className="text-[10px] text-ink-muted/50 mt-2 border-t border-white/10 pt-3 italic">
              {t("aIGeneratedByGeminiReviewAndConfirmBelowToSaveToPatientRecord") || "AI-generated by Gemini. Review and confirm below to save to patient record."}</div>
          </div>
        )}
      </div>
    </PremiumSectionCard>
  );
}
