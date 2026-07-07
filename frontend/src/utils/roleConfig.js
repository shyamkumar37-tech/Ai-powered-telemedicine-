export const roleRoutes = {
  PATIENT: [
    { labelKey: "dashboard", path: "/patient", section: "Care" },
    { labelKey: "appointments", path: "/patient/appointments", section: "Care" },
    { labelKey: "triage", path: "/patient/triage", section: "Care" },
    { labelKey: "book", path: "/patient/book", section: "Care" },
    { labelKey: "carePlans", path: "/patient/care-plans", section: "Care" },
    { labelKey: "prescriptions", path: "/patient/prescriptions", section: "Medications" },
    { labelKey: "reminders", path: "/patient/reminders", section: "Medications" },
    { labelKey: "health", path: "/patient/health", section: "Health" },
    { labelKey: "timeline", path: "/patient/timeline", section: "Health" },
    { labelKey: "education", path: "/patient/education", section: "Health" },
    { labelKey: "futureCare", path: "/patient/future-care", section: "Health" },
    { labelKey: "observations", path: "/patient/observations", section: "Health" },
    { labelKey: "records", path: "/patient/records", section: "Health" },
    { labelKey: "messages", path: "/patient/messages", section: "Support" },
    { labelKey: "aiChatbot", path: "/patient/chatbot", section: "Support" },
    { labelKey: "ivrBooking", path: "/patient/ivr", section: "Support" },
    { labelKey: "voiceAssist", path: "/patient/voice-assist", section: "Support" },
    { labelKey: "mentalHealthCheckin", path: "/patient/mental-health-checkin", section: "Support" },
    { labelKey: "familyNetwork", path: "/patient/family-network", section: "Family & Community" },
    { labelKey: "notifications", path: "/patient/alerts", section: "Family & Community" },
    { labelKey: "profile", path: "/patient/profile", section: "Profile" }
  ],
  DOCTOR: [
    { labelKey: "dashboard", path: "/doctor", section: "Care" },
    { labelKey: "appointments", path: "/doctor/appointments", section: "Care" },
    { labelKey: "consultation", path: "/doctor/consultation", section: "Care" },
    { labelKey: "carePlans", path: "/doctor/care-plans", section: "Care" },
    { labelKey: "referrals", path: "/doctor/referrals", section: "Care" },
    { labelKey: "messages", path: "/doctor/messages", section: "Support" },
    { labelKey: "intelligence", path: "/doctor/intelligence", section: "Insights" },
    { labelKey: "populationInsights", path: "/doctor/population-insights", section: "Insights" },
    { labelKey: "profile", path: "/doctor/profile", section: "Profile" }
  ],
  CAREGIVER: [
    { labelKey: "dashboard", path: "/caregiver", section: "Care" },
    { labelKey: "monitoring", path: "/caregiver/monitoring", section: "Care" },
    { labelKey: "interventions", path: "/caregiver/interventions", section: "Care" },
    { labelKey: "careGaps", path: "/caregiver/care-gaps", section: "Care" },
    { labelKey: "alerts", path: "/caregiver/alerts", section: "Care" },
    { labelKey: "messages", path: "/caregiver/messages", section: "Support" },
    { labelKey: "familyNetwork", path: "/caregiver/family-network", section: "Support" }
  ],
  PHARMACIST: [
    { labelKey: "dashboard", path: "/pharmacist", section: "Care" },
    { labelKey: "dispensing", path: "/pharmacist/dispensing", section: "Care" },
    { labelKey: "inventory", path: "/pharmacist/inventory", section: "Care" },
    { labelKey: "messages", path: "/pharmacist/messages", section: "Support" }
  ],
  ADMIN: [
    { labelKey: "dashboard", path: "/admin", section: "General" }
  ]
};
