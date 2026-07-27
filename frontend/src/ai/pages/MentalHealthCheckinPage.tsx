import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Brain, User, LogOut } from "lucide-react";
import { MentalHealthIllustration } from "../../components/illustrations/CareIllustrations";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { runMentalHealthAssessment, sendMentalHealthChat } from "../services/aiService";
import { getApiErrorMessage } from "../../utils/apiError";
import PatientSidebar from "../../components/PatientSidebar";
import { buildLoginRedirect } from "../../utils/authSession";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../../types/DynamicState";

const moodOptions = [
  { label: "Very low", emoji: "Low", value: "very-low", tone: "danger" },
  { label: "Low", emoji: "Soft", value: "low", tone: "warning" },
  { label: "Okay", emoji: "Steady", value: "okay", tone: "info" },
  { label: "Good", emoji: "Bright", value: "good", tone: "success" },
  { label: "Great", emoji: "Calm", value: "great", tone: "success" }
];

const initialForm = {
  mood: "",
  stress: 4,
  anxiety: 4,
  notes: ""
};

export default function MentalHealthCheckinPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [step, setStep] = useState<DynamicState>(0);
  const [form, setForm] = useState<DynamicState>(initialForm);
  const [messages, setMessages] = useState<DynamicStateObject[]>([]);
  const [status, setStatus] = useState<DynamicState>("");
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(false);

  const steps = useMemo(() => ([
    {
      key: "mood",
      title: "How are you feeling today?",
      description: "Choose the option that matches your overall mood."
    },
    {
      key: "stress",
      title: "How stressed do you feel right now?",
      description: "0 means calm, 10 means overwhelming."
    },
    {
      key: "anxiety",
      title: "How anxious do you feel right now?",
      description: "0 means relaxed, 10 means intense worry."
    },
    {
      key: "notes",
      title: "Anything you want to share?",
      description: "A few words are enough. This is optional but useful."
    }
  ]), []);

  const currentStep = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const goNext = () => {
    if (currentStep.key === "mood" && !form.mood) {
      setError("Choose a mood to continue.");
      return;
    }
    setError("");
    setStep((current: DynamicStateObject) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setError("");
    setStep((current: DynamicStateObject) => Math.max(current - 1, 0));
  };

  const submitCheckin = async () => {
    const summary = `Mood: ${form.mood || "not selected"}, Stress: ${form.stress}/10, Anxiety: ${form.anxiety}/10. Notes: ${form.notes || "No additional notes."}`;
    setLoading(true);
    setError("");

    try {
      const [chat, assessment] = await Promise.all([
        sendMentalHealthChat({ message: summary, sessionId: "" }),
        runMentalHealthAssessment({ text: summary })
      ]);

      setMessages([
        { role: "assistant", text: chat.response },
        ...(Array.isArray(chat.suggestions) ? chat.suggestions.map((item: DynamicStateObject) => ({ role: "assistant", text: item })) : []),
        { role: "assistant", text: assessment.guidance }
      ]);
      setStatus(`Risk level: ${assessment.riskLevel}`);
    } catch (err: DynamicStateObject) {
      setError(getApiErrorMessage(err, "Unable to load mental health guidance."));
    } finally {
      setLoading(false);
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
              <h1 className="serif">{t("mentalHealthCheckIn") || "Mental Health Check-in"}</h1>
              <p>{t("trackYourWellBeingWithDailyStructuredReflections") || "Track your well-being with daily structured reflections."}</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Brain />{t("support") || "Support"}</div>
              <div className="signed-in" style={{ marginTop: '12px', marginLeft: '8px' }}>
                <User />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <button className="btn-ghost" onClick={handleLogout} aria-label="Log out">
                <LogOut />{t("logout") || "Logout"}</button>
            </div>
          </div>

          <div className="flex flex-col">
            <div style={{ flex: 1, padding: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              
              <div className="tct-animate-in">
                
                {/* Guided Flow */}
                <div className="glass-card" style={{ cursor: 'default', padding: '0', overflow: 'hidden' }}>
                  
                  {/* Header / Graphic */}
                  <div style={{ background: 'var(--tct-panel)', borderBottom: '1px solid var(--tct-panel-line-strong)', padding: '32px' }}>
                    <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 180px', gap: '32px', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tct-teal)' }}>
                          Step {step + 1} of {steps.length}
                        </p>
                        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#FFFFFF', marginTop: '8px', marginBottom: '8px' }}>{currentStep.title}</h2>
                        <p style={{ fontSize: '15px', color: 'var(--tct-text-secondary)', lineHeight: '1.5', maxWidth: '600px' }}>{currentStep.description}</p>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                          <span style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', color: 'var(--tct-text-muted)', borderRadius: '100px', fontWeight: '600' }}>{progress}% Complete</span>
                          <span style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--tct-teal-dim)', color: 'var(--tct-teal)', borderRadius: '100px', fontWeight: '600' }}>{t("privateSecure") || "Private & Secure"}</span>
                        </div>
                      </div>
                      <div style={{ margin: '0 auto', opacity: 0.8 }}>
                        <MentalHealthIllustration />
                      </div>
                    </div>

                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden', marginTop: '32px' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'var(--tct-teal)', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '32px' }}>
                    
                    {currentStep.key === "mood" ? (
                      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                        {moodOptions.map((option: DynamicStateObject) => (
                          <button
                            key={option.value}
                            onClick={() => setForm((c: DynamicStateObject) => ({...c, mood: option.value}))}
                            style={{
                              padding: '24px 16px',
                              background: form.mood === option.value ? 'var(--tct-teal-dim)' : 'rgba(255,255,255,0.02)',
                              border: form.mood === option.value ? '1px solid var(--tct-teal)' : '1px solid var(--tct-panel-line-strong)',
                              borderRadius: '16px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              outline: 'none',
                              color: form.mood === option.value ? 'var(--tct-teal)' : '#FFFFFF'
                            }}
                          >
                            <div style={{ 
                              display: 'inline-flex', padding: '4px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', marginBottom: '16px',
                              background: option.tone === 'danger' ? 'rgba(239, 68, 68, 0.1)' : option.tone === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                              color: option.tone === 'danger' ? 'var(--tct-coral)' : option.tone === 'warning' ? '#C9A24B' : 'var(--tct-text-secondary)'
                            }}>
                              {option.emoji}
                            </div>
                            <p style={{ fontSize: '16px', fontWeight: '600' }}>{option.label}</p>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {currentStep.key === "stress" || currentStep.key === "anxiety" ? (
                      <div style={{ padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--tct-text-muted)', fontSize: '14px', fontWeight: '500', marginBottom: '24px' }}>
                          <span>0 - Calm</span>
                          <span style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>{(form as DynamicStateObject)[currentStep.key]}/10</span>
                          <span>10 - Intense</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={(form as DynamicStateObject)[currentStep.key]}
                          onChange={(e: DynamicStateObject) => setForm((c: DynamicStateObject) => ({...c, [currentStep.key]: Number(e.target.value)}))}
                          style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--tct-teal)' }}
                        />
                      </div>
                    ) : null}

                    {currentStep.key === "notes" ? (
                      <div>
                        <textarea
                          placeholder="Share anything that may help your care team understand today better."
                          value={form.notes}
                          onChange={(e: DynamicStateObject) => setForm((c: DynamicStateObject) => ({...c, notes: e.target.value}))}
                          style={{
                            width: '100%', minHeight: '160px', padding: '16px', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px', color: '#FFFFFF', fontSize: '15px', resize: 'vertical', outline: 'none', lineHeight: '1.5'
                          }}
                        />
                      </div>
                    ) : null}

                    {error && <p style={{ fontSize: '14px', color: 'var(--tct-coral)', marginTop: '16px', fontWeight: '500' }}>{error}</p>}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px' }}>
                      <button className="btn-secondary" disabled={step === 0 || loading} onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowLeft size={16} /> {t("back") || "Back"}</button>
                      
                      {step < steps.length - 1 ? (
                        <button className="btn-primary" onClick={goNext} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {t("continue") || "Continue"}<ArrowRight size={16} />
                        </button>
                      ) : (
                        <button className="btn-primary" onClick={submitCheckin} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {loading ? "Saving..." : "Save check-in"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* History & AI Guidance */}
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px', alignItems: 'start' }}>
                  
                  {/* Mood Pattern */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                       <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>{t("moodHistorySnapshot") || "Mood History Snapshot"}</h3>
                       <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                    </div>
                    
                    <div className="glass-card" style={{ cursor: 'default', padding: '24px' }}>
                      
                      <div style={{ display: 'flex', height: '140px', alignItems: 'flex-end', gap: '12px', marginBottom: '24px' }}>
                        {[42, 54, 46, 68, 58, 72, 64].map((value: string | number, idx: DynamicStateObject) => (
                          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '100%', height: `${value}%`, background: idx === 6 ? 'var(--tct-teal)' : 'rgba(255,255,255,0.1)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: idx === 6 ? 'var(--tct-teal)' : 'var(--tct-text-muted)' }}>
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--tct-teal)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-teal)', marginBottom: '8px' }}>{t("patternInsight") || "Pattern Insight"}</p>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0' }}>{t("stressTendsToRiseMidWeekCompletingAShortCheckInEarlierInTheDayCanHelpUsSpotPatternsFaster") || "Stress tends to rise mid-week. Completing a short check-in earlier in the day can help us spot patterns faster."}</p>
                      </div>

                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid var(--tct-coral)', padding: '16px', borderRadius: '8px' }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--tct-coral)', marginBottom: '8px' }}>{t("supportPrompt") || "Support Prompt"}</p>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0' }}>{t("ifYouAreFeelingOverwhelmedOrUnsafeContactYourDoctorOrTrustedCaregiverImmediately") || "If you are feeling overwhelmed or unsafe, contact your doctor or trusted caregiver immediately."}</p>
                      </div>

                    </div>
                  </div>

                  {/* AI Output */}
                  {(status || messages.length > 0) && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                         <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>{t("aIGuidance") || "AI Guidance"}</h3>
                         <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                      </div>

                      <div className="glass-card" style={{ cursor: 'default', padding: '24px' }}>
                        {status && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--tct-teal)' }}>{status}</span>
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          {messages.map((msg: DynamicStateObject, idx: DynamicStateObject) => (
                            <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--tct-panel-line-strong)', borderRadius: '12px' }}>
                              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#E2E8F0' }}>{msg.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
