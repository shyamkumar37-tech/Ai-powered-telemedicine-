import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarDays, ClipboardList, ChevronRight } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate } from "react-router-dom";

export interface PriorityActionsCardProps {
  alerts?: DynamicState;
  appointments?: DynamicState;
  tasks?: DynamicState;
  isLoading?: boolean;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PriorityActionsCard({ 
  alerts = [], 
  appointments = [], 
  tasks = [],
  isLoading = false 
}: PriorityActionsCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  if (isLoading) {
    return (
      <Card className="flex-1 flex flex-col justify-center h-full min-h-[300px]">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-4 bg-tc-surface-muted rounded w-1/3 mb-2"></div>
          <div className="h-12 bg-tc-surface-muted rounded w-full"></div>
          <div className="h-12 bg-tc-surface-muted rounded w-full"></div>
        </div>
      </Card>
    );
  }

  const hasActions = alerts.length > 0 || appointments.length > 0 || tasks.length > 0;

  return (
    <Card className="flex flex-col h-full overflow-hidden min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-semibold text-tc-text">
          {t("priorityActions") || "Priority Actions"}
        </h3>
        {hasActions && (
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
            {(alerts.length + appointments.length + tasks.length)} {t("pending") || "Pending"}
          </span>
        )}
      </div>

      {!hasActions ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-16 h-16 rounded-full bg-tc-surface-muted flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-tc-text-soft" />
          </div>
          <h4 className="text-tc-text font-medium mb-1">{t("allCaughtUp") || "You're all caught up!"}</h4>
          <p className="text-sm text-tc-text-muted">{t("noPendingActionsRequired") || "No pending actions required at this time."}</p>
        </div>
      ) : (
        <motion.div 
          variants={container} 
          initial="hidden" 
          animate="show" 
          className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2"
        >
          {/* High Priority Alerts */}
          {alerts.map((alert: DynamicStateObject, idx: DynamicStateObject) => (
            <motion.div key={`alert-${idx}`} variants={item} className="group flex items-start gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 transition-colors cursor-pointer" onClick={() => navigate('/patient/alerts')}>
              <div className="bg-rose-500/20 p-2 rounded-lg mt-0.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-rose-500">{t("criticalHealthAlert") || "Critical Health Alert"}</h4>
                <p className="text-xs text-tc-text-muted mt-1 leading-relaxed line-clamp-2">{alert}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-500/50 group-hover:text-rose-500 group-hover:translate-x-1 transition-all mt-1" />
            </motion.div>
          ))}

          {/* Upcoming Appointments */}
          {appointments.map((appt: DynamicStateObject, idx: DynamicStateObject) => (
            <motion.div key={`appt-${idx}`} variants={item} className="group flex items-start gap-4 p-4 rounded-xl bg-tc-surface-elevated border border-tc-border hover:border-tc-border-strong transition-colors cursor-pointer" onClick={() => navigate('/patient/appointments')}>
              <div className="bg-blue-500/10 p-2 rounded-lg mt-0.5">
                <CalendarDays className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-tc-text">{t("upcomingAppointment") || "Upcoming Appointment"}</h4>
                <p className="text-xs text-tc-text-muted mt-1 leading-relaxed">{appt.doctorName} • {new Date(appt.date).toLocaleDateString()}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-tc-text-soft group-hover:text-tc-text group-hover:translate-x-1 transition-all mt-1" />
            </motion.div>
          ))}

          {/* Daily Tasks / Medications */}
          {tasks.map((task: DynamicStateObject, idx: DynamicStateObject) => (
            <motion.div key={`task-${idx}`} variants={item} className="group flex items-start gap-4 p-4 rounded-xl bg-tc-surface-elevated border border-tc-border hover:border-tc-border-strong transition-colors cursor-pointer" onClick={() => navigate('/patient/timeline')}>
              <div className="bg-emerald-500/10 p-2 rounded-lg mt-0.5">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-tc-text">{t("dailyTask") || "Daily Task"}</h4>
                <p className="text-xs text-tc-text-muted mt-1 leading-relaxed line-clamp-2">{task}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-tc-text-soft group-hover:text-tc-text group-hover:translate-x-1 transition-all mt-1" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}
