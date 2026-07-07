import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { disableBackgroundAlerts, enableBackgroundAlerts, getPushStatus } from "../services/pushService";
import { fetchPatientAlerts, subscribeToPatientAlertStream } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { notifyBrowser, requestBrowserNotificationPermission } from "../utils/browserNotifications";
import { translateDisplayText } from "../utils/i18n";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { Bell } from "lucide-react";

export default function PatientAlertsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const patientId = auth.profileId;
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pushState, setPushState] = useState({ loading: true, supported: true, subscribed: false, configured: true, message: "" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!patientId) {
      setAlerts([]);
      setError(t("unableLoadNotifications"));
      setLoading(false);
      return;
    }

    setLoading(true);
    runWithRequestTimeout(
      (signal) => fetchPatientAlerts(patientId, { signal }),
      { signal: controller.signal }
    )
      .then((data) => {
        if (!active) {
          return;
        }
        setAlerts(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(getApiErrorMessage(err, t("unableLoadNotifications")));
        logAsyncFailure("patient-alerts", err, { patientId });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [patientId, reloadToken, t]);

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
    if (!patientId) {
      return () => {};
    }

    const unsubscribe = subscribeToPatientAlertStream(
      patientId,
      (alert) => {
        setAlerts((current) => [alert, ...current.filter((item) => item.id !== alert.id)]);
        setError("");
        if (!pushState.subscribed) {
          notifyBrowser(t("notificationCenter"), translateDisplayText(language, alert.message));
        }
      },
      () => {}
    );

    return unsubscribe;
  }, [language, patientId, pushState.subscribed, t]);

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
          <LocalizedText as="span" value={t("notificationCenter")} minLength={4} />
        </span>
      )}
    >
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-ink">{t("backgroundAlerts")}</p>
            <p className="text-sm text-slate-500">
              {t("backgroundAlertsHelp")}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handlePushToggle}
            disabled={pushState.loading || !pushState.supported || !pushState.configured}
            aria-label={pushState.loading ? t("checking") : pushState.subscribed ? t("disableBackgroundAlerts") : t("enableBackgroundAlerts")}
            data-voice-label={pushState.loading ? t("checking") : pushState.subscribed ? t("disableBackgroundAlerts") : t("enableBackgroundAlerts")}
          >
            {pushState.loading ? t("checking") : pushState.subscribed ? t("disableBackgroundAlerts") : t("enableBackgroundAlerts")}
          </button>
        </div>
        {!pushState.supported ? <p className="mt-2 text-sm text-amber-600" role="status" aria-live="polite">{t("browserPushUnsupported")}</p> : null}
        {pushState.supported && !pushState.configured ? <p className="mt-2 text-sm text-amber-600" role="status" aria-live="polite">{t("browserPushUnavailable")}</p> : null}
        {pushState.message ? <p className="mt-2 text-sm text-slate-600" role="status" aria-live="polite">{pushState.message}</p> : null}
      </div>
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadNotifications")}
          body={error}
          actionLabel={t("retry")}
          onAction={() => setReloadToken((current) => current + 1)}
        />
      ) : null}
      {!loading && !error && !alerts.length ? (
        <EmptyStateCard
          title={t("noActiveAlerts")}
          body={translateDisplayText(language, "Active alerts will appear here when detected.")}
        />
      ) : null}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-2xl bg-mist p-5">
            <div className="flex items-center justify-between gap-3">
              <Badge value={alert.severity} />
              <span className="text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString()}</span>
            </div>
            <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={alert.message} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
