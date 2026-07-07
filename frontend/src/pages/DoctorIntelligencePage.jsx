import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchDoctorPriorityQueue } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function DoctorIntelligencePage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const doctorId = auth.profileId ?? auth.userId;
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchDoctorPriorityQueue(doctorId)
      .then((data) => {
        setQueue(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadDoctorQueue"))))
      .finally(() => setLoading(false));
  }, [doctorId]);

  return (
    <SectionCard title={t("doctorIntelligenceQueue")}>
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadDoctorQueue")}
          body={error}
        />
      ) : null}
      {!loading && !error && !queue.length ? (
        <EmptyStateCard
          title={t("noDoctorQueue")}
          body={translateDisplayText(language, "Priority patients will appear here when risk signals are detected.")}
        />
      ) : null}
      <div className="space-y-4">
        {queue.map((patient) => (
          <div key={patient.patientId} className="rounded-2xl bg-mist p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{patient.patientName}</p>
                <p className="text-sm text-slate-500">{t("riskScore")} {patient.riskScore}/100 | {t("adherence")} {patient.adherencePercentage}% | {t("pendingRemindersShort")} {patient.pendingReminders}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-clinic">{translateDisplayText(language, patient.riskLevel)}</span>
            </div>
            {patient.latestAlert && patient.latestAlert !== t("noActiveAlert") ? <div className="mt-3"><Badge value={patient.riskLevel === "CRITICAL" ? "CRITICAL" : "WARNING"} /></div> : null}
            <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={patient.latestAlert} />
            <LocalizedText as="p" className="mt-2 text-sm font-semibold text-clinic" value={patient.recommendedAction} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
