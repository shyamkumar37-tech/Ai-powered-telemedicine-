import { Link, useLocation } from "react-router-dom";
import { DynamicStateObject } from "../types/DynamicState";

interface PatientSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export default function PatientSidebar({ isMobileOpen = false, onClose }: PatientSidebarProps) {
  const location = useLocation();

  const isCurrent = (path: DynamicStateObject, exact = false) => {
    if (exact) {
      return location.pathname === path || location.pathname === `${path}/dashboard`;
    }
    return location.pathname.startsWith(path);
  };

  const navClass = (path: string, exact = false) => {
    const active = isCurrent(path, exact);
    return `nav-item ${active ? "active" : ""}`;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" 
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation matching exact demo design */}
      <aside 
        className={`sidebar ${isMobileOpen ? "fixed inset-y-0 left-0 z-50 !flex w-[236px]" : ""}`} 
        aria-label="Main Navigation"
      >
        <div className="brand">
          <div className="brand-mark">T+</div>
          <div className="brand-name">TeleCare+</div>
        </div>

        <nav className="w-full">
          <Link className={navClass("/patient", true)} to="/patient" onClick={onClose}>
            <i className="ti ti-layout-dashboard"></i>
            <span>Dashboard</span>
          </Link>
          <Link className={navClass("/patient/appointments")} to="/patient/appointments" onClick={onClose}>
            <i className="ti ti-calendar-event"></i>
            <span>Appointments</span>
          </Link>
          <Link className={navClass("/patient/triage")} to="/patient/triage" onClick={onClose}>
            <i className="ti ti-stethoscope"></i>
            <span>Symptom triage</span>
          </Link>
          <Link className={navClass("/patient/health")} to="/patient/health" onClick={onClose}>
            <i className="ti ti-heart-rate-monitor"></i>
            <span>Vitals</span>
          </Link>
          <Link className={navClass("/patient/timeline")} to="/patient/timeline" onClick={onClose}>
            <i className="ti ti-timeline"></i>
            <span>Medical timeline</span>
          </Link>
          <Link className={navClass("/patient/records")} to="/patient/records" onClick={onClose}>
            <i className="ti ti-folder"></i>
            <span>Records vault</span>
          </Link>
          <Link className={navClass("/patient/prescriptions")} to="/patient/prescriptions" onClick={onClose}>
            <i className="ti ti-pill"></i>
            <span>Prescriptions</span>
          </Link>
          <Link className={navClass("/patient/reminders")} to="/patient/reminders" onClick={onClose}>
            <i className="ti ti-bell-ringing"></i>
            <span>Reminders</span>
          </Link>
          <Link className={navClass("/patient/chatbot")} to="/patient/chatbot" onClick={onClose}>
            <i className="ti ti-message-chatbot"></i>
            <span>AI assistant</span>
          </Link>
          <Link className={navClass("/patient/care-plans")} to="/patient/care-plans" onClick={onClose}>
            <i className="ti ti-clipboard-heart"></i>
            <span>Care plans</span>
          </Link>
          <Link className={navClass("/patient/mental-health-checkin")} to="/patient/mental-health-checkin" onClick={onClose}>
            <i className="ti ti-mood-smile"></i>
            <span>Mental wellness</span>
          </Link>
          <Link className={navClass("/patient/education")} to="/patient/education" onClick={onClose}>
            <i className="ti ti-books"></i>
            <span>Education</span>
          </Link>
          <Link className={navClass("/patient/family-network")} to="/patient/family-network" onClick={onClose}>
            <i className="ti ti-users"></i>
            <span>Family network</span>
          </Link>
          <Link className={navClass("/patient/messages")} to="/patient/messages" onClick={onClose}>
            <i className="ti ti-messages"></i>
            <span>Messages</span>
          </Link>
          <Link className={navClass("/patient/alerts")} to="/patient/alerts" onClick={onClose}>
            <i className="ti ti-alert-circle"></i>
            <span>Alerts</span>
            <span className="badge">4</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
