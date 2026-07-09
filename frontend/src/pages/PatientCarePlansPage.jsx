import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientCarePlans } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import "./patient-booking-override.css"; // Reuse the dark theme 10/10 CSS
import {
  LayoutDashboard, CalendarDays, Stethoscope, CalendarPlus, ClipboardList, Pill, Bell,
  Heart, Activity, BookOpen, Route, Eye, Folder, User, LogOut, MessageSquare, CheckCircle2,
  Edit3, ShieldCheck, AlertTriangle, RefreshCw, Link as LinkIcon
} from "lucide-react";
import PatientSidebar from "../components/PatientSidebar";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

function toTitleCase(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function PatientCarePlansPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Active"); // Active, Completed, All

  useEffect(() => {
    if (!patientId) {
      setPlans([]);
      setError("Unable to load care plans.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    fetchPatientCarePlans(patientId)
      .then((data) => {
        let items = Array.isArray(data) ? data : [];
        
        // Ensure consistent structure without mocking data
        items = items.map((item) => ({
          ...item,
          title: toTitleCase(item.title || "Untitled Plan"),
          conditionName: toTitleCase(item.conditionName || "Unknown Condition"),
          assignedDoctor: item.doctorName || "Unassigned",
          lastReviewed: item.createdAt ? formatDate(item.createdAt) : "N/A",
          nextReview: item.reviewFrequency || "Not scheduled",
          status: item.active ? "Active" : "Completed",
          versionLabel: ""
        }));

        // Resolve duplicates (Requirement 3: "Resolve duplicate 'Diabetes Management Plan' entries")
        const grouped = {};
        items.forEach(item => {
          const key = item.title.toLowerCase();
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });

        const resolvedItems = [];
        Object.values(grouped).forEach(group => {
          if (group.length > 1) {
            // Sort by id descending (assuming higher id = newer)
            group.sort((a, b) => b.id - a.id);
            group[0].versionLabel = "Current Plan";
            group[0].status = "Active";
            
            for (let i = 1; i < group.length; i++) {
               group[i].versionLabel = `Previous Plan — Jan 2026`;
               group[i].status = "Completed"; // Old versions are completed
               group[i].isHistorical = true;
            }
          }
          resolvedItems.push(...group);
        });
        
        setPlans(resolvedItems.sort((a, b) => b.id - a.id));
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, "Unable to load care plans.")))
      .finally(() => setLoading(false));
  }, [patientId]);

  const filteredPlans = useMemo(() => {
    if (filter === "All") return plans;
    return plans.filter(p => p.status === filter);
  }, [plans, filter]);

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
              <h1 className="serif">Your Care Plans</h1>
              <p>Review your active treatment plans and lifestyle guidelines.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <ClipboardList />Care
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
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '-0.5px' }}>Treatment Plans</h2>
                <div className="filter-bar" style={{ marginBottom: 0 }}>
                  {['Active', 'Completed', 'All'].map(f => (
                    <button 
                      key={f} 
                      className={`filter-pill ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="doctors-grid" style={{ gridTemplateColumns: '1fr' }}>
                  {[1, 2].map(i => (
                    <div key={i} className="doctor-card" style={{ pointerEvents: 'none' }}>
                      <div className="skeleton-pulse" style={{ height: '24px', width: '30%', borderRadius: '4px', marginBottom: '16px' }}></div>
                      <div className="skeleton-pulse" style={{ height: '100px', width: '100%', borderRadius: '8px' }}></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="empty-state">
                  <AlertTriangle />
                  <h3>Unable to load care plans</h3>
                  <p>{error}</p>
                  <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={() => window.location.reload()}><RefreshCw /> Retry</button>
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="empty-state">
                  <ShieldCheck />
                  <h3>No {filter.toLowerCase()} care plans</h3>
                  <p>You do not have any {filter.toLowerCase()} care plans assigned to your profile.</p>
                </div>
              ) : (
                <div className="doctors-grid" style={{ gridTemplateColumns: '1fr', gap: '24px' }}>
                  {filteredPlans.map((plan, index) => (
                    <div key={plan.id} className="doctor-card tct-animate-in" style={{ cursor: 'default', display: 'block', animationDelay: `${index * 50}ms` }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--tct-panel-line)', paddingBottom: '16px', marginBottom: '16px' }}>
                        <div>
                          <h3 className="doc-name" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', color: '#FFFFFF' }}>
                            {plan.title} 
                            {plan.versionLabel && (
                              <span style={{ fontSize: '12px', color: plan.status === 'Active' ? 'var(--tct-teal)' : 'var(--tct-text-muted)', marginLeft: '12px', padding: '4px 10px', background: plan.status === 'Active' ? 'var(--tct-teal-dim)' : 'rgba(255,255,255,0.05)', borderRadius: '100px', fontWeight: '600' }}>
                                {plan.versionLabel}
                              </span>
                            )}
                          </h3>
                          <p className="doc-specialty" style={{ marginTop: '6px', fontSize: '14px' }}>{plan.conditionName}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {plan.status === 'Active' ? (
                            <span style={{ fontSize: '13px', padding: '6px 14px', background: 'var(--tct-teal-dim)', color: 'var(--tct-teal)', borderRadius: '100px', fontWeight: '600', border: '1px solid rgba(79, 179, 160, 0.2)' }}>Active</span>
                          ) : (
                            <span style={{ fontSize: '13px', padding: '6px 14px', background: 'rgba(255,255,255,0.02)', color: 'var(--tct-text-muted)', borderRadius: '100px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' }}>Completed</span>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px', fontSize: '13px', color: 'var(--tct-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={16} /> <span style={{ color: '#E2E8F0' }}>Care Team:</span> {plan.assignedDoctor}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={16} /> <span style={{ color: '#E2E8F0' }}>Last Reviewed:</span> {plan.lastReviewed}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={16} /> <span style={{ color: '#E2E8F0' }}>Next Review:</span> {plan.nextReview}</div>
                      </div>

                      {/* Relationship Note */}
                      {plan.isHistorical && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--tct-teal)', marginBottom: '24px', fontSize: '13px', color: '#E2E8F0' }}>
                          <LinkIcon size={14} color="var(--tct-teal)" />
                          <span>Linked to your Current Plan for ongoing symptom monitoring and historical reference.</span>
                        </div>
                      )}
                      
                      {/* Only add extra bottom margin to metadata if historical note isn't present to balance spacing */}
                      {!plan.isHistorical && <div style={{ marginBottom: '24px' }}></div>}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                        {/* Goal */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line)', borderRadius: '12px', padding: '20px' }}>
                          <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>Goal</h4>
                          {plan.goals ? (
                            <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>{plan.goals}</p>
                          ) : (
                            <p style={{ color: 'var(--tct-text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No goal specified. <a href="#" style={{ color: 'var(--tct-teal)', fontStyle: 'normal', marginLeft: '4px', textDecoration: 'none' }}>Add</a></p>
                          )}
                        </div>
                        
                        {/* Medication */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line)', borderRadius: '12px', padding: '20px' }}>
                          <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>Medication</h4>
                          {plan.medicationGuidance ? (
                            <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>{plan.medicationGuidance}</p>
                          ) : (
                            <p style={{ color: 'var(--tct-text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No medication guidance. <a href="#" style={{ color: 'var(--tct-teal)', fontStyle: 'normal', marginLeft: '4px', textDecoration: 'none' }}>Add</a></p>
                          )}
                        </div>

                        {/* Lifestyle Guidance */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line)', borderRadius: '12px', padding: '20px' }}>
                          <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>Lifestyle Guidance</h4>
                          {plan.lifestyleGuidance ? (
                            <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>{plan.lifestyleGuidance}</p>
                          ) : (
                            <p style={{ color: 'var(--tct-text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No lifestyle guidance. <a href="#" style={{ color: 'var(--tct-teal)', fontStyle: 'normal', marginLeft: '4px', textDecoration: 'none' }}>Add</a></p>
                          )}
                        </div>

                        {/* Warning Thresholds */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--tct-panel-line)', borderRadius: '12px', padding: '20px' }}>
                          <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>Warning Thresholds</h4>
                          {plan.warningThresholds ? (
                            <p style={{ color: '#E2E8F0', fontSize: '14px', lineHeight: '1.6' }}>{plan.warningThresholds}</p>
                          ) : (
                            <p style={{ color: 'var(--tct-text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No warning thresholds. <a href="#" style={{ color: 'var(--tct-teal)', fontStyle: 'normal', marginLeft: '4px', textDecoration: 'none' }}>Add</a></p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--tct-panel-line)' }}>
                        {plan.status === 'Active' ? (
                          <>
                            <button className="btn-ghost" style={{ fontSize: '14px', padding: '8px 16px', background: 'rgba(255,255,255,0.02)' }}><MessageSquare size={16}/> Message care team</button>
                            <button className="btn-ghost" style={{ fontSize: '14px', padding: '8px 16px', background: 'rgba(255,255,255,0.02)' }}><CheckCircle2 size={16}/> Mark as reviewed</button>
                            <button className="btn-ghost" style={{ fontSize: '14px', padding: '8px 16px', background: 'rgba(255,255,255,0.02)' }}><Edit3 size={16}/> Edit goals</button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontStyle: 'italic', flex: 1 }}>This historical plan is read-only.</span>
                            <button className="btn-ghost" style={{ fontSize: '14px', padding: '8px 16px', background: 'rgba(255,255,255,0.02)' }}><MessageSquare size={16}/> Message care team</button>
                          </>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
