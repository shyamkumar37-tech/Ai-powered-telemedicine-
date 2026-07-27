import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AiCaregiverInsightsPanel from "../ai/components/AiCaregiverInsightsPanel";
import { fetchDashboard } from "../services/telecareService";
import api from "../services/api";
import { getApiErrorMessage } from "../utils/apiError";
import { logAsyncFailure, runWithRequestTimeout } from "../utils/requestLifecycle";
import { useWebSocket } from "../hooks/useWebSocket";
import { toast } from "react-hot-toast";
import { 
  Activity, Bell, CalendarDays, ShieldAlert, Users, TrendingUp, FlaskConical, 
  Stethoscope, PhoneCall, AlertTriangle, CheckCircle2, Clock, Heart, Wind, Thermometer
} from "lucide-react";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

export default function CaregiverDashboardPage() {
  const { auth } = useAuth();
  const { language, t } = useLanguage();
  const caregiverId = auth.profileId ?? auth.userId;
  const [dashboard, setDashboard] = useState<DynamicStateObject | null>(null);
  const [error, setError] = useState<DynamicState>("");
  const [loading, setLoading] = useState<DynamicState>(true);
  const [reloadToken, setReloadToken] = useState<DynamicState>(0);

  // Mock Care Tasks
  const [tasks, setTasks] = useState<DynamicState>([
    { id: 1, text: "Verify morning medications for Anita", done: false, time: "09:00 AM" },
    { id: 2, text: "Check BP reading for Robert", done: true, time: "10:30 AM" },
    { id: 3, text: "Call Dr. Smith regarding Anita's dosage", done: false, time: "01:00 PM" },
    { id: 4, text: "Update care notes for weekly review", done: false, time: "04:00 PM" }
  ]);

  useWebSocket(`/topic/caregiver/${caregiverId}/alerts`, (message: DynamicStateObject) => {
    toast.error(message.message || "Alert received!", {
      duration: 6000,
      position: 'top-right',
      className: "bg-red-500/20 border border-red-500/50 text-white backdrop-blur-md"
    });
  });

  const handleSimulateAlert = async () => {
    try {
      await api.post(`/caregivers/${caregiverId}/simulate-alert`, {
        patientName: (dashboard?.recentHealthAlerts as DynamicStateObject)?.[0]?.patientName || "Anita Patient"
      });
      toast.success("Alert simulation triggered.");
    } catch (e: DynamicStateObject) {
      toast.error("Failed to simulate alert");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!caregiverId || auth?.role !== "CAREGIVER") {
      if (active) {
        setDashboard(null);
        setError("");
        setLoading(false);
      }
      return () => { active = false; };
    }

    setLoading(true);
    runWithRequestTimeout(
      (signal: DynamicStateObject) => fetchDashboard(auth.role, caregiverId, { signal }),
      { signal: controller.signal }
    )
      .then((data: DynamicStateObject) => {
        if (!active) return;
        setDashboard(data);
        setError("");
      })
      .catch((err: DynamicStateObject) => {
        if (!active) return;
        setDashboard(null);
        setError(getApiErrorMessage(err, t("unableLoadCaregiverDashboard")));
        logAsyncFailure("caregiver-dashboard", err, { caregiverId });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [auth.role, caregiverId, language, t, reloadToken]);

  if (loading) {
    return (
      <div className="cg-premium-workspace p-6 space-y-6 min- flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-indigo-400 animate-pulse mx-auto" />
          <p className="cg-subheading">{t("loadingDashboardData") || "Loading Dashboard Data..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cg-premium-workspace p-6 min-">
        <div className="cg-card border-red-500/30 bg-red-500/10 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="cg-heading text-red-400 mb-2">{t("unableToLoadDashboard") || "Unable to Load Dashboard"}</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button className="cg-btn cg-btn-secondary" onClick={() => setReloadToken((c: DynamicStateObject) => c + 1)}>{t("retry") || "Retry"}</button>
        </div>
      </div>
    );
  }

  const alertsCount = Array.isArray(dashboard?.recentHealthAlerts) ? dashboard.recentHealthAlerts.length : 0;
  const pendingReminders = Number(dashboard?.pendingMedicationReminders || 0);
  const adherencePercentage = Number(dashboard?.adherencePercentage ?? 0);
  const totalAppointments = Number(dashboard?.totalAppointments || 0);
  const latestAlert = (dashboard?.recentHealthAlerts as DynamicStateObject)?.[0];

  const toggleTask = (id: number | string) => {
    setTasks(tasks.map((t: DynamicStateObject) => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="cg-premium-workspace space-y-6">
      
      {/* KPI Cards */}
      <div className="cg-grid-4">
        <div className="cg-card cg-card-interactive p-5 flex items-center gap-4">
          <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="cg-subheading">{t("patientsMonitored") || "Patients Monitored"}</p>
            <p className="text-2xl font-bold text-white mt-1">12 <span className="text-sm font-normal text-slate-400">{t("active") || "Active"}</span></p>
          </div>
        </div>

        <div className="cg-card cg-card-interactive p-5 flex items-center gap-4">
          <div className="bg-amber-500/20 p-3 rounded-xl text-amber-400 border border-amber-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="cg-subheading">{t("pendingTasks") || "Pending Tasks"}</p>
            <p className="text-2xl font-bold text-white mt-1">{pendingReminders} <span className="text-sm font-normal text-slate-400">{t("reminders") || "Reminders"}</span></p>
          </div>
        </div>

        <div className="cg-card cg-card-interactive p-5 flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="cg-subheading">{t("avgAdherence") || "Avg Adherence"}</p>
            <p className="text-2xl font-bold text-white mt-1">{adherencePercentage.toFixed(1)}%</p>
          </div>
        </div>

        <div className="cg-card cg-card-interactive p-5 flex items-center gap-4">
          <div className="bg-sky-500/20 p-3 rounded-xl text-sky-400 border border-sky-500/20">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <p className="cg-subheading">{t("upcomingVisits") || "Upcoming Visits"}</p>
            <p className="text-2xl font-bold text-white mt-1">{totalAppointments}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="cg-card p-4 flex flex-wrap gap-4 items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 border-indigo-500/20">
        <span className="cg-subheading text-indigo-300">Quick Actions:</span>
        <div className="flex flex-wrap gap-3">
          <button className="cg-btn cg-btn-primary" onClick={() => toast("Select a patient to log vitals", { icon: "🩺" })}>
            <Stethoscope className="w-4 h-4" /> {t("logVitals") || "Log Vitals"}</button>
          <button className="cg-btn cg-btn-secondary" onClick={() => toast("Select a patient to start visit", { icon: "📹" })}>
            <CalendarDays className="w-4 h-4" /> {t("startVisit") || "Start Visit"}</button>
          <button className="cg-btn cg-btn-secondary" onClick={() => toast("Contacting on-call doctor...", { icon: "📞" })}>
            <PhoneCall className="w-4 h-4" /> {t("contactDoctor") || "Contact Doctor"}</button>
          <button className="cg-btn cg-btn-danger" onClick={handleSimulateAlert} title="Simulate a new incoming emergency alert">
            <FlaskConical className="w-4 h-4" /> {t("simulateAlert") || "Simulate Alert"}</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          
          {/* Priority Actions Panel */}
          <div className="cg-card cg-card-elevated border-red-500/20 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="cg-heading flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" /> {t("priorityActions") || "Priority Actions"}</h3>
              {alertsCount > 0 && (
                <span className="cg-badge cg-badge-alert">{alertsCount} Urgent</span>
              )}
            </div>

            <div className="space-y-4">
              {alertsCount > 0 ? (
                dashboard.recentHealthAlerts.map((alert: DynamicStateObject, i: DynamicStateObject) => (
                  <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4">
                    <div className="bg-red-500/20 p-2 rounded-full text-red-400 mt-1">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-lg">{alert.patientName}</p>
                      <p className="text-red-300 text-sm mt-1">{alert.message}</p>
                      <p className="text-slate-400 text-xs mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                    <button className="cg-btn cg-btn-danger text-xs px-3 py-1.5" onClick={() => toast.success("Escalation triggered")}>{t("escalate") || "Escalate"}</button>
                  </div>
                ))
              ) : (
                <div className="bg-[var(--tc-surface)] border border-[var(--tc-border)] rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">{t("noActiveEscalations") || "No active escalations"}</p>
                  <p className="text-slate-400 text-sm">{t("allPriorityAlertsHaveBeenResolved") || "All priority alerts have been resolved."}</p>
                </div>
              )}

              {pendingReminders > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="font-semibold text-white">{t("medicationPending") || "Medication Pending"}</p>
                      <p className="text-slate-400 text-sm">{pendingReminders} reminders need follow-up</p>
                    </div>
                  </div>
                  <button className="cg-btn cg-btn-secondary text-xs">{t("review") || "Review"}</button>
                </div>
              )}
            </div>
          </div>

          {/* Patient Monitoring (Live Vitals Mock) */}
          <div className="cg-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="cg-heading flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> {t("liveMonitoringOverview") || "Live Monitoring Overview"}</h3>
              <select className="cg-input w-auto py-1 px-3 text-sm">
                <option>{latestAlert ? latestAlert.patientName : "All High-Risk Patients"}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center">
                <Heart className="w-6 h-6 text-red-400 mx-auto mb-2 animate-pulse" />
                <p className="text-2xl font-bold text-white">82 <span className="text-sm font-normal text-slate-400">bpm</span></p>
                <p className="text-xs text-slate-500 mt-1">{t("heartRate") || "Heart Rate"}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center">
                <Activity className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">135/85</p>
                <p className="text-xs text-slate-500 mt-1">{t("bloodPressure") || "Blood Pressure"}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center">
                <Wind className="w-6 h-6 text-sky-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">96<span className="text-sm font-normal text-slate-400">%</span></p>
                <p className="text-xs text-slate-500 mt-1">SpO₂</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center">
                <Thermometer className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">98.6<span className="text-sm font-normal text-slate-400">°F</span></p>
                <p className="text-xs text-slate-500 mt-1">{t("temperature") || "Temperature"}</p>
              </div>
            </div>
          </div>
          
          {/* Recent Activity Feed */}
          <div className="cg-card">
             <h3 className="cg-heading flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-indigo-400" /> {t("recentPatientActivity") || "Recent Patient Activity"}</h3>
             <div className="space-y-4">
                <div className="flex gap-4 items-start relative pl-4 border-l border-slate-700">
                  <div className="absolute w-2 h-2 rounded-full bg-emerald-400 -left-[5px] top-1.5"></div>
                  <div>
                    <p className="text-sm text-white">{t("robertMarkedEveningMedsAs") || "Robert marked Evening Meds as"}<span className="text-emerald-400 font-bold">{t("taken") || "Taken"}</span></p>
                    <p className="text-xs text-slate-500">10 mins ago</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start relative pl-4 border-l border-slate-700">
                  <div className="absolute w-2 h-2 rounded-full bg-indigo-400 -left-[5px] top-1.5"></div>
                  <div>
                    <p className="text-sm text-white">Anita uploaded a new BP reading (140/90)</p>
                    <p className="text-xs text-slate-500">45 mins ago</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start relative pl-4 border-l border-slate-700">
                  <div className="absolute w-2 h-2 rounded-full bg-sky-400 -left-[5px] top-1.5"></div>
                  <div>
                    <p className="text-sm text-white">{t("teleconsultationScheduledWithDrSmith") || "Teleconsultation scheduled with Dr. Smith"}</p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
             </div>
          </div>

        </div>

        <div className="space-y-6">
          
          {/* Adherence Overview Chart (Visual Mock) */}
          <div className="cg-card text-center">
            <h3 className="cg-heading flex items-center justify-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> {t("networkAdherence") || "Network Adherence"}</h3>
            <div className="relative inline-flex items-center justify-center w-40 h-40 rounded-full border-[12px] border-slate-800">
              <div 
                className="absolute inset-0 rounded-full border-[12px] border-emerald-400"
                style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${100 - adherencePercentage}%)` }}
              ></div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{adherencePercentage.toFixed(0)}%</p>
                <p className="text-xs text-slate-400 mt-1">{t("average") || "Average"}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-6 leading-relaxed">
              {t("patientMedicationComplianceIs") || "Patient medication compliance is"}<span className="text-emerald-400 font-bold">{t("stable") || "Stable"}</span> compared to last week.
            </p>
          </div>

          {/* Care Tasks Checklist */}
          <div className="cg-card">
            <h3 className="cg-heading flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" /> {t("todaySCareTasks") || "Today's Care Tasks"}</h3>
            <div className="space-y-3">
              {tasks.map((task: DynamicStateObject) => (
                <div 
                  key={task.id} 
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${task.done ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900/50 border-slate-700 hover:bg-slate-800'}`}
                  onClick={() => toggleTask(task.id)}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500'}`}>
                    {task.done && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${task.done ? 'text-slate-400 line-through' : 'text-white'}`}>{task.text}</p>
                    <p className="text-xs text-slate-500">{task.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations Panel */}
          <div className="rounded-xl shadow-lg border border-indigo-500/20">
            <div className="bg-indigo-900/40 p-4 border-b border-indigo-500/20">
              <h3 className="cg-heading flex items-center gap-2 text-indigo-300">
                <Activity className="w-5 h-5 animate-pulse" /> {t("aIRecommendations") || "AI Recommendations"}</h3>
            </div>
            <div className="bg-slate-900/80 p-0">
               <AiCaregiverInsightsPanel caregiverId={caregiverId} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
