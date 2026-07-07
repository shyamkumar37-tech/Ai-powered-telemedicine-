import { useEffect, useState } from "react";
import AlertStrip from "../components/AlertStrip";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchLinkedPatients, linkCaregiver } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { Activity, Users } from "lucide-react";

export default function CaregiverMonitoringPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [patientId, setPatientId] = useState("1");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchLinkedPatients(caregiverId)
      .then((data) => {
        setLinkedPatients(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadLinkedPatients"))))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [caregiverId]);

  return (
    <div className="space-y-6">
      <SectionCard
        title={(
          <span className="inline-flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            <span>{t("linkPatient")}</span>
          </span>
        )}
        action={
          <button
            className="btn-primary"
            onClick={async () => {
              try {
                setError("");
                setMessage("");
                await linkCaregiver({ patientId: Number(patientId), caregiverId });
                setMessage(t("patientLinkedSuccessfully"));
                await load();
              } catch (err) {
                setError(getApiErrorMessage(err, t("unableLinkPatient")));
              }
            }}
          >
            {t("link")}
          </button>
        }
      >
        <input className="field max-w-xs" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
        {message ? <p className="mt-4 text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </SectionCard>
      <SectionCard
        title={(
          <span className="inline-flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <span>{t("linkedPatientMonitoring")}</span>
          </span>
        )}
      >
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadLinkedPatients")}
            body={error}
            actionLabel={t("retry")}
            onAction={() => load()}
          />
        ) : null}
        {!loading && !error && !linkedPatients.length ? (
          <EmptyStateCard
            title={t("noLinkedPatients")}
            body={t("linkPatient")}
          />
        ) : null}
        <div className="space-y-4">
          {(Array.isArray(linkedPatients) ? linkedPatients : []).map((patient) => (
            <div key={patient.patientId} className="rounded-2xl bg-mist p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{patient.patientName}</p>
                  <p className="text-sm text-slate-500">{t("pendingReminders")}: {patient.pendingReminders}</p>
                </div>
                <p className="text-sm font-semibold text-clinic">{t("adherence")}: {patient.adherencePercentage}%</p>
              </div>
              <div className="mt-4">
                <AlertStrip items={Array.isArray(patient.activeAlerts) ? patient.activeAlerts : []} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
