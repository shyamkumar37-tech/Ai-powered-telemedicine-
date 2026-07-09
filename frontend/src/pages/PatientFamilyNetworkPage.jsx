import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPatientFamilyNetwork } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, Users, HeartHandshake, ShieldAlert, RefreshCw, Network, ClipboardList, Plus } from "lucide-react";
import Button from "../components/ui/Button";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientFamilyNetworkPage() {
  const { auth, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const patientId = auth?.profileId;
  
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!patientId) {
      setNetwork(null);
      setError("Unable to load family network.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPatientFamilyNetwork(patientId);
      setNetwork(data);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load family network."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const filteredCaregivers = useMemo(() => {
    return network?.caregivers || [];
  }, [network?.caregivers]);

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
              <h1 className="serif">Family Network</h1>
              <p>Manage shared caregivers and coordination summaries.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Users />Community
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
              
              {loading ? (
                <div className="doctors-grid" style={{ gridTemplateColumns: '1fr', marginTop: '24px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="doctor-card" style={{ pointerEvents: 'none', height: '100px' }}>
                      <div className="skeleton-pulse" style={{ height: '24px', width: '30%', borderRadius: '4px', marginBottom: '16px' }}></div>
                      <div className="skeleton-pulse" style={{ height: '16px', width: '60%', borderRadius: '4px' }}></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="empty-state">
                  <ShieldAlert />
                  <h3>Unable to load family network</h3>
                  <p>{error}</p>
                  <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw /> Retry</button>
                </div>
              ) : network && (
                <div className="space-y-8">
                  {/* Stats Row */}
                  <div className="doctors-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient</p>
                      <p style={{ marginTop: '8px', fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>{network.patientName}</p>
                    </div>
                    <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shared Caregivers</p>
                      <p style={{ marginTop: '8px', fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>{filteredCaregivers.length}</p>
                    </div>
                    <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Network Status</p>
                      <p style={{ marginTop: '8px', fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>{network.multiCaregiverSupport ? "Shared Support" : "Single Support"}</p>
                    </div>
                  </div>

                  <div className="doctors-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                    
                    {/* Shared Caregivers Column */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                         <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Shared Caregivers</h3>
                         <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                      </div>
                      
                      {filteredCaregivers.length === 0 ? (
                        <div className="empty-state" style={{ minHeight: '200px' }}>
                          <Network />
                          <h3>No Caregiver Network</h3>
                          <p>Caregivers will appear here once they are linked to your profile.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredCaregivers.map(caregiver => (
                            <div key={caregiver.caregiverId} className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--tct-teal-dim)', color: 'var(--tct-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                                  {caregiver.caregiverName?.charAt(0) || "C"}
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>{caregiver.caregiverName}</h4>
                                  <p style={{ fontSize: '13px', color: 'var(--tct-teal)', fontWeight: '500', marginTop: '2px' }}>{translateDisplayText(language, caregiver.relationshipLabel || "Caregiver")}</p>
                                  <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', marginTop: '4px' }}>{caregiver.phone}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Coordination Summary Column */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                         <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Coordination Summary</h3>
                         <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                      </div>
                      
                      {(!network.coordinationNote && !network.escalationAdvice) || (network.coordinationNote?.toLowerCase().includes("test") && network.escalationAdvice?.toLowerCase().includes("test")) ? (
                         <div className="empty-state" style={{ minHeight: '200px' }}>
                           <ClipboardList />
                           <h3>No Active Coordination</h3>
                           <p>No coordination summaries or escalation advice have been set for your network yet.</p>
                           <button className="btn-primary" style={{ marginTop: '16px' }}>Request Update</button>
                         </div>
                      ) : (
                        <div className="space-y-4">
                          {network.coordinationNote && !network.coordinationNote.toLowerCase().includes("test") && (
                            <div className="doctor-card" style={{ cursor: 'default', padding: '24px' }}>
                              <h4 style={{ fontSize: '13px', color: 'var(--tct-text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Care Note</h4>
                              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#E2E8F0' }}>{translateDisplayText(language, network.coordinationNote)}</p>
                            </div>
                          )}
                          {network.escalationAdvice && !network.escalationAdvice.toLowerCase().includes("test") && (
                            <div className="doctor-card" style={{ cursor: 'default', padding: '24px', borderLeft: '4px solid var(--tct-coral)' }}>
                              <h4 style={{ fontSize: '13px', color: 'var(--tct-coral)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Escalation Advice</h4>
                              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#E2E8F0' }}>{translateDisplayText(language, network.escalationAdvice)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
