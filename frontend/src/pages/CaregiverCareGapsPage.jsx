import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchCaregiverCareGaps } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { AlertTriangle } from "lucide-react";

export default function CaregiverCareGapsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchCaregiverCareGaps(caregiverId)
      .then((data) => {
        setGaps(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadCareGaps"))))
      .finally(() => setLoading(false));
  }, [caregiverId]);

  return (
    <SectionCard
      title={(
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-teal-600" />
          <LocalizedText as="span" value={t("missedCareDetection")} minLength={4} />
        </span>
      )}
    >
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadCareGaps")}
          body={error}
        />
      ) : null}
      {!loading && !error && !gaps.length ? (
        <EmptyStateCard
          title={t("noCareGaps")}
          body={translateDisplayText(language, "Care gap highlights will appear here when they are detected.")}
        />
      ) : null}
      <div className="space-y-4">
        {gaps.map((gap, index) => (
          <div key={`${gap.patientId}-${gap.gapType}-${index}`} className="rounded-2xl bg-mist p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{gap.patientName}</p>
                <p className="text-sm text-slate-500">{translateDisplayText(language, gap.gapType)}</p>
              </div>
              <Badge value={gap.severity} />
            </div>
            <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={gap.message} />
            <LocalizedText as="p" className="mt-2 text-sm font-semibold text-clinic" value={gap.recommendedAction} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
