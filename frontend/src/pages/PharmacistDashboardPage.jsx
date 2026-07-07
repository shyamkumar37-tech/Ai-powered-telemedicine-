import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
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
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadDashboard = async (attempt = 0) => {
      if (!pharmacistId || auth?.role !== "PHARMACIST") {
        if (active) {
          setLoading(false);
        }
        return;
      }

      if (attempt === 0) {
        setLoading(true);
      }

      try {
        const data = await runWithRequestTimeout(
          (signal) => fetchPharmacistDashboard(pharmacistId, { signal }),
          { signal: controller.signal }
        );
        if (!active) {
          return;
        }
        setDashboard(data);
        setError("");
      } catch (err) {
        if (!active) {
          return;
        }

        const status = err?.response?.status;
        const isTransient = !err?.response || status === 408 || status === 429 || status >= 500;
        if (attempt === 0 && isTransient) {
          window.setTimeout(() => {
            if (active) {
              loadDashboard(1);
            }
          }, 450);
          return;
        }

        setError(getApiErrorMessage(err, t("unableLoadPharmacistDashboard")));
        logAsyncFailure("pharmacist-dashboard", err, { pharmacistId, attempt });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
      controller.abort();
    };
  }, [auth?.role, pharmacistId, reloadToken, t]);

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
      <SectionCard
        title={(
          <span className="inline-flex items-center gap-2">
            <Package className="h-4 w-4 text-teal-600" />
            {t("pharmacyWorkflow")}
          </span>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-mist p-4">
            <p className="text-sm text-slate-500">{t("inventoryCoordination")}</p>
            <p className="mt-2 text-xl font-semibold text-ink">{t("ready")}</p>
            <p className="mt-1 text-sm text-slate-600">{t("addMedicineStockMonitor")}</p>
          </div>
          <div className="rounded-2xl bg-mist p-4">
            <p className="text-sm text-slate-500">{t("dispensingVerification")}</p>
            <p className="mt-2 text-xl font-semibold text-ink">{t("ready")}</p>
            <p className="mt-1 text-sm text-slate-600">{t("verifyPrescriptionsTrackPickup")}</p>
          </div>
        </div>
      </SectionCard>
      <AiPharmacistInsightsPanel pharmacistId={pharmacistId} />
    </>
  );
}
