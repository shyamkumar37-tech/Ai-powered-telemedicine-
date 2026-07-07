import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPopulationInsights } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";

export default function DoctorPopulationInsightsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const doctorId = auth.profileId ?? auth.userId;
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchPopulationInsights(doctorId)
      .then((data) => {
        setInsights(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, t("unableLoadPopulationInsights"))))
      .finally(() => setLoading(false));
  }, [doctorId]);

  return (
    <SectionCard title={t("populationHealthInsights")}>
      {loading ? <LoadingSkeleton lines={4} /> : null}
      {error ? (
        <ErrorStateCard
          title={t("unableLoadPopulationInsights")}
          body={error}
        />
      ) : null}
      {!loading && !error && !insights.length ? (
        <EmptyStateCard
          title={t("noPopulationInsights")}
          body={translateDisplayText(language, "Insights will appear once population signals are available.")}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((item) => (
          <div key={`${item.title}-${item.value}`} className="rounded-2xl bg-mist p-5">
            <LocalizedText as="p" className="text-sm text-slate-500" value={item.title} />
            <p className="mt-2 text-2xl font-semibold text-ink">{item.value}</p>
            <LocalizedText as="p" className="mt-3 text-sm text-slate-700" value={item.detail} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
