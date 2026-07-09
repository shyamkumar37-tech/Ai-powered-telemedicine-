import { useEffect, useRef, useState } from "react";
import PremiumSectionCard from "../../components/PremiumSectionCard";
import { useLanguage } from "../../context/LanguageContext";
import { transcribeAudioToSoapNote } from "../services/aiService";
import { Mic, MicOff, CheckCircle2, FileText, Loader2, AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "../../utils/apiError";

export default function AiMedicalScribePanel({ onSoapNoteGenerated, webrtcStream }) {
  const { t } = useLanguage();
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fallbackStreamRef = useRef(null);
  
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [soapData, setSoapData] = useState(null);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (fallbackStreamRef.current) {
        fallbackStreamRef.current.getTracks().forEach(track => track.stop());
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
        } catch (err) {
          setError("Microphone access denied or not available. Please start a call first.");
          return;
        }
      }

      try {
        const recorder = new MediaRecorder(streamToRecord);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          processAudioBlob(blob);
          if (fallbackStreamRef.current) {
            fallbackStreamRef.current.getTracks().forEach(t => t.stop());
            fallbackStreamRef.current = null;
          }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setListening(true);
      } catch (err) {
        setError("Failed to start recording. " + err.message);
      }
    }
  };

  const processAudioBlob = async (blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "consultation.webm");
      const result = await transcribeAudioToSoapNote(formData);
      setSoapData(result);
      if (onSoapNoteGenerated) {
        onSoapNoteGenerated(result);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to generate SOAP note"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumSectionCard title="AI Medical Scribe" icon={<FileText className="w-5 h-5 text-tcd-brass" />}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between bg-tcd-panel-2 rounded-lg p-4 border border-tcd-panel-line">
          <div>
            <h4 className="text-sm font-semibold text-tcd-text-primary">Voice-to-Text SOAP Notes</h4>
            <p className="text-xs text-tcd-text-muted mt-1">Record the consultation (both sides) and auto-generate structured clinical notes using Gemini.</p>
          </div>
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              listening
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 animate-pulse"
                : "bg-tcd-teal-dim text-tcd-teal hover:bg-tcd-teal/20"
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listening ? "Stop Recording" : "Start Recording"}
          </button>
        </div>

        {listening && (
          <div className="p-3 rounded-md bg-tcd-ink-2 border border-tcd-panel-line-strong flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-400 animate-ping"></div>
             <span className="text-sm text-tcd-text-primary">Capturing consultation audio... Click Stop when finished.</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4 text-tcd-teal">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Gemini is transcribing and structuring SOAP note...</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 flex items-center gap-2 p-3 bg-red-900/20 rounded-md border border-red-500/20">
             <AlertCircle className="w-4 h-4" />
             {error}
          </div>
        )}

        {soapData && !loading && (
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-tcd-teal-dim/30 border border-tcd-teal/20">
            <div className="flex items-center text-tcd-teal text-sm font-medium mb-1">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Ready for Review
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-tcd-text-secondary uppercase">Subjective</span>
                <p className="text-sm text-tcd-text-primary mt-1">{soapData.subjective}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-tcd-text-secondary uppercase">Objective</span>
                <p className="text-sm text-tcd-text-primary mt-1">{soapData.objective}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-tcd-text-secondary uppercase">Assessment</span>
                <p className="text-sm text-tcd-text-primary mt-1">{soapData.assessment}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-tcd-text-secondary uppercase">Plan</span>
                <p className="text-sm text-tcd-text-primary mt-1">{soapData.plan}</p>
              </div>
            </div>
            <div className="mt-2">
                <span className="text-xs font-semibold text-tcd-text-secondary uppercase">Full Transcript</span>
                <p className="text-xs text-tcd-text-muted mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">{soapData.fullNotes}</p>
            </div>
            <div className="text-[10px] text-tcd-text-muted mt-2 border-t border-tcd-panel-line pt-2">
              AI-generated by Gemini. Review and confirm below to save to patient record.
            </div>
          </div>
        )}
      </div>
    </PremiumSectionCard>
  );
}
