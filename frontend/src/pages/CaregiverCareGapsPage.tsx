import { useEffect, useState, useMemo } from "react";
import Badge from "../components/Badge";
import LocalizedText from "../components/LocalizedText";
import CaregiverPremiumCard from "../components/CaregiverPremiumCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { fetchCaregiverCareGaps } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { translateDisplayText } from "../utils/i18n";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import { AlertTriangle, UserCircle, RefreshCcw, Search, ChevronRight } from "lucide-react";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function CaregiverCareGapsPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [gaps, setGaps] = useState<DynamicStateObject[]>([]);
  const [loading, setLoading] = useState<DynamicState>(true);
  const [error, setError] = useState<DynamicState>("");
  const [searchQuery, setSearchQuery] = useState<DynamicState>("");
  
  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    setLoading(true);
    fetchCaregiverCareGaps(caregiverId)
      .then((data: DynamicStateObject) => {
        setGaps(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err: DynamicStateObject) => setError(getApiErrorMessage(err, t("unableLoadCareGaps"))))
      .finally(() => setLoading(false));
  }, [caregiverId, t]);

  const filteredGaps = useMemo(() => {
    if (!searchQuery.trim()) return gaps;
    const lowerQ = searchQuery.toLowerCase();
    return gaps.filter((gap: DynamicStateObject) => 
      (gap.patientName || "").toLowerCase().includes(lowerQ) ||
      (gap.gapType || "").toLowerCase().includes(lowerQ)
    );
  }, [gaps, searchQuery]);

  return (
    <div className="tcd-animate-in space-y-6">
      <CaregiverPremiumCard
        title={
          <div className="flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-indigo-400" />
              <LocalizedText as="span" value={t("missedCareDetection")} minLength={4} />
            </span>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <RefreshCcw className="w-3.5 h-3.5" />
              Updated {lastUpdated}
            </div>
          </div>
        }
        action={
          <div className="relative w-full max-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search patient..."
              className="cg-input py-1.5 pl-8 pr-3 text-xs w-full"
              value={searchQuery}
              onChange={(e: DynamicStateObject) => setSearchQuery(e.target.value)}
            />
          </div>
        }
      >
        {loading ? <LoadingSkeleton lines={4} /> : null}
        {error ? (
          <ErrorStateCard
            title={t("unableLoadCareGaps")}
            body={error}
          />
        ) : null}
        {!loading && !error && !filteredGaps.length ? (
          <EmptyStateCard
            title={t("noCareGaps")}
            body={translateDisplayText(language, "Care gap highlights will appear here when they are detected.")}
          />
        ) : null}
        
        <div className="grid gap-6 md:grid-cols-2">
          {filteredGaps.map((gap: DynamicStateObject, index: number | string) => (
            <div key={`${gap.patientId}-${gap.gapType}-${index}`} className="rounded-xl border border-[var(--tc-border)] bg-[var(--tc-surface-muted)] p-5 transition-colors hover:bg-white/10 flex flex-col h-full">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{gap.patientName}</p>
                    <p className="text-xs text-slate-400">{translateDisplayText(language, gap.gapType)}</p>
                  </div>
                </div>
                <Badge value={gap.severity} />
              </div>
              
              <div className="mb-4 flex-1">
                <LocalizedText as="p" className="text-sm text-slate-300" value={gap.message} />
              </div>
              
              <div className="mt-auto bg-black/20 p-3 rounded-lg border border-white/5 flex items-start gap-3">
                <div className="bg-indigo-500/20 p-1.5 rounded text-indigo-400 mt-0.5 shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{t("recommendedAction") || "Recommended Action"}</p>
                  <LocalizedText as="p" className="text-sm font-semibold text-white" value={gap.recommendedAction} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CaregiverPremiumCard>
    </div>
  );
}

