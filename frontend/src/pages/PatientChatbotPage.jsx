import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { askChatbotQuestion, fetchChatbotHistory } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, MessageSquare, Send, RefreshCw, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

function normalizeChatbotEntry(entry, fallbackAnswer) {
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
      ? entry.suggestedActions.filter((item) => typeof item === "string" && item.trim())
      : []
  };
}

export default function PatientChatbotPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fallbackAnswer = translateUiText("Guidance is temporarily unavailable. Please review your symptoms with your doctor or try again shortly.");

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
      const normalizedHistory = Array.isArray(data) ? data.map((entry) => normalizeChatbotEntry(entry, fallbackAnswer)) : [];
      setHistory(normalizedHistory);
      setError("");
    } catch (err) {
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
      setHistory((current) => [normalizedResponse, ...current]);
      setQuestion("");
      setError("");
    } catch (err) {
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
    <div id="tct-root">
      <div className="app">
        <PatientSidebar />
        
        <main id="page-main" role="main">
          <div className="topbar">
            <div>
              <h1 className="serif">AI Chatbot</h1>
              <p>24/7 intelligent continuity care assistant.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <MessageSquare />Support
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
              
              <div className="tct-animate-in">
                
                {/* Chat Input */}
                <div className="doctor-card" style={{ cursor: 'default', padding: '32px', marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Zap size={20} color="var(--tct-teal)" />
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Ask the Care Assistant</h3>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
                        This assistant supports continuity care using the record on file. It is not a diagnosis service and does not replace clinician review or emergency care.
                      </p>
                      
                      <div style={{ position: 'relative' }}>
                        <textarea
                          placeholder="How can I help you today?"
                          value={question}
                          onChange={e => setQuestion(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              ask();
                            }
                          }}
                          style={{
                            width: '100%', minHeight: '120px', padding: '16px', paddingBottom: '60px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line-strong)',
                            borderRadius: '12px', color: '#FFFFFF', fontSize: '15px', resize: 'vertical', outline: 'none', lineHeight: '1.5'
                          }}
                        />
                        <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                          <button 
                            className="btn-primary" 
                            onClick={ask} 
                            disabled={sending || !question.trim()}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                          >
                            {sending ? "Thinking..." : "Send"} <Send size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {error && (
                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tct-coral)', fontSize: '13px', fontWeight: '500' }}>
                          <AlertTriangle size={16} /> {error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* History */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                   <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Chat History</h3>
                   <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                </div>

                {loading && !history.length ? (
                  <div className="space-y-6">
                    {[1,2,3].map(i => <div key={i} className="skeleton-pulse" style={{ height: '160px', borderRadius: '16px' }}></div>)}
                  </div>
                ) : !loading && !history.length ? (
                  <div className="empty-state">
                    <MessageSquare />
                    <h3>No Chat History</h3>
                    <p>Ask a question to see guidance here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {history.map(entry => (
                      <div key={entry.id} className="doctor-card" style={{ cursor: 'default', padding: '0', overflow: 'hidden' }}>
                        
                        {/* User Question */}
                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--tct-panel-line)' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                            <div>
                              <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-text-muted)', marginBottom: '8px' }}>You Asked</p>
                              <LocalizedText as="p" style={{ fontSize: '16px', fontWeight: '500', color: '#FFFFFF', lineHeight: '1.5' }} value={entry.question || "No question recorded."} />
                            </div>
                            <div style={{ flexShrink: 0 }}>
                              <Badge value={entry.urgencyLabel} />
                            </div>
                          </div>
                        </div>

                        {/* AI Response */}
                        <div style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <ShieldCheck size={20} color="var(--tct-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-teal)', marginBottom: '8px' }}>Care Assistant</p>
                              <LocalizedText as="div" style={{ fontSize: '15px', color: '#E2E8F0', lineHeight: '1.6' }} value={entry.answer} />
                              
                              {entry.suggestedActions?.length > 0 && (
                                <div style={{ marginTop: '24px' }}>
                                  <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-text-muted)', marginBottom: '12px' }}>Suggested Actions</p>
                                  <div className="space-y-2">
                                    {entry.suggestedActions.map((action, idx) => (
                                      <div key={idx} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--tct-panel-line-strong)' }}>
                                        <LocalizedText as="p" style={{ fontSize: '14px', color: 'var(--tct-text-secondary)', lineHeight: '1.5' }} value={action} />
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

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
