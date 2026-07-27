import { useLanguage } from "../context/LanguageContext";
import AdminLayout from "../components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminStatus } from "../services/telecareService";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";
import { Download, Users, TrendingUp, Clock, Activity, Database } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { motion } from "framer-motion";
import { DynamicStateObject } from "./../types/DynamicState";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const { data: adminStatus, isLoading } = useQuery({
    queryKey: ["adminStatus"],
    queryFn: () => fetchAdminStatus(),
  });

  const analytics = adminStatus?.analytics || {};
  const dataCounts = adminStatus?.dataCounts || {};
  
  const consultationData = analytics.consultationData || [];
  const aiRiskData = analytics.aiRiskData || [];

  const handleExportCSV = () => {
    exportToCSV(consultationData, "TeleCare_Consultation_Analytics");
  };

  const handleExportPDF = () => {
    const columns = [
      { header: "Date", dataKey: "day" },
      { header: "Total Consults", dataKey: "total" },
      { header: "Avg Time (m)", dataKey: "avgTime" }
    ];
    exportToPDF(consultationData, "TeleCare_Consultation_Report", columns, "TeleCare+ Consultation Analytics Report");
  };

  const layoutActions = (
    <>
      <button onClick={handleExportCSV} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition">
        <Download size={16} /> {t("cSV") || "CSV"}</button>
      <button onClick={handleExportPDF} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition">
        <Download size={16} /> {t("pDF") || "PDF"}</button>
    </>
  );

  return (
    <AdminLayout actions={layoutActions}>
      <motion.div 
        className="mx-auto max-w-7xl space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {/* Top KPIs */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-lg hover:border-teal-500/30 transition-colors">
            <div className="flex items-center gap-3 text-teal-400 mb-4"><Users size={20}/> <span className="font-semibold">{t("activePatients") || "Active Patients"}</span></div>
            <div className="text-4xl font-mono text-white">{isLoading ? "..." : (dataCounts.patients || 0).toLocaleString()}</div>
            <div className="mt-2 text-sm text-slate-400 flex items-center gap-1"><TrendingUp size={14} className="text-teal-400"/> +14% this week</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-lg hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-3 text-indigo-400 mb-4"><Clock size={20}/> <span className="font-semibold">{t("avgConsultTime") || "Avg Consult Time"}</span></div>
            <div className="text-4xl font-mono text-white">{isLoading ? "..." : (analytics.avgConsultTime || "0m")}</div>
            <div className="mt-2 text-sm text-slate-400 flex items-center gap-1"><TrendingUp size={14} className="text-indigo-400"/> Target: 15m</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-lg hover:border-amber-500/30 transition-colors">
            <div className="flex items-center gap-3 text-amber-400 mb-4"><Activity size={20}/> <span className="font-semibold">{t("aIRiskAlerts") || "AI Risk Alerts"}</span></div>
            <div className="text-4xl font-mono text-white">{isLoading ? "..." : (analytics.aiRiskAlerts || 0)}</div>
            <div className="mt-2 text-sm text-slate-400 flex items-center gap-1"><TrendingUp size={14} className="text-amber-400"/> {t("requiresClinicalReview") || "Requires clinical review"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-lg hover:border-rose-500/30 transition-colors">
            <div className="flex items-center gap-3 text-rose-400 mb-4"><Database size={20}/> <span className="font-semibold">{t("systemLoad") || "System Load"}</span></div>
            <div className="text-4xl font-mono text-white">{isLoading ? "..." : (analytics.systemLoad || "0%")}</div>
            <div className="mt-2 text-sm text-slate-400 flex items-center gap-1">{t("allServicesOperational") || "All services operational"}</div>
          </div>
        </motion.div>

        {/* Charts Row */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl relative">
            <h2 className="text-lg font-semibold text-white mb-6">{t("consultationVolumeTime") || "Consultation Volume & Time"}</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={consultationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis yAxisId="left" stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#4FB3A0" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="total" name="Total Consults" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgTime" name="Avg Time (m)" stroke="#4FB3A0" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl relative">
            <h2 className="text-lg font-semibold text-white mb-6">{t("aIRiskPredictionDistribution") || "AI Risk Prediction Distribution"}</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aiRiskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {aiRiskData.map((entry: DynamicStateObject, index: number | string) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Demo & Testing Tools */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t("demoTestingTools") || "Demo & Testing Tools"}</h2>
              <p className="text-sm text-slate-400">{t("utilitiesForGeneratingTestDataUseWithCaution") || "Utilities for generating test data. Use with caution."}</p>
            </div>
          </div>
          
          <div className="rounded-2xl border border-rose-600/30 bg-rose-600/5 p-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-600"></div>
            <h3 className="text-lg font-semibold text-white mb-2">{t("seedDemoData") || "Seed Demo Data"}</h3>
            <p className="text-sm text-slate-300 mb-6 max-w-2xl">
              {t("injectsSamplePatientsDoctorsAppointmentsAndMedicalRecordsIntoTheDatabase") || "Injects sample patients, doctors, appointments, and medical records into the database."}<strong> {t("thisDoesNotDeleteExistingData") || "This does not delete existing data."}</strong> {t("itOnlyAppendsNewRecords") || "It only appends new records."}</p>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white shadow shadow-rose-600/20 transition disabled:opacity-50"
              onClick={async () => {
                if (window.confirm("This will inject sample records into the database. Existing data will not be deleted. Continue?")) {
                  try {
                    const { toast } = await import('react-hot-toast');
                    const api = (await import('../services/api')).default;
                    const res = await api.post("/system/demo/seed");
                    toast.success("Demo data seeded successfully!");
                    window.location.reload();
                  } catch (err: DynamicStateObject) {
                    const { toast } = await import('react-hot-toast');
                    const { getApiErrorMessage } = await import('../utils/apiError');
                    toast.error(getApiErrorMessage(err, "Failed to seed data"));
                  }
                }
              }}
            >
              {t("triggerDataSeed") || "Trigger Data Seed"}</button>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
