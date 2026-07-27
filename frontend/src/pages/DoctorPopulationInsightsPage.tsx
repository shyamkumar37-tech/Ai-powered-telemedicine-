import { useEffect, useState } from "react";
import LocalizedText from "../components/LocalizedText";
import PremiumSectionCard from "../components/PremiumSectionCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchPopulationInsights } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { Globe, Users, TrendingUp, BarChart3, Activity } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

function PopulationSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_: DynamicStateObject, i: DynamicStateObject) => (
        <div key={i} className="doc-skeleton h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function DoctorPopulationInsightsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const doctorId = auth.profileId ?? auth.userId;
  const [insights, setInsights] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");

  useEffect(() => {
    setLoading(true);
    fetchPopulationInsights(doctorId)
      .then((data: DynamicStateObject) => {
        setInsights(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err: DynamicStateObject) => setError(getApiErrorMessage(err, t("unableLoadPopulationInsights"))))
      .finally(() => setLoading(false));
  }, [doctorId, t]);

  const getIconForTitle = (title: DynamicStateObject) => {
    const tLower = String(title).toLowerCase();
    if (tLower.includes("risk") || tLower.includes("critical")) return <Activity className="h-5 w-5 text-rose-400" />;
    if (tLower.includes("trend") || tLower.includes("increase")) return <TrendingUp className="h-5 w-5 text-teal-400" />;
    if (tLower.includes("population") || tLower.includes("patient")) return <Users className="h-5 w-5 text-indigo-400" />;
    return <BarChart3 className="h-5 w-5 text-blue-400" />;
  };

  return (
    <div className="space-y-6 tcd-animate-in">
      <PremiumSectionCard title={(
        <span className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-teal-400" />
          {t("populationHealthInsights")}
        </span>
      )}>
        {loading ? <PopulationSkeleton /> : null}
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
        <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
          {insights.map((item: DynamicStateObject, index: number | string) => (
            <div key={`${item.title}-${index}`} className="group flex flex-col justify-between rounded-xl border border-white/5 bg-[var(--tc-surface-muted)] p-5 transition-colors hover:bg-white/10 hover:border-[var(--tc-border)]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/20">
                    {getIconForTitle(item.title)}
                  </div>
                </div>
                <LocalizedText as="p" className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2" value={item.title} />
                <p className="text-3xl font-semibold text-white tracking-tight">{item.value}</p>
              </div>
              
              <div className="mt-6 border-t border-white/5 pt-4">
                <LocalizedText as="p" className="text-sm text-slate-400 leading-relaxed" value={item.detail} />
              </div>
            </div>
          ))}
        </div>
      </PremiumSectionCard>
    </div>
  );
}

