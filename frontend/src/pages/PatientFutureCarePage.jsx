import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchAdaptiveTriage,
  fetchCopilotRecommendations,
  fetchDeteriorationInsight,
  fetchFollowUpAutopilot
} from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, Compass, TrendingDown, ClipboardList, Stethoscope, AlertTriangle, RefreshCw, Layers, Zap, Bot, CalendarClock } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientFutureCarePage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t, translateUiText = (value) => translateDisplayText(language, value) } = useLanguage();
  const patientId = auth?.profileId;
  
  const [deterioration, setDeterioration] = useState(null);
  const [copilot, setCopilot] = useState(null);
  const [adaptive, setAdaptive] = useState(null);
  const [autopilot, setAutopilot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!patientId) {
      setDeterioration(null);
      setCopilot(null);
      setAdaptive(null);
      setAutopilot(null);
      setError("Unable to load Future Care guidance.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [deteriorationRes, copilotRes, adaptiveRes, autopilotRes] = await Promise.allSettled([
        fetchDeteriorationInsight(patientId),
        fetchCopilotRecommendations(patientId),
        fetchAdaptiveTriage(patientId),
        fetchFollowUpAutopilot(patientId)
      ]);

      const nextDeterioration = deteriorationRes.status === "fulfilled" ? deteriorationRes.value : null;
      const nextCopilot = copilotRes.status === "fulfilled" ? copilotRes.value : null;
      const nextAdaptive = adaptiveRes.status === "fulfilled" ? adaptiveRes.value : null;
      const nextAutopilot = autopilotRes.status === "fulfilled" ? autopilotRes.value : null;

      setDeterioration(nextDeterioration);
      setCopilot(nextCopilot);
      setAdaptive(nextAdaptive);
      setAutopilot(nextAutopilot);

      if (!nextDeterioration && !nextCopilot && !nextAdaptive && !nextAutopilot) {
        setError(getApiErrorMessage(deteriorationRes.reason || copilotRes.reason || adaptiveRes.reason || autopilotRes.reason, "Unable to load Future Care guidance."));
      } else {
        setError("");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

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
              <h1 className="serif">Future Care</h1>
              <p>Predictive health insights and proactive follow-up plans.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Compass />Care Planning
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
                
                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton-pulse" style={{ height: '140px', borderRadius: '16px' }}></div>)}
                  </div>
                ) : error ? (
                  <div className="empty-state">
                    <AlertTriangle />
                    <h3>Unable to load insights</h3>
                    <p>{error}</p>
                    <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw /> Retry</button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* Deterioration Overview */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                         <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Deterioration Insights</h3>
                         <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                      </div>

                      {deterioration ? (
                        <>
                          <div className="doctors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                              <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Risk Score</p>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
                                <p style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>{deterioration.predictedScore}</p>
                                <p style={{ fontSize: '14px', color: 'var(--tct-text-secondary)' }}>/100</p>
                              </div>
                            </div>
                            <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                              <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Risk Profile</p>
                              <div style={{ marginTop: '12px' }}><Badge value={deterioration.predictedRiskLevel} /></div>
                            </div>
                            <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                              <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Shared Caregivers</p>
                              <p style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF', marginTop: '8px' }}>{deterioration.activeCaregiverCount}</p>
                            </div>
                            <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                              <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Abnormal Obs.</p>
                              <p style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF', marginTop: '8px' }}>{deterioration.abnormalObservationCount}</p>
                            </div>
                          </div>
                          
                          {deterioration.summary && (
                            <div className="doctor-card" style={{ cursor: 'default', padding: '20px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--tct-teal)' }}>
                              <p style={{ fontSize: '15px', lineHeight: '1.5', color: '#E2E8F0' }}>{deterioration.summary}</p>
                            </div>
                          )}

                          <div className="doctors-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                            <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingDown size={16} color="var(--tct-teal)" /> Contributing Factors
                              </h4>
                              {(deterioration.contributingFactors || []).length ? (
                                <div className="space-y-2">
                                  {(deterioration.contributingFactors || []).map((factor, idx) => (
                                    <p key={idx} style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>{translateDisplayText(language, factor)}</p>
                                  ))}
                                </div>
                              ) : <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)' }}>No contributing risk factors are available yet.</p>}
                            </div>
                            <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ClipboardList size={16} color="var(--tct-teal)" /> Recommended Actions
                              </h4>
                              {(deterioration.recommendedActions || []).length ? (
                                <div className="space-y-2">
                                  {(deterioration.recommendedActions || []).map((action, idx) => (
                                    <p key={idx} style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>{translateDisplayText(language, action)}</p>
                                  ))}
                                </div>
                              ) : <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)' }}>No recommended actions are available yet.</p>}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="empty-state">
                          <Layers />
                          <h3>No Deterioration Data</h3>
                          <p>We need more health observations to predict deterioration risks.</p>
                        </div>
                      )}
                    </div>

                    {/* Copilot Guidance */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                         <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>AI Copilot Guidance</h3>
                         <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                      </div>

                      {copilot ? (
                        <div className="doctor-card" style={{ cursor: 'default', padding: '32px' }}>
                          <div className="doctors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Patient Actions</h4>
                              {(copilot.patientActions || []).length ? (
                                <div className="space-y-3">
                                  {(copilot.patientActions || []).map((item, idx) => (
                                    <p key={idx} style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0' }}>• {translateDisplayText(language, item)}</p>
                                  ))}
                                </div>
                              ) : <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)' }}>No actions required.</p>}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Caregiver Actions</h4>
                              {(copilot.caregiverActions || []).length ? (
                                <div className="space-y-3">
                                  {(copilot.caregiverActions || []).map((item, idx) => (
                                    <p key={idx} style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0' }}>• {translateDisplayText(language, item)}</p>
                                  ))}
                                </div>
                              ) : <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)' }}>No actions required.</p>}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Doctor Actions</h4>
                              {(copilot.doctorActions || []).length ? (
                                <div className="space-y-3">
                                  {(copilot.doctorActions || []).map((item, idx) => (
                                    <p key={idx} style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0' }}>• {translateDisplayText(language, item)}</p>
                                  ))}
                                </div>
                              ) : <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)' }}>No actions required.</p>}
                            </div>
                          </div>
                          
                          {copilot.escalationDecision && (
                            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--tct-coral)', borderRadius: '8px' }}>
                              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--tct-coral)' }}>{copilot.escalationDecision}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <Bot />
                          <h3>No Copilot Guidance</h3>
                          <p>AI Copilot has no specific recommendations at this time.</p>
                        </div>
                      )}
                    </div>

                    <div className="doctors-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                      
                      {/* Adaptive Triage */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                           <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Adaptive Triage</h3>
                           <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                        </div>

                        {adaptive ? (
                          <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                            {adaptive.rationale && <p style={{ fontSize: '14px', color: 'var(--tct-teal)', fontWeight: '500', marginBottom: '16px' }}>{adaptive.rationale}</p>}
                            {(adaptive.questions || []).length ? (
                              <div className="space-y-3">
                                {(adaptive.questions || []).map((q, idx) => (
                                  <div key={idx} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--tct-panel-line-strong)' }}>
                                    <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0' }}>{translateDisplayText(language, q)}</p>
                                  </div>
                                ))}
                              </div>
                            ) : <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)' }}>No triage questions generated.</p>}
                          </div>
                        ) : (
                          <div className="empty-state" style={{ minHeight: '200px' }}>
                            <Zap />
                            <h3>No Triage Data</h3>
                            <p>Adaptive triage will appear here if health anomalies are detected.</p>
                          </div>
                        )}
                      </div>

                      {/* Follow-up Autopilot */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                           <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Follow-up Autopilot</h3>
                           <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                        </div>

                        {autopilot ? (
                          <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                              <div>
                                <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Next Follow-up</p>
                                <p style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF', marginTop: '4px' }}>{autopilot.nextFollowUpDate}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Urgency</p>
                                <p style={{ fontSize: '15px', fontWeight: '600', color: autopilot.urgencyLabel === 'HIGH' ? 'var(--tct-coral)' : 'var(--tct-teal)', marginTop: '4px' }}>{translateDisplayText(language, autopilot.urgencyLabel)}</p>
                              </div>
                            </div>

                            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Autopilot Tasks</h4>
                            <div className="space-y-2 mb-6">
                              {(autopilot.tasks || []).map((task, idx) => (
                                <p key={idx} style={{ fontSize: '14px', lineHeight: '1.5', color: '#E2E8F0', display: 'flex', gap: '8px' }}>
                                  <span style={{ color: 'var(--tct-teal)' }}>•</span> {translateDisplayText(language, task)}
                                </p>
                              ))}
                            </div>

                            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--tct-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Reasons</h4>
                            <div className="space-y-2">
                              {(autopilot.reasons || []).map((reason, idx) => (
                                <p key={idx} style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--tct-text-secondary)', display: 'flex', gap: '8px' }}>
                                  <span style={{ opacity: 0.5 }}>-</span> {translateDisplayText(language, reason)}
                                </p>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="empty-state" style={{ minHeight: '200px' }}>
                            <CalendarClock />
                            <h3>No Follow-up Plan</h3>
                            <p>Automated follow-up scheduling is not active right now.</p>
                          </div>
                        )}
                      </div>

                    </div>
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
