import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { buildLoginRedirect } from "../utils/authSession";
import { useLanguage } from "../context/LanguageContext";
import { LogOut, Clock, Calendar, CheckCircle2, AlertTriangle, Plus, CalendarDays
} from "lucide-react";
import PatientSidebar from "../components/PatientSidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ConsultationPrepPanel from "../components/patient/ConsultationPrepPanel";
import QRCheckIn from "../components/patient/QRCheckIn";
import { fetchPatientAppointments } from "../services/telecareService";
import { DynamicState, DynamicStateObject } from "../types/DynamicState";

function toTitleCase(str: DynamicStateObject) {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (s: DynamicStateObject) => s.toUpperCase());
}

export default function PatientAppointmentsPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage() || { language: "en" };

  const [isLoading, setIsLoading] = useState<DynamicState>(true);
  const [filter, setFilter] = useState<DynamicState>("upcoming"); // upcoming, requested, past
  const [appointments, setAppointments] = useState<DynamicStateObject[]>([]);
  const [isQROpen, setIsQROpen] = useState<DynamicState>(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchPatientAppointments(auth.profileId)
      .then((data: DynamicStateObject) => {
        if (!active) return;
        const formatted = (Array.isArray(data) ? data : []).map((appt: DynamicStateObject) => {
          let filterSet = "upcoming";
          const statusLower = (appt.status || "").toLowerCase();
          if (statusLower === 'completed' || statusLower === 'cancelled') {
             filterSet = 'past';
          } else if (statusLower === 'requested' || statusLower === 'pending') {
             filterSet = 'requested';
          }
          
          const dt = new Date(appt.appointmentDateTime);
          
          return {
            ...appt,
            filterSet,
            doctor: appt.doctorName || "Doctor",
            avatar: (appt.doctorName ? appt.doctorName.replace("Dr. ", "") : "Dr").substring(0, 2).toUpperCase(),
            date: dt.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
            time: dt.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }),
            reason: appt.concernSummary || "No concern summary provided.",
            actions: filterSet === 'past' ? [{ label: "View details", style: "outline" }] : [{ label: "Reschedule", style: "outline" }, { label: "Join visit", style: "primary" }],
            isEmergency: appt.triageLevel === "EMERGENCY_AMBULANCE",
            badges: [{ label: toTitleCase(appt.status || "Unknown"), type: statusLower }]
          };
        });
        setAppointments(formatted);
      })
      .catch((err: DynamicStateObject) => console.error(err))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [auth.profileId]);

  const handleLogout = () => {
    logout();
    navigate(buildLoginRedirect(""), { replace: true });
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt: DynamicStateObject) => appt.filterSet === filter);
  }, [filter, appointments]);

  const renderBadgeIcon = (type: DynamicStateObject) => {
    switch (type) {
      case "confirmed": return <CheckCircle2 size={12} />;
      case "requested": return <Clock size={12} />;
      case "booked": return <Calendar size={12} />;
      case "priority": return <AlertTriangle size={12} />;
      case "emergency": return <AlertTriangle size={12} />;
      default: return null;
    }
  };

  return (
    <div className="shell">
      <PatientSidebar />

      <main className="w-full flex-1 min-w-0">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <div className="greeting-eyebrow">{t("patientWorkspace") || "Patient workspace"}</div>
            <h1>{t("appointments") || "Appointments"}</h1>
            <p className="subtext">{t("reviewManageAndBookYourUpcomingAndPastVisits") || "Review, manage, and book your upcoming and past visits."}</p>
          </div>
          <div className="status-pills">
            <LanguageSwitcher hideLabel />
            <span className="pill verified"><i className="ti ti-shield-check"></i>Verified care team</span>
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="pill cursor-pointer hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-white transition-colors"
            >
              <LogOut size={14} />
              {t("logout") || "Logout"}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title flex items-center gap-2 text-base"><CalendarDays size={18}/>{t("appointmentHistory") || "Appointment history"}</h2>
          <Link to="/patient/book" className="btn inline-flex items-center gap-2"><Plus size={16}/>{t("bookAppointment") || "Book appointment"}</Link>
        </div>

        {/* CONSULTATION PREP SECTION */}
        {auth?.profileId && (
          <ConsultationPrepPanel patientId={auth.profileId} />
        )}

        {/* FILTER TABS */}
        <div className="flex gap-2 my-6 border-b border-[var(--border)] pb-4 overflow-x-auto" role="tablist" aria-label="Filter appointments">
          {['upcoming', 'requested', 'past'].map((f: DynamicStateObject) => (
            <button 
              key={f}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 capitalize cursor-pointer ${filter === f ? 'bg-[var(--primary-dim)] text-[var(--primary)] border border-[var(--primary)]' : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'}`}
              onClick={() => { setFilter(f); if(f==='upcoming') setIsLoading(true); }}
              role="tab"
              aria-selected={filter === f}
            >
              {f} ({appointments.filter((a: DynamicStateObject) => a.filterSet === f).length})
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4" role="region" aria-live="polite">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i: DynamicStateObject) => (
                <div key={i} className="card animate-pulse flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-1/4 bg-[var(--surface-2)] rounded"></div>
                    <div className="h-4 w-1/5 bg-[var(--surface-2)] rounded"></div>
                    <div className="h-4 w-full bg-[var(--surface-2)] rounded mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="card text-center p-12">
              <CalendarDays size={40} className="text-[var(--ink-muted)] mx-auto mb-3 opacity-40" />
              <h3 className="section-title mb-2">{t("noAppointmentsFound") || "No appointments found"}</h3>
              <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto mb-6">You don't have any {filter} appointments right now. Book a new visit to connect with your care team.</p>
              <Link to="/patient/book" className="btn inline-flex items-center gap-2 mx-auto"><Plus size={16}/>{t("bookVisit") || "Book visit"}</Link>
            </div>
          ) : (
            filteredAppointments.map((appt: DynamicStateObject) => (
              <div key={appt.id} className="card flex flex-col sm:flex-row gap-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0 ${appt.isEmergency ? 'bg-[var(--alert-dim)] text-[var(--alert)]' : 'bg-[var(--surface-2)] text-[var(--live)]'}`}>
                  {appt.isEmergency ? <AlertTriangle size={20} /> : appt.avatar}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-sm text-[var(--ink)]">{appt.doctor}</h3>
                      <div className="text-xs text-[var(--ink-muted)] font-mono">{appt.date} · {appt.time}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {appt.badges.map((b: DynamicStateObject, idx: DynamicStateObject) => {
                        let badgeStyle = "status-tag pending";
                        if (b.type === 'confirmed' || b.type === 'booked') badgeStyle = "status-tag confirmed";
                        if (b.type === 'priority' || b.type === 'emergency') badgeStyle = "status-tag refill";
                        
                        return (
                          <span key={idx} className={badgeStyle}>
                            {b.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed mb-4 flex-1">
                    {appt.reason}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {appt.actions.map((act: DynamicStateObject, idx: DynamicStateObject) => (
                      <button key={idx} className={act.style === 'primary' ? 'btn' : 'btn ghost'}>
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      
      {/* QR Check-in FAB */}
      <button
        onClick={() => setIsQROpen(true)}
        className="fixed bottom-6 right-6 z-[40] flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-[#04342C] shadow-lg hover:scale-105 transition-transform"
        aria-label="Scan QR Code to Check-in"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
      </button>

      <QRCheckIn 
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        onScanSuccess={(decodedText: unknown) => {
          if (import.meta.env.DEV) {
            console.log("Check in successful for ID:", decodedText);
          }
        }}
      />
    </div>
  );
}
