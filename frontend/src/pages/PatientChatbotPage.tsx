import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { askChatbotQuestion, fetchChatbotHistory } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { LogOut, MessageSquare, Send, AlertTriangle, Zap } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

function normalizeChatbotEntry(entry: DynamicStateObject, fallbackAnswer: DynamicStateObject) {
  return {
    id: entry?.id ?? `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: typeof entry?.question === "string" && entry.question.trim()
      ? entry.question.trim()
      : "",
    answer: typeof entry?.answer === "string" && entry.answer.trim()
      ? entry.answer.trim()
      : fallbackAnswer,
    urgencyLabel: entry?.urgencyLabel || "INFO",
    suggestedActions: Array.isArray(entry?.suggestedActions)
      ? entry.suggestedActions.filter((item: DynamicStateObject) => typeof item === "string" && item.trim())
      : []
  };
}

export default function PatientChatbotPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [history, setHistory] = useState<DynamicStateObject[]>([]);
  const [question, setQuestion] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);
  const [sending, setSending] = useState<DynamicState>(false);
  const [error, setError] = useState<DynamicState>("");

  const fallbackAnswer = (t("guidanceIsTemporarilyUnavailablePleaseReviewYourSymptomsWithYourDoctorOrTryAgainShortly") || "Guidance is temporarily unavailable. Please review your symptoms with your doctor or try again shortly.");

  const load = async () => {
    if (!patientId) {
      setHistory([]);
      setLoading(false);
      setError("Unable to load chat history.");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchChatbotHistory(patientId);
      const normalizedHistory = Array.isArray(data) ? data.map((entry: DynamicStateObject) => normalizeChatbotEntry(entry, fallbackAnswer)) : [];
      setHistory(normalizedHistory);
      setError("");
    } catch (err: DynamicStateObject) {
      setHistory([]);
      setError(getApiErrorMessage(err, "Unable to load chat history."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const ask = async () => {
    if (sending || !patientId || !question.trim()) return;

    setSending(true);
    try {
      const response = await askChatbotQuestion({ patientId, question: question.trim() });
      const normalizedResponse = normalizeChatbotEntry(response, fallbackAnswer);
      setHistory((current: DynamicStateObject) => [normalizedResponse, ...current]);
      setQuestion("");
      setError("");
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, "Unable to get guidance."));
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  return (
    <div className="shell">
      <PatientSidebar />
      
      <main className="w-full flex-1 min-w-0">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="greeting-eyebrow">{t("patientWorkspace") || "Patient workspace"}</div>
            <h1>{t("aIChatbot") || "AI Assistant"}</h1>
            <p className="subtext">24/7 intelligent continuity care assistant.</p>
          </div>
          <div className="status-pills">
            <LanguageSwitcher hideLabel />
            <span className="pill verified"><i className="ti ti-shield-check"></i>Verified care team</span>
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="pill cursor-pointer hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-white transition-colors"
            >
              <LogOut size={14} />
              {t("logout") || "Logout"}
            </button>
          </div>
        </div>

        <div className="w-full max-w-4xl space-y-6">
          {/* Chat Input */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={20} className="text-[var(--primary)]" />
              <h3 className="font-semibold text-base">{t("askTheCareAssistant") || "Ask the Care Assistant"}</h3>
            </div>
            <p className="text-xs text-[var(--ink-muted)] leading-relaxed mb-4">
              {t("thisAssistantSupportsContinuityCareUsingTheRecordOnFileItIsNotADiagnosisServiceAndDoesNotReplaceClinicianReviewOrEmergencyCare") || "This assistant supports continuity care using the record on file. It is not a diagnosis service and does not replace clinician review or emergency care."}
            </p>
            
            <div className="relative">
              <textarea
                placeholder="How can I help you today?"
                value={question}
                onChange={(e: DynamicStateObject) => setQuestion(e.target.value)}
                onKeyDown={(e: DynamicStateObject) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    ask();
                  }
                }}
                className="w-full h-[120px] p-4 pb-14 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--ink)] focus:outline-none focus:border-[var(--primary)] placeholder-[var(--ink-muted)] resize-y leading-relaxed text-sm"
              />
              <div className="absolute bottom-3 right-3">
                <button 
                  className="btn py-2 px-4 flex items-center gap-2" 
                  onClick={ask} 
                  disabled={sending || !question.trim()}
                >
                  {sending ? "Thinking..." : "Send"} <Send size={15} className={sending ? "animate-pulse" : ""} />
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 flex items-center gap-2 text-[var(--alert)] text-xs font-medium bg-[var(--alert-dim)] border border-[var(--alert)] p-3 rounded-lg">
                <AlertTriangle size={16} /> {error}
              </div>
            )}
          </div>

          {/* History */}
          <div className="space-y-4">
            <h3 className="section-title">{t("recentGuidanceHistory") || "Recent Guidance History"}</h3>
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i: DynamicStateObject) => (
                  <div key={i} className="card animate-pulse h-32"></div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="card text-center p-12">
                <MessageSquare size={40} className="text-[var(--ink-muted)] mx-auto mb-3 opacity-40" />
                <h3 className="section-title mb-2">{t("noConversationHistoryYet") || "No conversation history yet"}</h3>
                <p className="text-xs text-[var(--ink-muted)]">{t("askAQuestionAboveToStartReceivingAIPoweredCareGuidance") || "Ask a question above to start receiving AI-powered care guidance."}</p>
              </div>
            ) : (
              history.map((item: DynamicStateObject) => (
                <div key={item.id} className="card space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-semibold text-sm text-[var(--ink)]">Q: {item.question}</h4>
                    <Badge value={item.urgencyLabel} />
                  </div>
                  <div className="text-xs text-[var(--ink-muted)] leading-relaxed bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
                    <LocalizedText text={item.answer} fallbackKey={item.answer} />
                  </div>
                  {item.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.suggestedActions.map((action: DynamicStateObject, idx: DynamicStateObject) => (
                        <span key={idx} className="status-tag confirmed">
                          {translateUiText(action)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
