import { useLanguage } from "../context/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Stethoscope, CalendarPlus, ClipboardList, Pill, Bell,
  Heart, Activity, BookOpen, Route, Eye, Folder, MessageCircle, Bot, Phone, Mic, Smile,
  Users, BellRing, UserCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "../utils/motionVariants";
import { DynamicStateObject } from "./../types/DynamicState";

export default function PatientSidebar() {
  const { t } = useLanguage();
  const location = useLocation();

  const isCurrent = (path: DynamicStateObject, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.includes(path);
  };

  const navItemClass = (active: DynamicStateObject) => {
    const baseClass = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14.5px] transition-all duration-200 group relative overflow-hidden whitespace-nowrap";
    if (active) {
      return `${baseClass} bg-gradient-to-r from-[var(--primary-dark)] to-[var(--primary)] text-[#04231A] shadow-[var(--tc-shadow-primary)] font-semibold`;
    }
    return `${baseClass} text-[var(--tc-text-muted)] hover:bg-[var(--tc-surface-muted)] hover:text-white`;
  };

  const iconClass = (active: DynamicStateObject) => {
    const baseClass = "transition-transform duration-200 group-hover:scale-110 shrink-0";
    if (active) {
      return `${baseClass} text-[#04231A]`;
    }
    return `${baseClass} text-[var(--tc-text-soft)] group-hover:text-white`;
  };

  const badgeClass = "ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full";
  const dotBadgeClass = "ml-auto w-2 h-2 rounded-full bg-rose-500";
  const badgeActive = "ml-auto bg-[#04231A] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full";
  const dotBadgeActive = "ml-auto w-2 h-2 rounded-full bg-[#04231A]";

  return (
    <aside className="hidden lg:flex flex-col shrink-0 w-[280px] min-w-[280px] max-w-[280px] bg-[var(--tc-sidebar-bg)] backdrop-blur-2xl border-r border-[var(--tc-border)] h-full sticky top-0" aria-label="Main Navigation">
      <div className="flex items-center p-6 pb-4 shrink-0 border-b border-[var(--tc-border-subtle)] lg:border-none">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center shadow-[var(--tc-shadow-primary)] mr-3">
            <span className="text-[#04231A] font-extrabold text-base tracking-tighter">T+</span>
        </div>
        <div className="font-display font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
          {t("tELECARE") || "TELECARE"}<span className="text-[var(--primary)]">+</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-6">
        <motion.nav className="space-y-8" variants={staggerContainer} initial="initial" animate="animate">
          
          {/* Main Section */}
          <motion.div variants={fadeInUp}>
            <p className="px-3 mb-3 text-[11px] font-bold tracking-[0.15em] text-[var(--tc-text-soft)] uppercase">{t("main") || "Main"}</p>
            <ul className="space-y-1.5">
              <li>
                <Link className={navItemClass(isCurrent('/patient', true))} to="/patient">
                  <LayoutDashboard size={20} className={iconClass(isCurrent('/patient', true))} strokeWidth={2.2} />
                  <span>{t("dashboard") || "Dashboard"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/alerts'))} to="/patient/alerts">
                  <BellRing size={20} className={iconClass(isCurrent('/patient/alerts'))} strokeWidth={2.2} />
                  <span>{t("notifications") || "Notifications"}</span>
                  <span className={isCurrent('/patient/alerts') ? dotBadgeActive : dotBadgeClass}></span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/profile'))} to="/patient/profile">
                  <UserCircle size={20} className={iconClass(isCurrent('/patient/profile'))} strokeWidth={2.2} />
                  <span>{t("profile") || "Profile"}</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Care Section */}
          <motion.div variants={fadeInUp}>
            <p className="px-3 mb-3 text-[11px] font-bold tracking-[0.15em] text-[var(--tc-text-soft)] uppercase">{t("care") || "Care"}</p>
            <ul className="space-y-1.5">
              <li>
                <Link className={navItemClass(isCurrent('/patient/appointments'))} to="/patient/appointments">
                  <CalendarDays size={20} className={iconClass(isCurrent('/patient/appointments'))} strokeWidth={2.2} />
                  <span>{t("appointments") || "Appointments"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/book'))} to="/patient/book">
                  <CalendarPlus size={20} className={iconClass(isCurrent('/patient/book'))} strokeWidth={2.2} />
                  <span>{t("bookVisit") || "Book visit"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/care-plans'))} to="/patient/care-plans">
                  <ClipboardList size={20} className={iconClass(isCurrent('/patient/care-plans'))} strokeWidth={2.2} />
                  <span>{t("carePlans") || "Care Plans"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/triage'))} to="/patient/triage">
                  <Stethoscope size={20} className={iconClass(isCurrent('/patient/triage'))} strokeWidth={2.2} />
                  <span>{t("triage") || "Triage"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/prescriptions'))} to="/patient/prescriptions">
                  <Pill size={20} className={iconClass(isCurrent('/patient/prescriptions'))} strokeWidth={2.2} />
                  <span>{t("prescriptions") || "Prescriptions"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/reminders'))} to="/patient/reminders">
                  <Bell size={20} className={iconClass(isCurrent('/patient/reminders'))} strokeWidth={2.2} />
                  <span>{t("reminders") || "Reminders"}</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Health Section */}
          <motion.div variants={fadeInUp}>
            <p className="px-3 mb-3 text-[11px] font-bold tracking-[0.15em] text-[var(--tc-text-soft)] uppercase">{t("health") || "Health"}</p>
            <ul className="space-y-1.5">
              <li>
                <Link className={navItemClass(isCurrent('/patient/health'))} to="/patient/health">
                  <Heart size={20} className={iconClass(isCurrent('/patient/health'))} strokeWidth={2.2} />
                  <span>{t("healthProfile") || "Health Profile"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/timeline'))} to="/patient/timeline">
                  <Activity size={20} className={iconClass(isCurrent('/patient/timeline'))} strokeWidth={2.2} />
                  <span>{t("timeline") || "Timeline"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/observations'))} to="/patient/observations">
                  <Eye size={20} className={iconClass(isCurrent('/patient/observations'))} strokeWidth={2.2} />
                  <span>{t("observations") || "Observations"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/records'))} to="/patient/records">
                  <Folder size={20} className={iconClass(isCurrent('/patient/records'))} strokeWidth={2.2} />
                  <span>{t("records") || "Records"}</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Smart Services Section */}
          <motion.div variants={fadeInUp}>
            <p className="px-3 mb-3 text-[11px] font-bold tracking-[0.15em] text-[var(--tc-text-soft)] uppercase">{t("smartServices") || "Smart Services"}</p>
            <ul className="space-y-1.5">
              <li>
                <Link className={navItemClass(isCurrent('/patient/chatbot'))} to="/patient/chatbot">
                  <Bot size={20} className={iconClass(isCurrent('/patient/chatbot'))} strokeWidth={2.2} />
                  <span>{t("aIChatbot") || "AI Chatbot"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/voice-assist'))} to="/patient/voice-assist">
                  <Mic size={20} className={iconClass(isCurrent('/patient/voice-assist'))} strokeWidth={2.2} />
                  <span>{t("voiceAssist") || "Voice Assist"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/ivr'))} to="/patient/ivr">
                  <Phone size={20} className={iconClass(isCurrent('/patient/ivr'))} strokeWidth={2.2} />
                  <span>{t("iVRBooking") || "IVR Booking"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/mental-health-checkin'))} to="/patient/mental-health-checkin">
                  <Smile size={20} className={iconClass(isCurrent('/patient/mental-health-checkin'))} strokeWidth={2.2} />
                  <span>{t("mentalHealth") || "Mental Health"}</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Resources Section */}
          <motion.div variants={fadeInUp}>
            <p className="px-3 mb-3 text-[11px] font-bold tracking-[0.15em] text-[var(--tc-text-soft)] uppercase">{t("resources") || "Resources"}</p>
            <ul className="space-y-1.5">
              <li>
                <Link className={navItemClass(isCurrent('/patient/education'))} to="/patient/education">
                  <BookOpen size={20} className={iconClass(isCurrent('/patient/education'))} strokeWidth={2.2} />
                  <span>{t("education") || "Education"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/future-care'))} to="/patient/future-care">
                  <Route size={20} className={iconClass(isCurrent('/patient/future-care'))} strokeWidth={2.2} />
                  <span>{t("futureCare") || "Future Care"}</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/messages'))} to="/patient/messages">
                  <MessageCircle size={20} className={iconClass(isCurrent('/patient/messages'))} strokeWidth={2.2} />
                  <span>{t("messages") || "Messages"}</span>
                  <span className={isCurrent('/patient/messages') ? badgeActive : badgeClass}>3</span>
                </Link>
              </li>
              <li>
                <Link className={navItemClass(isCurrent('/patient/family-network'))} to="/patient/family-network">
                  <Users size={20} className={iconClass(isCurrent('/patient/family-network'))} strokeWidth={2.2} />
                  <span>{t("familyNetwork") || "Family Network"}</span>
                </Link>
              </li>
            </ul>
          </motion.div>

        </motion.nav>
      </div>
    </aside>
  );
}
