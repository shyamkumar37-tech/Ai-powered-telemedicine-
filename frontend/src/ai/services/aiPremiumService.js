import api from "../../services/api";

export const sendSymptomChat = async (payload) => (await api.post("/ai/premium/symptom-chat", payload)).data;
export const fetchRiskSnapshot = async (patientId) => (await api.get(`/ai/premium/risk-snapshot/${patientId}`)).data;
export const fetchAppointmentPrep = async (patientId) => (await api.get(`/ai/premium/appointment-prep/${patientId}`)).data;
export const fetchFollowUpPlan = async (patientId) => (await api.get(`/ai/premium/follow-up-plan/${patientId}`)).data;
export const fetchIcdSuggestions = async (payload) => (await api.post("/ai/premium/icd-suggestions", payload)).data;
export const fetchCarePlanAdherence = async (patientId) => (await api.get(`/ai/premium/careplan-adherence/${patientId}`)).data;
export const fetchDispenseAnomaly = async (pharmacistId) => (await api.get(`/ai/premium/dispense-anomaly/${pharmacistId}`)).data;
export const fetchAutomationPlans = async () => (await api.get("/ai/premium/automation-plans")).data;
export const fetchEscalationRules = async (patientId) => (await api.get(`/ai/premium/escalation-rules/${patientId}`)).data;
export const fetchComplianceDashboard = async () => (await api.get("/ai/premium/compliance-dashboard")).data;
export const fetchPredictiveRisk = async (patientId) => (await api.get(`/ai/premium/predictive-risk/${patientId}`)).data;
export const analyzeVideoObservations = async (payload) => (await api.post("/ai/premium/video-analysis", payload)).data;
export const fetchReportGenerator = async (patientId) => (await api.get(`/ai/premium/report-generator/${patientId}`)).data;
export const runTranslationPreview = async (payload) => (await api.post("/translations", payload)).data;
