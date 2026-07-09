import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { disableBackgroundAlerts, enableBackgroundAlerts, getPushStatus } from "../services/pushService";
import { fetchPatientAlerts, subscribeToPatientAlertStream } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { notifyBrowser, requestBrowserNotificationPermission } from "../utils/browserNotifications";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import "./patient-booking-override.css";
import { User, LogOut, Bell, ShieldAlert, Check, RefreshCw, Layers } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PatientAlertsPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const patientId = auth?.profileId;
  
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pushState, setPushState] = useState({ loading: true, supported: true, subscribed: false, configured: true, message: "" });
  const [filter, setFilter] = useState("All"); // All or Unread
  const [readAlertIds, setReadAlertIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`telecareplus-read-alerts-${patientId}`)) || []; } 
    catch { return []; }
  });

  const load = async () => {
    if (!patientId) {
      setAlerts([]);
      setError("Unable to load notifications.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPatientAlerts(patientId);
      setAlerts(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load notifications."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  useEffect(() => {
    getPushStatus()
      .then((status) => {
        setPushState({ loading: false, supported: status.supported, subscribed: status.subscribed, configured: status.configured, message: "" });
      })
      .catch(() => {
        setPushState({ loading: false, supported: false, subscribed: false, configured: false, message: "" });
      });
  }, []);

  useEffect(() => {
    if (!patientId) return () => {};
    const unsubscribe = subscribeToPatientAlertStream(
      patientId,
      (alert) => {
        setAlerts((current) => [alert, ...current.filter((item) => item.id !== alert.id)]);
        setError("");
        if (!pushState.subscribed) {
          notifyBrowser("Notification Center", translateDisplayText(language, alert.message));
        }
      },
      () => {}
    );
    return unsubscribe;
  }, [language, patientId, pushState.subscribed]);

  const handlePushToggle = async () => {
    setPushState((current) => ({ ...current, loading: true, message: "" }));
    try {
      if (pushState.subscribed) {
        await disableBackgroundAlerts();
        setPushState((current) => ({ ...current, loading: false, subscribed: false, message: "Background alerts disabled" }));
      } else {
        await enableBackgroundAlerts();
        setPushState((current) => ({ ...current, loading: false, subscribed: true, supported: true, configured: true, message: "Background alerts enabled" }));
      }
    } catch (err) {
      setPushState((current) => ({ ...current, loading: false, message: getApiErrorMessage(err, "Unable to update background alerts") }));
    }
  };

  const toggleReadStatus = (id) => {
    let nextReadIds;
    if (readAlertIds.includes(id)) {
      nextReadIds = readAlertIds.filter(x => x !== id);
    } else {
      nextReadIds = [...readAlertIds, id];
    }
    setReadAlertIds(nextReadIds);
    try { localStorage.setItem(`telecareplus-read-alerts-${patientId}`, JSON.stringify(nextReadIds)); } catch {}
  };

  const markAllAsRead = () => {
    const allIds = alerts.map(a => a.id);
    const nextReadIds = [...new Set([...readAlertIds, ...allIds])];
    setReadAlertIds(nextReadIds);
    try { localStorage.setItem(`telecareplus-read-alerts-${patientId}`, JSON.stringify(nextReadIds)); } catch {}
  };

  const filteredAlerts = useMemo(() => {
    if (filter === "Unread") return alerts.filter(a => !readAlertIds.includes(a.id));
    return alerts;
  }, [alerts, filter, readAlertIds]);

  const unreadCount = alerts.filter(a => !readAlertIds.includes(a.id)).length;

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
              <h1 className="serif">Notification Center</h1>
              <p>Review and manage your critical health alerts.</p>
              <div className="eyebrow-pill" style={{ marginTop: '12px' }}>
                <Bell />Alerts
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                   <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Preferences</h3>
                   <div style={{ flex: 1, height: '1px', background: 'var(--tct-panel-line)' }}></div>
                </div>
                
                <div className="doctor-card" style={{ cursor: 'default', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>Background Notifications</h4>
                    <p style={{ fontSize: '13px', color: 'var(--tct-text-secondary)', marginTop: '4px' }}>Receive OS-level notifications even when the app is closed.</p>
                    
                    {!pushState.supported && <p style={{ fontSize: '12px', color: 'var(--tct-coral)', marginTop: '8px' }}>Your browser does not support background push notifications.</p>}
                    {pushState.supported && !pushState.configured && <p style={{ fontSize: '12px', color: 'var(--tct-coral)', marginTop: '8px' }}>Push notifications are currently unavailable in your region.</p>}
                    {pushState.message && <p style={{ fontSize: '12px', color: 'var(--tct-teal)', marginTop: '8px' }}>{pushState.message}</p>}
                  </div>
                  
                  <button 
                    onClick={handlePushToggle}
                    disabled={pushState.loading || !pushState.supported || !pushState.configured}
                    style={{
                      padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      background: pushState.subscribed ? 'var(--tct-teal)' : 'rgba(255,255,255,0.05)',
                      color: pushState.subscribed ? '#0A121C' : '#FFFFFF',
                      opacity: (pushState.loading || !pushState.supported || !pushState.configured) ? 0.5 : 1
                    }}
                  >
                    {pushState.loading ? "Checking..." : pushState.subscribed ? "Enabled" : "Enable"}
                  </button>
                </div>
              </div>

              <div className="tct-animate-in" style={{ marginTop: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Inbox</h3>
                     {unreadCount > 0 && <span style={{ fontSize: '12px', background: 'var(--tct-coral)', color: '#FFFFFF', padding: '2px 8px', borderRadius: '100px', fontWeight: 'bold' }}>{unreadCount} Unread</span>}
                   </div>
                   
                   <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                     <div className="filter-bar" style={{ marginBottom: 0 }}>
                       <button className={`filter-pill ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter("All")}>All</button>
                       <button className={`filter-pill ${filter === 'Unread' ? 'active' : ''}`} onClick={() => setFilter("Unread")}>Unread</button>
                     </div>
                     {unreadCount > 0 && (
                       <button onClick={markAllAsRead} className="btn-ghost" style={{ fontSize: '13px' }}>Mark all as read</button>
                     )}
                   </div>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="skeleton-pulse" style={{ height: '100px', borderRadius: '16px' }}></div>)}
                  </div>
                ) : error ? (
                  <div className="empty-state">
                    <ShieldAlert />
                    <h3>Unable to load alerts</h3>
                    <p>{error}</p>
                    <button className="btn-ghost" style={{ marginTop: '16px' }} onClick={load}><RefreshCw /> Retry</button>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="empty-state">
                    <Bell />
                    <h3>No Active Alerts</h3>
                    <p>You're all caught up. Active clinical alerts will appear here when detected.</p>
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="empty-state">
                    <Layers />
                    <h3>No matching alerts</h3>
                    <p>There are no alerts matching the '{filter}' filter.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAlerts.map(alert => {
                      const isRead = readAlertIds.includes(alert.id);
                      return (
                        <div key={alert.id} className="doctor-card" style={{ cursor: 'default', padding: '24px', opacity: isRead ? 0.7 : 1, border: !isRead && alert.severity === 'CRITICAL' ? '1px solid var(--tct-coral)' : '' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <Badge value={alert.severity} />
                                {!isRead && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--tct-coral)' }}></span>}
                              </div>
                              <p style={{ fontSize: '15px', color: '#FFFFFF', lineHeight: '1.5' }}>{translateDisplayText(language, alert.message)}</p>
                              <p style={{ fontSize: '12px', color: 'var(--tct-text-muted)', marginTop: '8px' }}>{new Date(alert.createdAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                            </div>
                            
                            <button 
                              onClick={() => toggleReadStatus(alert.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: isRead ? 'var(--tct-text-muted)' : 'var(--tct-teal)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                            >
                              <Check size={14} /> {isRead ? "Mark Unread" : "Mark Read"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
