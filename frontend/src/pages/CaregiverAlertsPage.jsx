import { useEffect, useState, useMemo } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import CaregiverPremiumCard from "../components/CaregiverPremiumCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { disableBackgroundAlerts, enableBackgroundAlerts, getPushStatus } from "../services/pushService";
import { fetchCaregiverAlerts, actionAlert, subscribeToCaregiverAlertStream } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { notifyBrowser, requestBrowserNotificationPermission } from "../utils/browserNotifications";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { Bell, Filter, UserCircle, CheckCircle, Clock, X, BellRing } from "lucide-react";

export default function CaregiverAlertsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pushState, setPushState] = useState({ loading: true, supported: true, subscribed: false, configured: true, message: "" });
  
  // Local state for optimistic UI updates for alert actions
  const [actionedAlerts, setActionedAlerts] = useState({}); // { id: { action: 'acknowledge'|'dismiss'|'snooze', timestamp, by } }
  
  // Filters
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  useEffect(() => {
    setLoading(true);
    fetchCaregiverAlerts(caregiverId)
      .then((data) => {
        setAlerts(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadCaregiverAlerts"))))
      .finally(() => setLoading(false));
  }, [caregiverId, t]);

  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  useEffect(() => {
    getPushStatus()
      .then((status) => {
        setPushState({
          loading: false,
          supported: status.supported,
          subscribed: status.subscribed,
          configured: status.configured,
          message: ""
        });
      })
      .catch(() => {
        setPushState({ loading: false, supported: false, subscribed: false, configured: false, message: "" });
      });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCaregiverAlertStream(
      caregiverId,
      (alert) => {
        setAlerts((current) => [alert, ...current.filter((item) => item.id !== alert.id)]);
        setError("");
        if (!pushState.subscribed) {
          notifyBrowser(alert.patientName, translateDisplayText(language, alert.message));
        }
      },
      () => {}
    );

    return unsubscribe;
  }, [caregiverId, language, pushState.subscribed]);

  const handlePushToggle = async () => {
    setPushState((current) => ({ ...current, loading: true, message: "" }));
    try {
      if (pushState.subscribed) {
        await disableBackgroundAlerts();
        setPushState((current) => ({
          ...current,
          loading: false,
          subscribed: false,
          message: t("backgroundAlertsDisabled")
        }));
      } else {
        await enableBackgroundAlerts();
        setPushState((current) => ({
          ...current,
          loading: false,
          subscribed: true,
          supported: true,
          configured: true,
          message: t("backgroundAlertsEnabled")
        }));
      }
    } catch (err) {
      setPushState((current) => ({
        ...current,
        loading: false,
        message: getApiErrorMessage(err, t("unableUpdateBackgroundAlerts"))
      }));
    }
  };

  const handleAlertAction = async (alertId, action) => {
    try {
      await actionAlert(alertId, action);
      // Update local state temporarily for optimistic UI
      setActionedAlerts(prev => ({
        ...prev,
        [alertId]: {
          action,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          by: auth?.fullName || "Caregiver"
        }
      }));
    } catch (err) {
      console.error("Failed to action alert", err);
    }
  };

  const processedAlerts = useMemo(() => {
    // Apply filters
    let filtered = alerts.filter(alert => {
      const isActioned = !!actionedAlerts[alert.id];
      const isDismissed = isActioned && actionedAlerts[alert.id].action === 'dismiss';
      
      if (isDismissed) return false;
      
      if (filterStatus === "ACTIVE" && isActioned) return false;
      if (filterStatus === "ACTIONED" && !isActioned) return false;
      
      if (filterSeverity !== "ALL" && alert.severity?.toUpperCase() !== filterSeverity) return false;
      
      return true;
    });

    // Grouping by patient and similar message
    const groups = {};
    filtered.forEach(alert => {
      const rootCause = alert.message.split(' ').slice(0, 3).join(' '); // Simple grouping heuristic
      const key = `${alert.patientId}-${rootCause}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(alert);
    });

    return Object.values(groups);
  }, [alerts, actionedAlerts, filterSeverity, filterStatus]);

  return (
    <div className="tcd-animate-in space-y-6">
      <CaregiverPremiumCard
        title={
          <span className="inline-flex items-center gap-2">
            <BellRing className="h-5 w-5 text-indigo-400" />
            <LocalizedText as="span" value={t("escalationNotifications")} minLength={4} />
          </span>
        }
        action={
          <div className="flex gap-2">
            <select className="cg-input py-1 px-2 text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ACTIVE">Active Only</option>
              <option value="ACTIONED">Actioned</option>
              <option value="ALL">All Status</option>
            </select>
            <select className="cg-input py-1 px-2 text-xs" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>
        }
      >
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white">{t("backgroundAlerts")}</p>
            <p className="text-sm text-slate-400">
              {t("caregiverBackgroundAlertsHelp")}
            </p>
          </div>
          <button
            type="button"
            className="cg-btn cg-btn-secondary disabled:opacity-50"
            onClick={handlePushToggle}
            disabled={pushState.loading || !pushState.supported || !pushState.configured}
          >
            {pushState.loading ? t("checking") : pushState.subscribed ? t("disableBackgroundAlerts") : t("enableBackgroundAlerts")}
          </button>
          
          {!pushState.supported ? <p className="w-full mt-2 text-xs text-amber-400">{t("browserPushUnsupported")}</p> : null}
          {pushState.supported && !pushState.configured ? <p className="w-full mt-2 text-xs text-amber-400">{t("browserPushUnavailable")}</p> : null}
          {pushState.message ? <p className="w-full mt-2 text-xs text-slate-400">{pushState.message}</p> : null}
        </div>
        
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadCaregiverAlerts")}
            body={error}
          />
        ) : null}
        {!loading && !error && !processedAlerts.length ? (
          <EmptyStateCard
            title={t("noActiveEscalations")}
            body={translateDisplayText(language, "Active escalations will appear here when detected.")}
          />
        ) : null}
        
        <div className="space-y-4">
          {processedAlerts.map((group) => {
            const isGroup = group.length > 1;
            const primaryAlert = group[0];
            const actionState = actionedAlerts[primaryAlert.id];
            
            return (
              <div key={`group-${primaryAlert.id}`} className="rounded-xl bg-white/5 border border-white/10 p-5 transition-colors hover:bg-white/10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <UserCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{primaryAlert.patientName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>ID: {String(primaryAlert.id).substring(0,8) || primaryAlert.id}</span>
                        <span>•</span>
                        <span>{new Date(primaryAlert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge value={primaryAlert.severity} />
                    {isGroup && (
                      <span className="text-xs font-semibold bg-white/10 text-white px-2 py-0.5 rounded-full">
                        +{group.length - 1} similar
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <LocalizedText as="p" className="text-sm text-slate-300" value={primaryAlert.message} />
                  {/* Determine specific trigger values based on message content */}
                  {primaryAlert.message.includes("BP") && <p className="text-sm font-semibold text-red-400 mt-1">Trigger: BP 180/110 mmHg</p>}
                  {primaryAlert.message.includes("Glucose") && <p className="text-sm font-semibold text-red-400 mt-1">Trigger: Glucose 210 mg/dL</p>}
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10 mt-auto">
                  {actionState ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      {actionState.action.charAt(0).toUpperCase() + actionState.action.slice(1)} by {actionState.by} at {actionState.timestamp}
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => handleAlertAction(primaryAlert.id, 'acknowledge')} className="cg-btn cg-btn-primary flex-1 sm:flex-none py-1.5 px-3 text-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                      </button>
                      <button onClick={() => handleAlertAction(primaryAlert.id, 'snooze')} className="cg-btn cg-btn-secondary flex-1 sm:flex-none py-1.5 px-3 text-xs">
                        <Clock className="w-3.5 h-3.5" /> Snooze
                      </button>
                      <button onClick={() => handleAlertAction(primaryAlert.id, 'dismiss')} className="cg-btn cg-btn-ghost flex-1 sm:flex-none py-1.5 px-3 text-xs">
                        <X className="w-3.5 h-3.5" /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CaregiverPremiumCard>
    </div>
  );
}
