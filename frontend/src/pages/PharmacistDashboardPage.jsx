import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../utils/queryKeys";
import PharmacistPremiumCard from "../components/PharmacistPremiumCard";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AiPharmacistInsightsPanel from "../ai/components/AiPharmacistInsightsPanel";
import { fetchPharmacistDashboard } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import { translateDisplayText } from "../utils/i18n";
import EmptyStateCard from "../components/ui/EmptyStateCard";
import ErrorStateCard from "../components/ui/ErrorStateCard";
import PriorityActionsCard from "../components/ui/PriorityActionsCard";
import { ClipboardCheck, Package, Pill, ShoppingBag } from "lucide-react";

export default function PharmacistDashboardPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const translateUiText = (value) => translateDisplayText(language, value);
  const pharmacistId = auth.profileId ?? auth.userId;
  const [reloadToken, setReloadToken] = useState(0);

  const { data: dashboard, error: queryError, isLoading: loading } = useQuery({
    queryKey: queryKeys.pharmacist.dashboard(pharmacistId),
    queryFn: async ({ signal }) => {
      const data = await runWithRequestTimeout(
        (s) => fetchPharmacistDashboard(pharmacistId, { signal: s }),
        { signal }
      );
      return data;
    },
    enabled: !!pharmacistId && auth?.role === "PHARMACIST",
    retry: 1
  });

  const error = queryError ? getApiErrorMessage(queryError, t("unableLoadPharmacistDashboard")) : "";

  if (loading) {
    return (
      <div className="dashboard-shell space-y-6">
        <div className="dashboard-skeleton__header" aria-hidden="true" />
        <div className="dashboard-skeleton__grid" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`pharm-stat-${index}`} className="dashboard-skeleton__stat" />
          ))}
        </div>
        <div className="dashboard-skeleton__panel" aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorStateCard
        title={t("unableLoadPharmacistDashboard")}
        body={error}
        actionLabel={t("retry")}
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }

  if (!dashboard) {
    return (
      <EmptyStateCard
        title={t("noDashboardData")}
        body={t("pharmacyWorkflow")}
        actionLabel={t("retry")}
        onAction={() => setReloadToken((current) => current + 1)}
      />
    );
  }

  const pendingVerifications = Number(dashboard?.pendingVerifications ?? 0);
  const lowStockItems = Number(dashboard?.lowStockItems ?? 0);
  const dispensedToday = Number(dashboard?.dispensedToday ?? 0);
  const inventoryItems = Number(dashboard?.activeInventoryItems ?? 0);

  const priorityActions = [];

  if (pendingVerifications > 0) {
    priorityActions.push({
      id: "verifications",
      title: translateUiText("Prescriptions pending verification"),
      description: translateUiText("{count} prescriptions need pharmacist approval").replace("{count}", pendingVerifications),
      meta: translateUiText("Review dosage and interactions."),
      priority: "urgent",
      status: translateUiText("Urgent"),
      statusTone: "danger",
      icon: <ClipboardCheck className="h-5 w-5" />
    });
  }

  if (lowStockItems > 0) {
    priorityActions.push({
      id: "low-stock",
      title: translateUiText("Low stock items"),
      description: translateUiText("{count} medicines at reorder threshold").replace("{count}", lowStockItems),
      meta: translateUiText("Plan replenishment with suppliers."),
      priority: "review",
      status: translateUiText("Needs review"),
      statusTone: "warning",
      icon: <Package className="h-5 w-5" />
    });
  }

  if (inventoryItems > 0) {
    priorityActions.push({
      id: "inventory",
      title: translateUiText("Inventory check"),
      description: translateUiText("{count} active inventory items").replace("{count}", inventoryItems),
      meta: translateUiText("Audit storage and expiry dates."),
      priority: "upcoming",
      status: translateUiText("Upcoming"),
      statusTone: "info",
      icon: <Pill className="h-5 w-5" />
    });
  }

  if (dispensedToday > 0) {
    priorityActions.push({
      id: "dispensed",
      title: translateUiText("Dispensing completed"),
      description: translateUiText("{count} pickups completed today").replace("{count}", dispensedToday),
      meta: translateUiText("Ensure follow-up instructions were provided."),
      priority: "recent",
      status: translateUiText("Completed"),
      statusTone: "success",
      icon: <ShoppingBag className="h-5 w-5" />
    });
  }

  return (
    <>
      <PriorityActionsCard
        title={translateUiText("Priority actions")}
        subtitle={translateUiText("Keep pharmacy operations on track and safe.")}
        actions={priorityActions}
        emptyTitle={translateUiText("No urgent care actions right now")}
        emptyBody={translateUiText("Monitor inventory and verification queues for updates.")}
        className="dashboard-section"
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title={t("pendingVerification")} value={dashboard?.pendingVerifications ?? 0} hint={t("prescriptionsAwaitingPharmacistReview")} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard title={t("lowStockItems")} value={dashboard?.lowStockItems ?? 0} hint={t("medicinesAtOrBelowReorder")} icon={<Package className="h-4 w-4" />} />
        <StatCard title={t("dispensedToday")} value={dashboard?.dispensedToday ?? 0} hint={t("completedPickupsToday")} icon={<ShoppingBag className="h-4 w-4" />} />
        <StatCard title={t("inventoryItems")} value={dashboard?.activeInventoryItems ?? 0} hint={t("activeStockEntries")} icon={<Pill className="h-4 w-4" />} />
      </div>
      <PharmacistPremiumCard
        title={
          <span className="inline-flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-400" />
            {t("pharmacyWorkflow")}
          </span>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 hover:bg-white/10 transition-colors">
            <p className="text-sm font-medium text-slate-400">{t("inventoryCoordination")}</p>
            <p className="mt-3 text-2xl font-bold text-white">{t("ready")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("addMedicineStockMonitor")}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 hover:bg-white/10 transition-colors">
            <p className="text-sm font-medium text-slate-400">{t("dispensingVerification")}</p>
            <p className="mt-3 text-2xl font-bold text-white">{t("ready")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("verifyPrescriptionsTrackPickup")}</p>
          </div>
        </div>
      </PharmacistPremiumCard>
      <AiPharmacistInsightsPanel pharmacistId={pharmacistId} />
    </>
  );
}
