import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Stethoscope, CalendarPlus, ClipboardList, Pill, Bell,
  Heart, Activity, BookOpen, Route, Eye, Folder, MessageCircle, Bot, Phone, Mic, Smile,
  Users, BellRing, UserCircle
} from "lucide-react";

export default function PatientSidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar" role="navigation" aria-label="Main Navigation">
      <div className="brand-row">
        <div className="wordmark">TELECARE<span>+</span></div>
      </div>

      <div className="nav-section">
        <div className="nav-section-label">Care</div>
        <Link className={`nav-item ${location.pathname === '/patient' ? 'active' : ''}`} to="/patient" aria-current={location.pathname === '/patient' ? 'page' : undefined}>
          <LayoutDashboard />Dashboard
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/appointments') ? 'active' : ''}`} to="/patient/appointments" aria-current={location.pathname.includes('/appointments') ? 'page' : undefined}>
          <CalendarDays />Appointments
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/triage') ? 'active' : ''}`} to="/patient/triage" aria-current={location.pathname.includes('/triage') ? 'page' : undefined}>
          <Stethoscope />Triage
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/book') ? 'active' : ''}`} to="/patient/book" aria-current={location.pathname.includes('/book') ? 'page' : undefined}>
          <CalendarPlus />Book visit
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/care-plans') ? 'active' : ''}`} to="/patient/care-plans" aria-current={location.pathname.includes('/care-plans') ? 'page' : undefined}>
          <ClipboardList />Care Plans
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-section-label">Medications</div>
        <Link className={`nav-item ${location.pathname.includes('/prescriptions') ? 'active' : ''}`} to="/patient/prescriptions" aria-current={location.pathname.includes('/prescriptions') ? 'page' : undefined}>
          <Pill />Prescriptions
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/reminders') ? 'active' : ''}`} to="/patient/reminders" aria-current={location.pathname.includes('/reminders') ? 'page' : undefined}>
          <Bell />Reminders
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-section-label">Health</div>
        <Link className={`nav-item ${location.pathname.includes('/health') ? 'active' : ''}`} to="/patient/health" aria-current={location.pathname.includes('/health') ? 'page' : undefined}>
          <Heart />Health
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/timeline') ? 'active' : ''}`} to="/patient/timeline" aria-current={location.pathname.includes('/timeline') ? 'page' : undefined}>
          <Activity />Timeline
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/education') ? 'active' : ''}`} to="/patient/education" aria-current={location.pathname.includes('/education') ? 'page' : undefined}>
          <BookOpen />Education
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/future-care') ? 'active' : ''}`} to="/patient/future-care" aria-current={location.pathname.includes('/future-care') ? 'page' : undefined}>
          <Route />Future Care
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/observations') ? 'active' : ''}`} to="/patient/observations" aria-current={location.pathname.includes('/observations') ? 'page' : undefined}>
          <Eye />Observations
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/records') ? 'active' : ''}`} to="/patient/records" aria-current={location.pathname.includes('/records') ? 'page' : undefined}>
          <Folder />Records
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-section-label">Support</div>
        <Link className={`nav-item ${location.pathname.includes('/messages') ? 'active' : ''}`} to="/patient/messages" aria-current={location.pathname.includes('/messages') ? 'page' : undefined}>
          <MessageCircle />Messages
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/chatbot') ? 'active' : ''}`} to="/patient/chatbot" aria-current={location.pathname.includes('/chatbot') ? 'page' : undefined}>
          <Bot />AI Chatbot
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/ivr') ? 'active' : ''}`} to="/patient/ivr" aria-current={location.pathname.includes('/ivr') ? 'page' : undefined}>
          <Phone />IVR Booking
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/voice-assist') ? 'active' : ''}`} to="/patient/voice-assist" aria-current={location.pathname.includes('/voice-assist') ? 'page' : undefined}>
          <Mic />Voice Assist
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/mental-health-checkin') ? 'active' : ''}`} to="/patient/mental-health-checkin" aria-current={location.pathname.includes('/mental-health-checkin') ? 'page' : undefined}>
          <Smile />Mental Health Check-in
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-section-label">Family &amp; Community</div>
        <Link className={`nav-item ${location.pathname.includes('/family-network') ? 'active' : ''}`} to="/patient/family-network" aria-current={location.pathname.includes('/family-network') ? 'page' : undefined}>
          <Users />Family Network
        </Link>
        <Link className={`nav-item ${location.pathname.includes('/alerts') ? 'active' : ''}`} to="/patient/alerts" aria-current={location.pathname.includes('/alerts') ? 'page' : undefined}>
          <BellRing />Notifications
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-section-label">Profile</div>
        <Link className={`nav-item ${location.pathname.includes('/profile') ? 'active' : ''}`} to="/patient/profile" aria-current={location.pathname.includes('/profile') ? 'page' : undefined}>
          <UserCircle />Profile
        </Link>
      </div>
    </aside>
  );
}
