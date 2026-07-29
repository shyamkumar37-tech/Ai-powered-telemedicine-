import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../utils/queryKeys";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AiPharmacistInsightsPanel from "../ai/components/AiPharmacistInsightsPanel";
import VirtualPharmacistConsultation from "../components/pharmacist/VirtualPharmacistConsultation";
import { fetchPharmacistDashboard } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";
import { runWithRequestTimeout } from "../utils/requestLifecycle";
import { toast } from "react-hot-toast";
import { 
  ClipboardCheck, Package, ShoppingBag, DollarSign, Activity, 
  AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, BarChart3, Clock, TestTube, Zap, Database, CalendarOff
} from "lucide-react";
import { motion } from "framer-motion";
import PriorityActionsCard from "../components/ui/PriorityActionsCard";
import AnimatedCounter from "../components/ui/AnimatedCounter";
import { staggerContainer, fadeInUp, hoverLift } from "../utils/motionVariants";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

export default function PharmacistDashboardPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const pharmacistId = auth.profileId ?? auth.userId;
  const [reloadToken, setReloadToken] = useState<DynamicState>(0);

  const { data: dashboard, error: queryError, isLoading: loading } = useQuery({
    queryKey: queryKeys.pharmacist.dashboard(pharmacistId),
    queryFn: async ({ signal }: DynamicStateObject) => {
      const data = await runWithRequestTimeout(
        (s: DynamicStateObject) => fetchPharmacistDashboard(pharmacistId, { signal: s }),
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
      <div className="ph-premium-workspace p-6 space-y-6 min- flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-emerald-400 animate-pulse mx-auto" />
          <p className="ph-subheading">{t("loadingPharmacyDashboard") || "Loading Pharmacy Dashboard..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ph-premium-workspace p-6 min-">
        <div className="ph-card border-red-500/30 bg-red-500/10 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="ph-heading text-red-400 mb-2">{t("unableToLoadDashboard") || "Unable to Load Dashboard"}</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button className="ph-btn ph-btn-secondary" onClick={() => setReloadToken((c: DynamicStateObject) => c + 1)}>{t("retry") || "Retry"}</button>
        </div>
      </div>
    );
  }

  const pendingVerifications = Number(dashboard?.pendingVerifications ?? 0);
  const lowStockItems = Number(dashboard?.lowStockItems ?? 0);
  const dispensedToday = Number(dashboard?.dispensedToday ?? 0);
  const activeInventoryItems = Number(dashboard?.activeInventoryItems ?? 0);
  
  // Mocks for advanced premium features
  const expiringMedicines = 14;
  const inventoryValue = "$42,500";
  
  const handleQuickAction = (action: DynamicStateObject) => {
    toast.success(`${action} initiated.`, {
      icon: "💊",
      style: { background: "#1e293b", color: "#fff", border: "1px solid #10B981" }
    });
  };

  return (
    <motion.div 
      className="ph-premium-workspace space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      
      {/* Hero Row: Action Hierarchy */}
      <motion.div variants={fadeInUp as any} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Priority Actions (New Unified Hub) */}
        <div className="h-full">
          <PriorityActionsCard 
            isLoading={loading}
            alerts={lowStockItems > 0 ? [`${lowStockItems} items are running low on stock.`] : []}
            tasks={pendingVerifications > 0 ? [`Verify ${pendingVerifications} pending prescriptions`] : []}
          />
        </div>

        {/* Quick Actions (Moved alongside Priority Actions) */}
        <div className="ph-card flex flex-col justify-center p-6 h-full">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            {t("quickActions") || "Quick Actions"}
          </h3>
          <div className="grid grid-cols-2 gap-3 h-full">
            <button 
              onClick={() => handleQuickAction("New Dispense")}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors text-slate-300 hover:text-white"
            >
              <ShoppingBag className="h-6 w-6 text-emerald-400" />
              <span className="text-sm font-medium">{t("newDispense") || "New Dispense"}</span>
            </button>
            <button 
              onClick={() => handleQuickAction("Stock Receive")}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors text-slate-300 hover:text-white"
            >
              <Package className="h-6 w-6 text-sky-400" />
              <span className="text-sm font-medium">{t("receiveStock") || "Receive Stock"}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards (Moved below Action Hierarchy) */}
      <motion.div 
        className="ph-grid-5 mt-8"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="ph-card ph-card-interactive p-5 flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="ph-subheading">{t("pendingVerification") || "Pending Verification"}</p>
            <p className="text-2xl font-bold text-white mt-1">
              <AnimatedCounter value={pendingVerifications} />
            </p>
          </div>
        </motion.div>
        <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="ph-card ph-card-interactive p-5 flex items-center gap-4">
          <div className="bg-sky-500/20 p-3 rounded-xl text-sky-400 border border-sky-500/20">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="ph-subheading">{t("totalDispensed") || "Total Dispensed"}</p>
            <p className="text-2xl font-bold text-white mt-1">
              <AnimatedCounter value={dispensedToday} />
            </p>
          </div>
        </motion.div>
        <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="ph-card ph-card-interactive p-5 flex items-center gap-4">
          <div className="bg-amber-500/20 p-3 rounded-xl text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="ph-subheading">{t("lowStockAlerts") || "Low Stock Alerts"}</p>
            <p className="text-2xl font-bold text-white mt-1">
              <AnimatedCounter value={lowStockItems} />
            </p>
          </div>
        </motion.div>
        <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="ph-card ph-card-interactive p-5 flex items-center gap-4">
          <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400 border border-purple-500/20">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="ph-subheading">{t("inventoryValue") || "Inventory Value"}</p>
            <p className="text-2xl font-bold text-white mt-1">
              $<AnimatedCounter value={42500} />
            </p>
          </div>
        </motion.div>
        <motion.div variants={fadeInUp as any} whileHover={hoverLift as any} className="ph-card ph-card-interactive p-5 flex items-center gap-4">
          <div className="bg-rose-500/20 p-3 rounded-xl text-rose-400 border border-rose-500/20">
            <CalendarOff className="h-6 w-6" />
          </div>
          <div>
            <p className="ph-subheading">{t("expiredMeds") || "Expired Meds"}</p>
            <p className="text-2xl font-bold text-white mt-1">
              <AnimatedCounter value={expiringMedicines} />
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div 
        className="ph-card p-4 flex flex-wrap gap-4 items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 border-emerald-500/20"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <span className="ph-subheading text-emerald-300">Quick Actions:</span>
        <div className="flex flex-wrap gap-3">
          <button className="ph-btn ph-btn-primary" onClick={() => handleQuickAction("Prescription Verification")}>
            <ClipboardCheck className="w-4 h-4" /> {t("verifyPrescription") || "Verify Prescription"}</button>
          <button className="ph-btn ph-btn-secondary" onClick={() => handleQuickAction("Dispense Medicine")}>
            <ShoppingBag className="w-4 h-4" /> {t("dispenseMedicine") || "Dispense Medicine"}</button>
          <button className="ph-btn ph-btn-secondary" onClick={() => handleQuickAction("Inventory Update")}>
            <Package className="w-4 h-4" /> {t("updateInventory") || "Update Inventory"}</button>
          <button className="ph-btn ph-btn-secondary border-amber-500/30 text-amber-400 hover:bg-amber-500/10" onClick={() => handleQuickAction("Restock Request")}>
            <RefreshCw className="w-4 h-4" /> {t("requestRestock") || "Request Restock"}</button>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          
          {/* Priority Actions & Alerts */}
          <div className="ph-card ph-card-elevated border-red-500/20 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="ph-heading flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" /> {t("priorityActions") || "Priority Actions"}</h3>
              <span className="ph-badge ph-badge-alert">1 Critical</span>
            </div>

            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4">
                <div className="bg-red-500/20 p-2 rounded-full text-red-400 mt-1">
                  <TestTube className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-lg">{t("severeDrugInteractionDetected") || "Severe Drug Interaction Detected"}</p>
                  <p className="text-red-300 text-sm mt-1">Warfarin + Amiodarone for Patient ID #892. High risk of bleeding.</p>
                  <p className="text-slate-400 text-xs mt-2">Prescription ID #P-4402 &bull; 10 mins ago</p>
                </div>
                <button className="ph-btn ph-btn-danger text-xs px-3 py-1.5" onClick={() => toast.success("Review initiated")}>{t("review") || "Review"}</button>
              </div>

              {lowStockItems > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="font-semibold text-white">{t("lowStockThreshold") || "Low Stock Threshold"}</p>
                      <p className="text-slate-400 text-sm">{lowStockItems} items require immediate restocking</p>
                    </div>
                  </div>
                  <button className="ph-btn ph-btn-secondary border-amber-500/30 text-amber-400 text-xs px-3 py-1.5">{t("viewList") || "View List"}</button>
                </div>
              )}
            </div>
          </div>

          {/* Verification Queue (Mocked for visual) */}
          <div className="ph-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="ph-heading flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" /> {t("verificationQueue") || "Verification Queue"}</h3>
              <button className="text-sm text-emerald-400 hover:text-emerald-300">{t("viewAll") || "View All"}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-3 text-sm font-medium text-slate-400">{t("rxID") || "Rx ID"}</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">{t("patient") || "Patient"}</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">{t("medications") || "Medications"}</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">{t("status") || "Status"}</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">{t("action") || "Action"}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 text-white font-medium">#RX-8821</td>
                    <td className="py-4 text-slate-300">{t("sarahJenkins") || "Sarah Jenkins"}</td>
                    <td className="py-4 text-slate-300">{t("amoxicillinIbuprofen") || "Amoxicillin, Ibuprofen"}</td>
                    <td className="py-4"><span className="ph-badge ph-badge-warn">{t("pending") || "Pending"}</span></td>
                    <td className="py-4"><button className="ph-btn ph-btn-secondary text-xs px-3 py-1">{t("verify") || "Verify"}</button></td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 text-white font-medium">#RX-8822</td>
                    <td className="py-4 text-slate-300">{t("marcusWright") || "Marcus Wright"}</td>
                    <td className="py-4 text-slate-300">{t("lisinopril10mg") || "Lisinopril 10mg"}</td>
                    <td className="py-4"><span className="ph-badge ph-badge-success">{t("verified") || "Verified"}</span></td>
                    <td className="py-4"><button className="ph-btn ph-btn-primary text-xs px-3 py-1">{t("dispense") || "Dispense"}</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory Overview */}
          <div className="ph-card">
            <h3 className="ph-heading flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-indigo-400" /> {t("inventoryOverview") || "Inventory Overview"}</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
               <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-400">{t("activeItems") || "Active Items"}</p>
                  <p className="text-2xl font-bold text-white mt-1">{activeInventoryItems}</p>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 border-l-4 border-l-amber-500">
                  <p className="text-sm text-slate-400">{t("lowStock") || "Low Stock"}</p>
                  <p className="text-2xl font-bold text-white mt-1">{lowStockItems}</p>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 border-l-4 border-l-red-500">
                  <p className="text-sm text-slate-400">Expiring &lt; 30d</p>
                  <p className="text-2xl font-bold text-white mt-1">{expiringMedicines}</p>
               </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-3 text-sm font-medium text-slate-400">{t("medicineName") || "Medicine Name"}</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">{t("category") || "Category"}</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">{t("stockLevel") || "Stock Level"}</th>
                    <th className="pb-3 text-sm font-medium text-slate-400">{t("expiryStatus") || "Expiry Status"}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 text-white font-medium">{t("metformin500mg") || "Metformin 500mg"}</td>
                    <td className="py-3 text-slate-300">{t("antidiabetic") || "Antidiabetic"}</td>
                    <td className="py-3"><span className="text-emerald-400 font-bold">1420</span> units</td>
                    <td className="py-3 text-slate-400">{t("valid") || "Valid"}</td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 text-white font-medium">{t("atorvastatin20mg") || "Atorvastatin 20mg"}</td>
                    <td className="py-3 text-slate-300">{t("statin") || "Statin"}</td>
                    <td className="py-3"><span className="text-amber-400 font-bold">45</span> units (Low)</td>
                    <td className="py-3 text-slate-400">{t("valid") || "Valid"}</td>
                  </tr>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 text-white font-medium">{t("amoxicillin250mg") || "Amoxicillin 250mg"}</td>
                    <td className="py-3 text-slate-300">{t("antibiotic") || "Antibiotic"}</td>
                    <td className="py-3"><span className="text-white font-bold">310</span> units</td>
                    <td className="py-3"><span className="text-red-400 font-medium">Expiring (12 days)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <VirtualPharmacistConsultation currentUserId={pharmacistId} recipientId="2" />
          
          {/* Drug Interaction Checker (Persistent Side Panel Mock) */}
          <div className="ph-card bg-slate-900 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <h3 className="ph-heading flex items-center gap-2 mb-4">
              <TestTube className="w-5 h-5 text-emerald-400" /> {t("interactionChecker") || "Interaction Checker"}</h3>
            <div className="space-y-4">
              <input type="text" className="ph-input" placeholder="Search medication to check..." />
              <div className="bg-[var(--tc-surface)] border border-[var(--tc-border)] rounded-xl p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">{t("enterDrugsToCheckForClinicalInteractionsAndContraindications") || "Enter drugs to check for clinical interactions and contraindications."}</p>
              </div>
            </div>
          </div>

          {/* Analytics Chart Mock */}
          <div className="ph-card text-center">
            <h3 className="ph-heading flex items-center justify-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-sky-400" /> {t("dispensingVolume") || "Dispensing Volume"}</h3>
            <div className="h-40 flex items-end justify-between gap-2 px-4 border-b border-l border-slate-700 pb-2">
              <div className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 rounded-t-sm h-[40%] transition-colors relative group">
                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">42</span>
              </div>
              <div className="w-full bg-emerald-500/40 hover:bg-emerald-500/60 rounded-t-sm h-[60%] transition-colors relative group">
                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">65</span>
              </div>
              <div className="w-full bg-emerald-500/60 hover:bg-emerald-500/80 rounded-t-sm h-[90%] transition-colors relative group">
                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">89</span>
              </div>
              <div className="w-full bg-emerald-500/80 hover:bg-emerald-500/100 rounded-t-sm h-[70%] transition-colors relative group">
                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">71</span>
              </div>
              <div className="w-full bg-sky-500/80 hover:bg-sky-500/100 rounded-t-sm h-[50%] transition-colors relative group">
                 <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">54</span>
              </div>
            </div>
            <div className="flex justify-between px-4 mt-2 text-xs text-slate-500">
              <span>{t("mon") || "Mon"}</span><span>{t("tue") || "Tue"}</span><span>{t("wed") || "Wed"}</span><span>{t("thu") || "Thu"}</span><span>{t("today") || "Today"}</span>
            </div>
          </div>

          {/* Recent Dispensing Activity */}
          <div className="ph-card">
             <h3 className="ph-heading flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-indigo-400" /> {t("recentActivity") || "Recent Activity"}</h3>
             <div className="space-y-4">
                <div className="flex gap-4 items-start relative pl-4 border-l border-slate-700">
                  <div className="absolute w-2 h-2 rounded-full bg-emerald-400 -left-[5px] top-1.5"></div>
                  <div>
                    <p className="text-sm text-white">{t("dispensed") || "Dispensed"}<span className="font-bold">{t("lisinopril") || "Lisinopril"}</span> to Patient #102</p>
                    <p className="text-xs text-slate-500">10 mins ago</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start relative pl-4 border-l border-slate-700">
                  <div className="absolute w-2 h-2 rounded-full bg-sky-400 -left-[5px] top-1.5"></div>
                  <div>
                    <p className="text-sm text-white">Verified Prescription #RX-8820</p>
                    <p className="text-xs text-slate-500">25 mins ago</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start relative pl-4 border-l border-slate-700">
                  <div className="absolute w-2 h-2 rounded-full bg-amber-400 -left-[5px] top-1.5"></div>
                  <div>
                    <p className="text-sm text-white">{t("restockRequestedFor") || "Restock requested for"}<span className="font-bold">{t("atorvastatin") || "Atorvastatin"}</span></p>
                    <p className="text-xs text-slate-500">1 hour ago</p>
                  </div>
                </div>
             </div>
          </div>

          {/* AI Recommendations Panel */}
          <div className="rounded-xl shadow-lg border border-emerald-500/20">
            <div className="bg-emerald-900/40 p-4 border-b border-emerald-500/20">
              <h3 className="ph-heading flex items-center gap-2 text-emerald-300">
                <Activity className="w-5 h-5 animate-pulse" /> {t("aIPharmacyAssistant") || "AI Pharmacy Assistant"}</h3>
            </div>
            <div className="bg-slate-900/80 p-0">
               <AiPharmacistInsightsPanel pharmacistId={pharmacistId} />
            </div>
          </div>
          
        </div>
      </div>
    </motion.div>
  );
}
