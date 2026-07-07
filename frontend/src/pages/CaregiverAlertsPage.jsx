import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { disableBackgroundAlerts, enableBackgroundAlerts, getPushStatus } from "../services/pushService";
import { fetchCaregiverAlerts, subscribeToCaregiverAlertStream } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { notifyBrowser, requestBrowserNotificationPermission } from "../utils/browserNotifications";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { Bell } from "lucide-react";

export default function CaregiverAlertsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pushState, setPushState] = useState({ loading: true, supported: true, subscribed: false, configured: true, message: "" });

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

  return (
    <SectionCard
      title={(
        <span className="inline-flex items-center gap-2">
          <Bell className="h-5 w-5 text-teal-600" />
          <LocalizedText as="span" value={t("escalationNotifications")} minLength={4} />
        </span>
      )}
    >
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-ink">{t("backgroundAlerts")}</p>
            <p className="text-sm text-slate-500">
              {t("caregiverBackgroundAlertsHelp")}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handlePushToggle}
            disabled={pushState.loading || !pushState.supported || !pushState.configured}
          >
            {pushState.loading ? t("checking") : pushState.subscribed ? t("disableBackgroundAlerts") : t("enableBackgroundAlerts")}
          </button>
        </div>
        {!pushState.supported ? <p className="mt-2 text-sm text-amber-600">{t("browserPushUnsupported")}</p> : null}
        {pushState.supported && !pushState.configured ? <p className="mt-2 text-sm text-amber-600">{t("browserPushUnavailable")}</p> : null}
        {pushState.message ? <p className="mt-2 text-sm text-slate-600">{pushState.message}</p> : null}
      </div>
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadCaregiverAlerts")}
          body={error}
        />
      ) : null}
      {!loading && !error && !alerts.length ? (
        <EmptyStateCard
          title={t("noActiveEscalations")}
          body={translateDisplayText(language, "Active escalations will appear here when detected.")}
        />
      ) : null}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={`${alert.id}-${alert.patientId}`} className="rounded-2xl bg-mist p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{alert.patientName}</p>
                <p className="text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString()}</p>
              </div>
              <Badge value={alert.severity} />
            </div>
            <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={alert.message} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
