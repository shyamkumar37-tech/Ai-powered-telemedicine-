import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./patient-appointments-override.css";
import { buildLoginRedirect } from "../utils/authSession";
import { useLanguage } from "../context/LanguageContext";
import {
  LayoutDashboard, CalendarDays, Stethoscope, CalendarPlus, ClipboardList, Pill, Bell,
  Heart, Activity, BookOpen, Route, Eye, Folder, User, LogOut, Search, Clock, Calendar, MessageSquare, ChevronRight, Video, FileText, CheckCircle2, AlertTriangle, User2, Plus, Info
} from "lucide-react";
import PatientSidebar from "../components/PatientSidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { fetchPatientAppointments } from "../services/telecareService";
import { getApiErrorMessage } from "../utils/apiError";

function toTitleCase(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

export default function PatientAppointmentsPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage() || { language: "en" };

  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming"); // upcoming, requested, past
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchPatientAppointments(auth.profileId)
      .then(data => {
        if (!active) return;
        // Transform the data to have filterSet if not already mapped
        const formatted = (Array.isArray(data) ? data : []).map(appt => {
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
            actions: filterSet === 'past' ? [{ label: "View details", style: "outline" }] : [{ label: "Reschedule", style: "outline" }, { label: "Join visit", style: "teal" }],
            isEmergency: appt.triageLevel === "EMERGENCY_AMBULANCE",
            badges: [{ label: toTitleCase(appt.status || "Unknown"), type: statusLower }]
          };
        });
        setAppointments(formatted);
      })
      .catch(err => console.error(err))
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
    return appointments.filter(appt => appt.filterSet === filter);
  }, [filter, appointments]);

  const renderBadgeIcon = (type) => {
    switch (type) {
      case "confirmed": return <CheckCircle2 />;
      case "requested": return <Clock />;
      case "booked": return <Calendar />;
      case "priority": return <AlertTriangle />;
      case "emergency": return <AlertTriangle />;
      default: return null;
    }
  };

  return (
    <div id="tca-root">
      <div className="app">
        <PatientSidebar />

        <main id="page-main" role="main">
          <div className="topbar tca-animate-in">
            <div>
              <h1 className="serif">Appointments</h1>
              <p>Review, manage, and book your upcoming and past visits.</p>
              <div className="eyebrow-pill">
                <Stethoscope />Care
              </div>
              <div className="signed-in" style={{ marginTop: '8px' }}>
                <User />
                Signed in as {auth?.fullName || "Anita Patient"} · QA account
              </div>
            </div>
            <div className="topbar-right">
              <LanguageSwitcher customClass="lang" hideLabel />
              <button className="btn-ghost" onClick={handleLogout} aria-label="Log out">
                <LogOut />Logout
              </button>
            </div>
          </div>

          <div className="section-head tca-animate-in tca-delay-1">
            <h2 className="serif"><CalendarDays />Appointment history</h2>
            <button className="btn-teal"><Plus />Book appointment</button>
          </div>

          {/* FILTER TABS */}
          <div className="filter-tabs tca-animate-in tca-delay-1" role="tablist" aria-label="Filter appointments">
            <button 
              className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`} 
              onClick={() => { setFilter('upcoming'); setIsLoading(true); }}
              role="tab"
              aria-selected={filter === 'upcoming'}
            >
              Upcoming ({appointments.filter(a => a.filterSet === 'upcoming').length})
            </button>
            <button 
              className={`filter-tab ${filter === 'requested' ? 'active' : ''}`} 
              onClick={() => { setFilter('requested'); }}
              role="tab"
              aria-selected={filter === 'requested'}
            >
              Requested ({appointments.filter(a => a.filterSet === 'requested').length})
            </button>
            <button 
              className={`filter-tab ${filter === 'past' ? 'active' : ''}`} 
              onClick={() => { setFilter('past'); }}
              role="tab"
              aria-selected={filter === 'past'}
            >
              Past ({appointments.filter(a => a.filterSet === 'past').length})
            </button>
          </div>

          <div className="appt-list tca-animate-in tca-delay-2" role="region" aria-live="polite">
            
            {isLoading ? (
              // LOADING STATE
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="appt-card">
                    <div className="skeleton-block" style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0 }}></div>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-block" style={{ width: '150px', height: '20px', marginBottom: '8px' }}></div>
                      <div className="skeleton-block" style={{ width: '100px', height: '16px', marginBottom: '16px' }}></div>
                      <div className="skeleton-block" style={{ width: '100%', height: '16px', marginBottom: '8px' }}></div>
                      <div className="skeleton-block" style={{ width: '70%', height: '16px', marginBottom: '24px' }}></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="skeleton-block" style={{ width: '100px', height: '32px' }}></div>
                        <div className="skeleton-block" style={{ width: '100px', height: '32px' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : filteredAppointments.length === 0 ? (
              // EMPTY STATE
              <div className="empty-state-list">
                <CalendarDays />
                <h3>No appointments found</h3>
                <p>You don't have any {filter} appointments right now. Book a new visit to connect with your care team.</p>
                <button className="btn-outline-sm"><Plus />Book visit</button>
              </div>
            ) : (
              // LOADED STATE
              filteredAppointments.map(appt => (
                <div key={appt.id} className={`appt-card ${appt.isEmergency ? 'emergency-card' : ''}`}>
                  <div className="avatar">
                    {appt.isEmergency ? <AlertTriangle /> : appt.avatar}
                  </div>
                  <div className="appt-body">
                    <div className="appt-top">
                      <div className="appt-who">
                        <h3>{appt.doctor}</h3>
                        <div className="when mono">{appt.date} · {appt.time}</div>
                      </div>
                      <div className="appt-badges">
                        {appt.badges.map((b, idx) => (
                          <span key={idx} className={`status ${b.type}`}>
                            {renderBadgeIcon(b.type)}
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="appt-reason">{appt.reason}</p>
                    <div className="appt-actions">
                      {appt.actions.map((act, idx) => (
                        <button key={idx} className={act.style === 'teal' ? 'btn-teal-sm' : 'btn-outline-sm'}>
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
      </div>
    </div>
  );
}
