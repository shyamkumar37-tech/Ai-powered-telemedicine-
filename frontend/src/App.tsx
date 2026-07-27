import { lazy, Suspense, useEffect, useRef, ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import PageTransition from "./components/ui/PageTransition";
import PremiumLoadingState from "./components/ui/PremiumLoadingState";
import { trackRouteTransition } from "./services/telemetry";
import { useLanguage } from "./context/LanguageContext";
import CommandPalette from "./components/ui/CommandPalette";
const CaregiverDashboardPage = lazy(() => import("./pages/CaregiverDashboardPage"));
const CaregiverMonitoringPage = lazy(() => import("./pages/CaregiverMonitoringPage"));
const CaregiverInterventionsPage = lazy(() => import("./pages/CaregiverInterventionsPage"));
const CaregiverCareGapsPage = lazy(() => import("./pages/CaregiverCareGapsPage"));
const CaregiverMessagesPage = lazy(() => import("./pages/CaregiverMessagesPage"));
const DoctorDashboardPage = lazy(() => import("./pages/DoctorDashboardPage"));
const DoctorIntelligencePage = lazy(() => import("./pages/DoctorIntelligencePage"));
const DoctorMessagesPage = lazy(() => import("./pages/DoctorMessagesPage"));
const DoctorProfilePage = lazy(() => import("./pages/DoctorProfilePage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
import LoginPage from "./pages/LoginPage";
import { DynamicState } from "./types/DynamicState";

const PatientAppointmentsPage = lazy(() => import("./pages/PatientAppointmentsPage"));
const PatientBookingPage = lazy(() => import("./pages/PatientBookingPage"));
const PatientChatbotPage = lazy(() => import("./pages/PatientChatbotPage"));
const PatientDashboardPage = lazy(() => import("./pages/PatientDashboardPage"));
const PatientEducationPage = lazy(() => import("./pages/PatientEducationPage"));
const PatientHealthPage = lazy(() => import("./pages/PatientHealthPage"));
const PatientIvrPage = lazy(() => import("./pages/PatientIvrPage"));
const PatientMessagesPage = lazy(() => import("./pages/PatientMessagesPage"));
const PatientTimelinePage = lazy(() => import("./pages/PatientTimelinePage"));
const PatientCarePlansPage = lazy(() => import("./pages/PatientCarePlansPage"));
const PatientAlertsPage = lazy(() => import("./pages/PatientAlertsPage"));
const PatientFutureCarePage = lazy(() => import("./pages/PatientFutureCarePage"));
const PatientObservationsPage = lazy(() => import("./pages/PatientObservationsPage"));
const PatientProfileSetupPage = lazy(() => import("./pages/PatientProfileSetupPage"));
const PatientFamilyNetworkPage = lazy(() => import("./pages/PatientFamilyNetworkPage"));
const PatientVoiceAssistPage = lazy(() => import("./pages/PatientVoiceAssistPage"));
const PatientPrescriptionsPage = lazy(() => import("./pages/PatientPrescriptionsPage"));
const PatientProfilePage = lazy(() => import("./pages/PatientProfilePage"));
const PatientRecordsPage = lazy(() => import("./pages/PatientRecordsPage"));
const PatientRemindersPage = lazy(() => import("./pages/PatientRemindersPage"));
const AiHubPage = lazy(() => import("./ai/pages/AiHubPage"));
const MentalHealthCheckinPage = lazy(() => import("./ai/pages/MentalHealthCheckinPage"));
const PrescriptionPrintPage = lazy(() => import("./pages/PrescriptionPrintPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const TriagePage = lazy(() => import("./pages/TriagePage"));
const DoctorAppointmentsPage = lazy(() => import("./pages/DoctorAppointmentsPage"));
const DoctorConsultationPage = lazy(() => import("./pages/DoctorConsultationPage"));
const DoctorCarePlansPage = lazy(() => import("./pages/DoctorCarePlansPage"));
const DoctorReferralsPage = lazy(() => import("./pages/DoctorReferralsPage"));
const DoctorPopulationInsightsPage = lazy(() => import("./pages/DoctorPopulationInsightsPage"));
const CaregiverAlertsPage = lazy(() => import("./pages/CaregiverAlertsPage"));
const CaregiverFamilyNetworkPage = lazy(() => import("./pages/CaregiverFamilyNetworkPage"));
const PharmacistDashboardPage = lazy(() => import("./pages/PharmacistDashboardPage"));
const PharmacistDispensingPage = lazy(() => import("./pages/PharmacistDispensingPage"));
const PharmacistInventoryPage = lazy(() => import("./pages/PharmacistInventoryPage"));
const PharmacistMessagesPage = lazy(() => import("./pages/PharmacistMessagesPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminAuditLogsPage = lazy(() => import("./pages/AdminAuditLogsPage"));

const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));

function LazyPage({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <RouteErrorBoundary key={location.pathname} routePath={location.pathname}>
      <Suspense fallback={<PremiumLoadingState />}>
        <PageTransition>
          {children}
        </PageTransition>
      </Suspense>
    </RouteErrorBoundary>
  );
}

export default function App() {
  const { t } = useLanguage();
  const location = useLocation();
  const routeTransitionStartRef = useRef<DynamicState>(typeof performance !== "undefined" ? performance.now() : 0);

  useEffect(() => {
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    routeTransitionStartRef.current = startedAt;

    let rafId = 0;
    let settleRafId = 0;
    rafId = window.requestAnimationFrame(() => {
      settleRafId = window.requestAnimationFrame(() => {
        const finishedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
        trackRouteTransition({
          to: `${location.pathname}${location.search}`,
          durationMs: Math.round(finishedAt - routeTransitionStartRef.current)
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.cancelAnimationFrame(settleRafId);
    };
  }, [location.pathname, location.search]);

  return (
    <AnimatePresence mode="wait">
      <CommandPalette />
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/support" element={<PageTransition><SupportPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />

        <Route
          path="/patient"
          element={
            <ProtectedRoute roles={["PATIENT"]} variant="dashboard">
              <LazyPage><PatientDashboardPage /></LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/setup"
          element={
            <ProtectedRoute roles={["PATIENT"]}>
              <LazyPage><PatientProfileSetupPage /></LazyPage>
            </ProtectedRoute>
          }
        />
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientAppointmentsPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/triage"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <TriagePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/book"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientBookingPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/care-plans"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientCarePlansPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/prescriptions"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientPrescriptionsPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/reminders"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientRemindersPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/health"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientHealthPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/timeline"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientTimelinePage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientProfilePage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/messages"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientMessagesPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/chatbot"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientChatbotPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/ivr"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientIvrPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/ivr-booking"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <Navigate to="/patient/ivr" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/future-care"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientFutureCarePage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/observations"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientObservationsPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/family-network"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientFamilyNetworkPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/voice-assist"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientVoiceAssistPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/mental-health-checkin"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><MentalHealthCheckinPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/education"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientEducationPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/alerts"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientAlertsPage /></LazyPage>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/prescriptions/:prescriptionId/print"
        element={
          <ProtectedRoute roles={["PATIENT", "DOCTOR"]}>
            <PrescriptionPrintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/records"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <LazyPage><PatientRecordsPage /></LazyPage>
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute roles={["PATIENT", "DOCTOR", "CAREGIVER", "PHARMACIST", "ADMIN"]} variant="shell">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/patient/dashboard" element={<ProtectedRoute roles={["PATIENT"]}><Navigate to="/patient" replace /></ProtectedRoute>} />
        <Route
          path="/ai-hub"
          element={
            <ProtectedRoute roles={["PATIENT", "DOCTOR", "CAREGIVER", "PHARMACIST", "ADMIN"]}>
              <Suspense fallback={<div className="glass-card p-6">{t("loadingAIHub", undefined) || "Loading AI hub..."}</div>}>
                <AiHubPage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route path="/doctor" element={<ProtectedRoute roles={["DOCTOR"]} variant="dashboard"><LazyPage><DoctorDashboardPage /></LazyPage></ProtectedRoute>} />
        <Route path="/doctor/dashboard" element={<ProtectedRoute roles={["DOCTOR"]}><Navigate to="/doctor" replace /></ProtectedRoute>} />
        <Route path="/doctor/profile" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorProfilePage /></ProtectedRoute>} />
        <Route path="/doctor/appointments" element={<ProtectedRoute roles={["DOCTOR"]}><LazyPage><DoctorAppointmentsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/doctor/consultation" element={<ProtectedRoute roles={["DOCTOR"]}><LazyPage><DoctorConsultationPage /></LazyPage></ProtectedRoute>} />
        <Route path="/doctor/messages" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorMessagesPage /></ProtectedRoute>} />
        <Route path="/doctor/intelligence" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorIntelligencePage /></ProtectedRoute>} />
        <Route path="/doctor/care-plans" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorCarePlansPage /></ProtectedRoute>} />
        <Route path="/doctor/referrals" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorReferralsPage /></ProtectedRoute>} />
        <Route path="/doctor/population-insights" element={<ProtectedRoute roles={["DOCTOR"]}><DoctorPopulationInsightsPage /></ProtectedRoute>} />

        <Route path="/caregiver" element={<ProtectedRoute roles={["CAREGIVER"]} variant="dashboard"><LazyPage><CaregiverDashboardPage /></LazyPage></ProtectedRoute>} />
        <Route path="/caregiver/dashboard" element={<ProtectedRoute roles={["CAREGIVER"]}><Navigate to="/caregiver" replace /></ProtectedRoute>} />
        <Route path="/caregiver/monitoring" element={<ProtectedRoute roles={["CAREGIVER"]}><LazyPage><CaregiverMonitoringPage /></LazyPage></ProtectedRoute>} />
        <Route path="/caregiver/messages" element={<ProtectedRoute roles={["CAREGIVER"]}><CaregiverMessagesPage /></ProtectedRoute>} />
        <Route path="/caregiver/interventions" element={<ProtectedRoute roles={["CAREGIVER"]}><CaregiverInterventionsPage /></ProtectedRoute>} />
        <Route path="/caregiver/care-gaps" element={<ProtectedRoute roles={["CAREGIVER"]}><CaregiverCareGapsPage /></ProtectedRoute>} />
        <Route path="/caregiver/alerts" element={<ProtectedRoute roles={["CAREGIVER"]}><CaregiverAlertsPage /></ProtectedRoute>} />
        <Route path="/caregiver/family-network" element={<ProtectedRoute roles={["CAREGIVER"]}><CaregiverFamilyNetworkPage /></ProtectedRoute>} />

        <Route path="/pharmacist" element={<ProtectedRoute roles={["PHARMACIST"]} variant="dashboard"><LazyPage><PharmacistDashboardPage /></LazyPage></ProtectedRoute>} />
        <Route path="/pharmacist/dashboard" element={<ProtectedRoute roles={["PHARMACIST"]}><Navigate to="/pharmacist" replace /></ProtectedRoute>} />
        <Route path="/pharmacist/inventory" element={<ProtectedRoute roles={["PHARMACIST"]}><LazyPage><PharmacistInventoryPage /></LazyPage></ProtectedRoute>} />
        <Route path="/pharmacist/dispensing" element={<ProtectedRoute roles={["PHARMACIST"]}><LazyPage><PharmacistDispensingPage /></LazyPage></ProtectedRoute>} />
        <Route path="/pharmacist/messages" element={<ProtectedRoute roles={["PHARMACIST"]}><PharmacistMessagesPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]} variant="dashboard"><LazyPage><AdminDashboardPage /></LazyPage></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={["ADMIN"]} variant="dashboard"><LazyPage><AdminUsersPage /></LazyPage></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute roles={["ADMIN"]} variant="dashboard"><LazyPage><AdminAuditLogsPage /></LazyPage></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={["ADMIN"]}><Navigate to="/admin" replace /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
    </Routes>
    </AnimatePresence>
  );
}
