import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { disableBackgroundAlerts, enableBackgroundAlerts, getPushStatus } from "../services/pushService";
import { fetchPatientAlerts, subscribeToPatientAlertStream } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { notifyBrowser, requestBrowserNotificationPermission } from "../utils/browserNotifications";
import { translateDisplayText } from "../utils/i18n";
import PatientSidebar from "../components/PatientSidebar";
import { User, LogOut, Bell, ShieldAlert, Check, RefreshCw, Layers } from "lucide-react";
import { buildLoginRedirect } from "../utils/authSession";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function PatientAlertsPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const patientId = auth?.profileId;
  
  const [alerts, setAlerts] = useState<DynamicStateObject[]>([]);
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);
  const [pushState, setPushState] = useState<DynamicState>({ loading: true, supported: true, subscribed: false, configured: true, message: "" });
  const [filter, setFilter] = useState<DynamicState>("All"); // All or Unread
  const [readAlertIds, setReadAlertIds] = useState<DynamicState>(() => {
    try { return JSON.parse((localStorage.getItem as any)(`telecareplus-read-alerts-${patientId}`)) || []; } 
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
    } catch (err: DynamicStateObject) {
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
      .then((status: DynamicStateObject) => {
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
      (alert: DynamicStateObject) => {
        setAlerts((current: DynamicStateObject) => [alert, ...current.filter((item: DynamicStateObject) => item.id !== alert.id)]);
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
    setPushState((current: DynamicStateObject) => ({ ...current, loading: true, message: "" }));
    try {
      if (pushState.subscribed) {
        await disableBackgroundAlerts();
        setPushState((current: DynamicStateObject) => ({ ...current, loading: false, subscribed: false, message: "Background alerts disabled" }));
      } else {
        await enableBackgroundAlerts();
        setPushState((current: DynamicStateObject) => ({ ...current, loading: false, subscribed: true, supported: true, configured: true, message: "Background alerts enabled" }));
      }
    } catch (err: DynamicStateObject) {
      setPushState((current: DynamicStateObject) => ({ ...current, loading: false, message: getApiErrorMessage(err, "Unable to update background alerts") }));
    }
  };

  const toggleReadStatus = (id: number | string) => {
    let nextReadIds: DynamicStateObject;
    if (readAlertIds.includes(id)) {
      nextReadIds = readAlertIds.filter((x: DynamicStateObject) => x !== id);
    } else {
      nextReadIds = [...readAlertIds, id];
    }
    setReadAlertIds(nextReadIds);
    try { localStorage.setItem(`telecareplus-read-alerts-${patientId}`, JSON.stringify(nextReadIds)); } catch {}
  };

  const markAllAsRead = () => {
    const allIds = alerts.map((a: DynamicStateObject) => a.id);
    const nextReadIds = [...new Set([...readAlertIds, ...allIds])];
    setReadAlertIds(nextReadIds);
    try { localStorage.setItem(`telecareplus-read-alerts-${patientId}`, JSON.stringify(nextReadIds)); } catch {}
  };

  const filteredAlerts = useMemo(() => {
    if (filter === "Unread") return alerts.filter((a: DynamicStateObject) => !readAlertIds.includes(a.id));
    return alerts;
  }, [alerts, filter, readAlertIds]);

  const unreadCount = alerts.filter((a: DynamicStateObject) => !readAlertIds.includes(a.id)).length;

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
            <h1 className="font-display text-3xl font-medium mb-2">{t("notificationCenter") || "Notification Center"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("reviewAndManageYourCriticalHealthAlerts") || "Review and manage your critical health alerts."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Bell size={12} className="text-primary" />{t("alerts") || "Alerts"}</span>
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
          
          {/* Preferences */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
               <h3 className="font-display text-xl font-medium">{t("preferences") || "Preferences"}</h3>
               <div className="flex-1 h-px bg-white/10"></div>
            </div>
            
            <div className="card-premium !bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h4 className="text-base font-semibold text-ink mb-1">{t("backgroundNotifications") || "Background Notifications"}</h4>
                <p className="text-sm text-ink-muted leading-relaxed">{t("receiveOSLevelNotificationsEvenWhenTheAppIsClosed") || "Receive OS-level notifications even when the app is closed."}</p>
                
                {!pushState.supported && <p className="text-sm font-medium text-alert mt-3 bg-alert/5 border border-alert/20 px-3 py-1.5 rounded inline-block">{t("yourBrowserDoesNotSupportBackgroundPushNotifications") || "Your browser does not support background push notifications."}</p>}
                {pushState.supported && !pushState.configured && <p className="text-sm font-medium text-alert mt-3 bg-alert/5 border border-alert/20 px-3 py-1.5 rounded inline-block">{t("pushNotificationsAreCurrentlyUnavailableInYourRegion") || "Push notifications are currently unavailable in your region."}</p>}
                {pushState.message && <p className="text-sm font-medium text-primary mt-3 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded inline-block animate-fadeIn">{pushState.message}</p>}
              </div>
              
              <button 
                onClick={handlePushToggle}
                disabled={pushState.loading || !pushState.supported || !pushState.configured}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 ${pushState.subscribed ? 'bg-primary text-canvas shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-white/5 border border-white/10 text-ink hover:bg-white/10'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {pushState.loading ? "Checking..." : pushState.subscribed ? "Enabled" : "Enable"}
              </button>
            </div>
          </div>

          {/* Inbox */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
               <div className="flex items-center gap-4">
                 <h3 className="font-display text-xl font-medium">{t("inbox") || "Inbox"}</h3>
                 {unreadCount > 0 && <span className="text-xs font-bold bg-alert text-white px-2.5 py-1 rounded-full animate-pulse-soft shadow-[0_0_10px_rgba(239,68,68,0.4)]">{unreadCount} Unread</span>}
               </div>
               
               <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                 <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                   <button className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap ${filter === 'All' ? 'bg-primary text-canvas border-primary' : 'bg-transparent text-ink-muted border-white/10 hover:text-ink hover:bg-white/5'}`} onClick={() => setFilter("All")}>{t("all") || "All"}</button>
                   <button className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap ${filter === 'Unread' ? 'bg-primary text-canvas border-primary' : 'bg-transparent text-ink-muted border-white/10 hover:text-ink hover:bg-white/5'}`} onClick={() => setFilter("Unread")}>{t("unread") || "Unread"}</button>
                 </div>
                 {unreadCount > 0 && (
                   <button onClick={markAllAsRead} className="text-sm text-primary hover:text-primary-light font-medium transition-colors whitespace-nowrap">{t("markAllAsRead") || "Mark all as read"}</button>
                 )}
               </div>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {[1,2,3].map((i: DynamicStateObject) => <div key={i} className="card-premium h-24 animate-pulse bg-white/5"></div>)}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-alert/5 border border-alert/20 rounded-xl">
                <ShieldAlert size={32} className="text-alert mb-4" />
                <h3 className="font-display text-lg mb-2">{t("unableToLoadAlerts") || "Unable to load alerts"}</h3>
                <p className="text-sm text-ink-muted mb-6">{error}</p>
                <button className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2" onClick={load}><RefreshCw size={16} /> {t("retry") || "Retry"}</button>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[300px]">
                <Bell size={48} className="text-ink-muted/30 mb-4" />
                <h3 className="font-display text-lg mb-2">{t("noActiveAlerts") || "No Active Alerts"}</h3>
                <p className="text-sm text-ink-muted max-w-[280px]">{t("youReAllCaughtUpActiveClinicalAlertsWillAppearHereWhenDetected") || "You're all caught up. Active clinical alerts will appear here when detected."}</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed h-[250px]">
                <Layers size={48} className="text-ink-muted/30 mb-4" />
                <h3 className="font-display text-lg mb-2">{t("noMatchingAlerts") || "No matching alerts"}</h3>
                <p className="text-sm text-ink-muted">There are no alerts matching the '{filter}' filter.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredAlerts.map((alert: DynamicStateObject) => {
                  const isRead = readAlertIds.includes(alert.id);
                  return (
                    <div key={alert.id} className={`card-premium !bg-surface transition-all ${isRead ? 'opacity-60 grayscale-[0.2]' : 'hover:border-white/20'} ${!isRead && alert.severity === 'CRITICAL' ? 'border-alert/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge value={alert.severity} />
                            {!isRead && <span className="w-2 h-2 rounded-full bg-alert shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>}
                          </div>
                          <p className="text-[15px] text-ink/90 leading-relaxed mb-3">{translateDisplayText(language, alert.message)}</p>
                          <p className="text-xs font-medium text-ink-muted">{new Date(alert.createdAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                        
                        <button 
                          onClick={() => toggleReadStatus(alert.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border shrink-0 ${isRead ? 'bg-white/5 text-ink-muted border-transparent hover:bg-white/10 hover:text-ink' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'}`}
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
      </main>
    </div>
  );
}
