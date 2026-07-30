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
import { User, LogOut, MessageSquare, Send, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
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
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />
      
      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("aIChatbot") || "AI Chatbot"}</h1>
            <p className="text-ink-muted text-sm mb-3">24/7 intelligent continuity care assistant.</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <MessageSquare size={12} className="text-primary" />{t("support") || "Support"}</span>
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

        <div className="max-w-4xl animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          
          {/* Chat Input */}
          <div className="card-premium mb-10">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="flex-1 w-full min-w-0">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={20} className="text-primary" />
                  <h3 className="font-display text-lg font-medium">{t("askTheCareAssistant") || "Ask the Care Assistant"}</h3>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed mb-6">
                  {t("thisAssistantSupportsContinuityCareUsingTheRecordOnFileItIsNotADiagnosisServiceAndDoesNotReplaceClinicianReviewOrEmergencyCare") || "This assistant supports continuity care using the record on file. It is not a diagnosis service and does not replace clinician review or emergency care."}</p>
                
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/0 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
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
                      className="w-full h-[140px] p-4 pb-16 bg-surface border border-white/10 rounded-xl text-ink focus:outline-none focus:border-primary/50 placeholder-ink-muted/50 resize-y transition-colors leading-relaxed"
                    />
                    <div className="absolute bottom-4 right-4">
                      <button 
                        className="btn-primary py-2 px-4 flex items-center gap-2" 
                        onClick={ask} 
                        disabled={sending || !question.trim()}
                      >
                        {sending ? "Thinking..." : "Send"} <Send size={16} className={sending ? "animate-pulse" : ""} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="mt-4 flex items-center gap-2 text-alert text-sm font-medium bg-alert/10 border border-alert/20 p-3 rounded-element">
                    <AlertTriangle size={16} /> {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="flex items-center gap-4 mb-6">
             <h3 className="font-display text-xl font-medium">{t("chatHistory") || "Chat History"}</h3>
             <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {loading && !history.length ? (
            <div className="flex flex-col gap-6">
              {[1,2,3].map((i: DynamicStateObject) => <div key={i} className="card-premium h-40 animate-pulse bg-white/5"></div>)}
            </div>
          ) : !loading && !history.length ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed">
              <MessageSquare size={48} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">{t("noChatHistory") || "No Chat History"}</h3>
              <p className="text-sm text-ink-muted max-w-sm">{t("askAQuestionAboveToSeeGuidanceHere") || "Ask a question above to see guidance here."}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {history.map((entry: DynamicStateObject) => (
                <div key={entry.id} className="card-premium !p-0 !bg-surface hover:border-white/20 transition-colors">
                  
                  {/* User Question */}
                  <div className="p-6 bg-white/5 border-b border-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-2">{t("youAsked") || "You Asked"}</p>
                        <LocalizedText as="p" className="text-base font-medium text-ink leading-relaxed" value={entry.question || "No question recorded."} />
                      </div>
                      <div className="shrink-0 mt-1">
                        <Badge value={entry.urgencyLabel} />
                      </div>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="p-6">
                    <div className="flex gap-4">
                      <ShieldCheck size={24} className="text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2">{t("careAssistant") || "Care Assistant"}</p>
                        <LocalizedText as="div" className="text-[15px] text-ink-muted leading-relaxed" value={entry.answer} />
                        
                        {entry.suggestedActions?.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-white/5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-3">{t("suggestedActions") || "Suggested Actions"}</p>
                            <div className="flex flex-col gap-2">
                              {entry.suggestedActions.map((action: DynamicStateObject, idx: DynamicStateObject) => (
                                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm text-ink-muted leading-relaxed">
                                  <LocalizedText as="p" value={action} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
