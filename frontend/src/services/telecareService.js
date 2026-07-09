import api, { API_BASE_URL, getStoredAuthToken } from "./api";
import { safeJsonParse } from "../utils/safeJson";

export const fetchSystemStatus = async () => (await api.get("/system/status")).data;
export const fetchAdminStatus = async () => (await api.get("/system/status/admin")).data;
export const fetchDashboard = async (role, profileId, config = {}) => (await api.get(`/dashboard/${role.toLowerCase()}/${profileId}`, config)).data;
export const fetchPatientProfile = async (id) => (await api.get(`/profiles/patients/${id}`)).data;
export const updatePatientProfile = async (id, payload) => (await api.put(`/profiles/patients/${id}`, payload)).data;
export const fetchDoctorProfile = async (id) => (await api.get(`/profiles/doctors/${id}`)).data;
export const updateDoctorProfile = async (id, payload) => (await api.put(`/profiles/doctors/${id}`, payload)).data;
export const fetchDoctors = async (config = {}) => (await api.get("/doctors", config)).data;
export const fetchDoctorById = async (id) => (await api.get(`/doctors/${id}`)).data;
export const fetchCaregiverProfile = async (id) => (await api.get(`/profiles/caregivers/${id}`)).data;
export const createTriage = async (payload) => (await api.post("/triage", payload)).data;
export const fetchTriageHistory = async (id, config = {}) => (await api.get(`/triage/patient/${id}`, config)).data;
export const createAppointment = async (payload) => (await api.post("/appointments", payload)).data;
export const fetchPatientAppointments = async (id, config = {}) => (await api.get(`/appointments/patient/${id}`, config)).data;
export const fetchDoctorAppointments = async (id) => (await api.get(`/appointments/doctor/${id}`)).data;
export const updateAppointmentStatus = async (id, payload) => (await api.patch(`/appointments/${id}/status`, payload)).data;
export const createConsultation = async (payload) => (await api.post("/consultations", payload)).data;
export const fetchPatientConsultations = async (id) => (await api.get(`/consultations/patient/${id}`)).data;
export const fetchConsultationByAppointment = async (id) => {
  const response = await api.get(`/consultations/appointment/${id}`);
  if (response.status === 204 || response.data == null || response.data === "") {
    return null;
  }
  return response.data;
};
export const createPrescription = async (payload) => (await api.post("/prescriptions", payload)).data;
export const fetchPatientPrescriptions = async (id, params = {}, config = {}) => (await api.get(`/prescriptions/patient/${id}`, { ...config, params })).data;
export const fetchPrescriptionByConsultation = async (id) => (await api.get(`/prescriptions/consultation/${id}`)).data;
export const fetchPrescription = async (id) => (await api.get(`/prescriptions/${id}`)).data;
export const fetchPatientReminders = async (id, config = {}) => (await api.get(`/reminders/patient/${id}`, config)).data;
export const updateReminderStatus = async (id, payload) => (await api.patch(`/reminders/${id}/status`, payload)).data;
export const fetchAdherence = async (id, config = {}) => (await api.get(`/reminders/patient/${id}/adherence`, config)).data;
export const createHealthRecord = async (payload) => (await api.post("/health-records", payload)).data;
export const fetchHealthRecords = async (id, config = {}) => (await api.get(`/health-records/patient/${id}`, config)).data;
export const fetchHealthSummary = async (id, config = {}) => (await api.get(`/health-records/patient/${id}/summary`, config)).data;
export const fetchMedicalRecords = async (id) => (await api.get(`/medical-records/patient/${id}`)).data;
export const createCarePlan = async (payload) => (await api.post("/care-plans", payload)).data;
export const fetchPatientCarePlans = async (id) => (await api.get(`/care-plans/patient/${id}`)).data;
export const fetchDoctorCarePlans = async (id) => (await api.get(`/care-plans/doctor/${id}`)).data;
export const fetchPatientAlerts = async (id, config = {}) => (await api.get(`/alerts/patient/${id}`, config)).data;
export const fetchCaregiverAlerts = async (id, config = {}) => (await api.get(`/alerts/caregiver/${id}`, config)).data;
export const actionAlert = async (alertId, action, config = {}) => (await api.patch(`/alerts/${alertId}/action?action=${action}`, null, config)).data;
export const fetchPatientMessages = async (id, config = {}) => (await api.get(`/messages/patient/${id}`, config)).data;
export const fetchDoctorMessages = async (id, config = {}) => (await api.get(`/messages/doctor/${id}`, config)).data;
export const fetchCaregiverMessages = async (id, config = {}) => (await api.get(`/messages/caregiver/${id}`, config)).data;
export const fetchPharmacistMessages = async (id, config = {}) => (await api.get(`/messages/pharmacist/${id}`, config)).data;
export const sendCareMessage = async (payload) => (await api.post("/messages", payload)).data;
export const acknowledgeCareMessage = async (id) => (await api.patch(`/messages/${id}/acknowledge`)).data;
export const translateText = async (payload) => (await api.post("/translations", payload)).data;
export const fetchChatbotHistory = async (id, config = {}) => (await api.get(`/chatbot/patient/${id}`, config)).data;
export const askChatbotQuestion = async (payload) => (await api.post("/chatbot/ask", payload)).data;
export const startIvrSession = async (payload) => (await api.post("/ivr/sessions", payload)).data;
export const fetchIvrSessions = async (id, config = {}) => (await api.get(`/ivr/patient/${id}/sessions`, config)).data;
export const fetchPharmacistDashboard = async (id, config = {}) => (await api.get(`/pharmacists/${id}/dashboard`, config)).data;
export const fetchPharmacistInventory = async (id) => (await api.get(`/pharmacists/${id}/inventory`)).data;
export const createPharmacistInventoryItem = async (id, payload) => (await api.post(`/pharmacists/${id}/inventory`, payload)).data;
export const fetchPharmacistDispensing = async (id) => (await api.get(`/pharmacists/${id}/dispensing`)).data;
export const inviteCaregiver = async (payload) => (await api.post("/caregivers/invite", payload)).data;
export const updateDispenseRecord = async (id, payload) => (await api.patch(`/pharmacists/dispensing/${id}`, payload)).data;
export const linkCaregiver = async (payload) => (await api.post("/caregivers/link", payload)).data;
export const fetchLinkedPatients = async (id) => (await api.get(`/caregivers/${id}/linked-patients`)).data;
export const createCaregiverIntervention = async (payload) => (await api.post("/caregiver-interventions", payload)).data;
export const fetchCaregiverInterventions = async (id) => (await api.get(`/caregiver-interventions/caregiver/${id}`)).data;
export const updateCaregiverInterventionStatus = async (id, payload) => (await api.patch(`/caregiver-interventions/${id}/status`, payload)).data;
export const fetchPatientTimeline = async (id) => (await api.get(`/intelligence/patient/${id}/timeline`)).data;
export const fetchCareCompliance = async (id, config = {}) => (await api.get(`/intelligence/patient/${id}/compliance`, config)).data;
export const fetchPatientEducation = async (id, config = {}) => (await api.get(`/intelligence/patient/${id}/education`, config)).data;
export const fetchDoctorPriorityQueue = async (id) => (await api.get(`/intelligence/doctor/${id}/priority-queue`)).data;
export const fetchCaregiverCareGaps = async (id) => (await api.get(`/intelligence/caregiver/${id}/care-gaps`)).data;
export const fetchDeteriorationInsight = async (id, config = {}) => (await api.get(`/future-care/patient/${id}/deterioration`, config)).data;
export const fetchCopilotRecommendations = async (id, config = {}) => (await api.get(`/future-care/patient/${id}/copilot`, config)).data;
export const fetchAdaptiveTriage = async (id, config = {}) => (await api.get(`/future-care/patient/${id}/adaptive-triage`, config)).data;
export const fetchPatientFamilyNetwork = async (id) => (await api.get(`/future-care/patient/${id}/family-network`)).data;
export const fetchCaregiverFamilyNetwork = async (id) => (await api.get(`/future-care/caregiver/${id}/family-network`)).data;
export const fetchPatientObservations = async (id) => (await api.get(`/future-care/patient/${id}/observations`)).data;
export const createPatientObservation = async (payload) => (await api.post("/future-care/observations", payload)).data;
export const fetchFollowUpAutopilot = async (id, config = {}) => (await api.get(`/future-care/patient/${id}/follow-up-autopilot`, config)).data;
export const fetchReferralSuggestions = async (id) => (await api.get(`/future-care/doctor/${id}/referral-suggestions`)).data;
export const createReferral = async (payload) => (await api.post("/future-care/referrals", payload)).data;
export const fetchDoctorReferrals = async (id) => (await api.get(`/future-care/doctor/${id}/referrals`)).data;
export const fetchPopulationInsights = async (id) => (await api.get(`/future-care/doctor/${id}/population-insights`)).data;
export const placePharmacyOrder = async (payload) => (await api.post("/pharmacy/order", payload)).data;
export const trackPharmacyOrder = async (orderId) => (await api.get(`/pharmacy/order/${orderId}/track`)).data;
function createSseSubscription(path, onMessage, onError) {
  const token = getStoredAuthToken();
  if (!token) {
    return () => {};
  }

  const controller = new AbortController();
  const decoder = new TextDecoder();
  let cancelled = false;
  let buffer = "";

  (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`
        },
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Alert stream failed (${response.status})`);
      }

      const reader = response.body.getReader();
      while (!cancelled) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        let boundaryIndex = buffer.indexOf("\n\n");
        while (boundaryIndex !== -1) {
          const rawEvent = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);
          const dataLine = rawEvent
            .split("\n")
            .find((line) => line.startsWith("data:"));

          if (dataLine) {
            const payload = dataLine.slice(5).trim();
            if (payload && payload !== "connected") {
              const parsed = safeJsonParse(payload);
              if (parsed) {
                onMessage(parsed);
              } else {
                onError?.(new Error("Unable to parse alert stream payload"));
              }
            }
          }

          boundaryIndex = buffer.indexOf("\n\n");
        }
      }
    } catch (error) {
      if (!cancelled && error.name !== "AbortError") {
        onError?.(error);
      }
    }
  })();

  return () => {
    cancelled = true;
    controller.abort();
  };
}

export const subscribeToPatientAlertStream = (id, onMessage, onError) =>
  createSseSubscription(`/alerts/patient/${id}/stream`, onMessage, onError);

export const subscribeToCaregiverAlertStream = (id, onMessage, onError) =>
  createSseSubscription(`/alerts/caregiver/${id}/stream`, onMessage, onError);
