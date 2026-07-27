import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { buildLoginRedirect } from "../utils/authSession";
import { useLanguage } from "../context/LanguageContext";
import {
  Stethoscope, User, LogOut, Clock, Calendar, CheckCircle2, AlertTriangle, Plus, CalendarDays
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
    <div className="h-full w-full bg-canvas text-[var(--tc-text)] font-sans flex flex-col overflow-hidden lg:flex-row">
      <PatientSidebar />

      <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-y-auto relative z-0 pb-24 -1 p-6 lg:p-10 min-w-0" role="main">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fadeSlideUp">
          <div>
            <h1 className="font-display text-3xl font-medium mb-2">{t("appointments") || "Appointments"}</h1>
            <p className="text-ink-muted text-sm mb-3">{t("reviewManageAndBookYourUpcomingAndPastVisits") || "Review, manage, and book your upcoming and past visits."}</p>
            <div className="flex gap-2 items-center mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                <Stethoscope size={12} className="text-primary" />{t("care") || "Care"}</span>
              <div className="inline-flex items-center gap-2 text-xs text-ink-muted bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <User size={14} />
                Signed in as {auth?.fullName || "Anita Patient"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher hideLabel />
            <button 
              onClick={handleLogout} 
              aria-label="Log out"
              className="inline-flex items-center gap-2 px-4 py-2 bg-transparent text-ink-muted border border-white/10 rounded-element text-sm font-medium hover:bg-white/5 hover:text-ink transition-colors"
            >
              <LogOut size={16} />{t("logout") || "Logout"}</button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 animate-fadeSlideUp" style={{animationDelay: '0.1s'}}>
          <h2 className="font-display text-xl font-medium flex items-center gap-2"><CalendarDays size={20}/>{t("appointmentHistory") || "Appointment history"}</h2>
          <Link to="/patient/booking" className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2"><Plus size={16}/>{t("bookAppointment") || "Book appointment"}</Link>
        </div>

        {/* CONSULTATION PREP SECTION */}
        {auth?.profileId && (
          <ConsultationPrepPanel patientId={auth.profileId} />
        )}

        {/* FILTER TABS */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto animate-fadeSlideUp" style={{animationDelay: '0.1s'}} role="tablist" aria-label="Filter appointments">
          {['upcoming', 'requested', 'past'].map((f: DynamicStateObject) => (
            <button 
              key={f}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 capitalize ${filter === f ? 'bg-white/10 text-ink shadow-sm ring-1 ring-white/20' : 'text-ink-muted hover:text-ink hover:bg-white/5'}`}
              onClick={() => { setFilter(f); if(f==='upcoming') setIsLoading(true); }} // just dummy trigger to show loader for upcoming for now
              role="tab"
              aria-selected={filter === f}
            >
              {f} ({appointments.filter((a: DynamicStateObject) => a.filterSet === f).length})
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 animate-fadeSlideUp" style={{animationDelay: '0.2s'}} role="region" aria-live="polite">
          
          {isLoading ? (
            // LOADING STATE
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i: DynamicStateObject) => (
                <div key={i} className="flex gap-4 p-5 bg-white/5 border border-white/10 rounded-xl animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-white/10 shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-1/4 bg-white/10 rounded"></div>
                    <div className="h-4 w-1/5 bg-white/10 rounded"></div>
                    <div className="h-4 w-full bg-white/10 rounded mt-4"></div>
                    <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                    <div className="flex gap-2 mt-4">
                      <div className="w-24 h-8 bg-white/10 rounded-element"></div>
                      <div className="w-24 h-8 bg-white/10 rounded-element"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            // EMPTY STATE
            <div className="flex flex-col items-center justify-center p-16 text-center border border-white/5 rounded-xl border-dashed">
              <CalendarDays size={48} className="text-ink-muted/30 mb-4" />
              <h3 className="font-display text-lg mb-2">{t("noAppointmentsFound") || "No appointments found"}</h3>
              <p className="text-sm text-ink-muted max-w-md mb-6">You don't have any {filter} appointments right now. Book a new visit to connect with your care team.</p>
              <Link to="/patient/booking" className="px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors inline-flex items-center gap-2"><Plus size={16}/>{t("bookVisit") || "Book visit"}</Link>
            </div>
          ) : (
            // LOADED STATE
            filteredAppointments.map((appt: DynamicStateObject) => (
              <div key={appt.id} className={`flex flex-col sm:flex-row gap-5 p-5 rounded-xl border transition-colors ${appt.isEmergency ? 'bg-alert/5 border-alert/30' : 'bg-surface border-white/10 hover:border-white/20 hover:bg-white/5'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium shrink-0 ${appt.isEmergency ? 'bg-alert text-canvas' : 'bg-white/10 text-ink'}`}>
                  {appt.isEmergency ? <AlertTriangle size={20} /> : appt.avatar}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-medium">{appt.doctor}</h3>
                      <div className="text-sm text-ink-muted font-mono">{appt.date} · {appt.time}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {appt.badges.map((b: DynamicStateObject, idx: DynamicStateObject) => {
                        let badgeStyle = "bg-white/10 text-ink border-white/20";
                        if (b.type === 'confirmed' || b.type === 'booked') badgeStyle = "bg-primary/10 text-primary border-primary/20";
                        if (b.type === 'priority' || b.type === 'emergency') badgeStyle = "bg-alert/10 text-alert border-alert/20";
                        
                        return (
                          <span key={idx} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${badgeStyle}`}>
                            {renderBadgeIcon(b.type)}
                            {b.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed mb-4 flex-1">
                    {appt.reason}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {appt.actions.map((act: DynamicStateObject, idx: DynamicStateObject) => (
                      <button key={idx} className={act.style === 'primary' ? 'btn-primary text-sm py-2 px-4' : 'px-4 py-2 border border-white/20 rounded-element text-sm font-medium hover:bg-white/5 transition-colors'}>
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
      
      {/* QR Check-in FAB (Mobile optimized) */}
      <button
        onClick={() => setIsQROpen(true)}
        className="fixed bottom-6 right-6 z-[40] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tc-accent)] text-white shadow-lg shadow-[var(--tc-accent)]/30 hover:scale-105 transition-transform"
        aria-label="Scan QR Code to Check-in"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
      </button>

      <QRCheckIn 
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        onScanSuccess={(decodedText: DynamicStateObject) => {
          console.log("Check in successful for ID:", decodedText);
        }}
      />
    </div>
  );
}
