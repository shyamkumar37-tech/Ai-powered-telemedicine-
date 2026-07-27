import api from "../../services/api";
import { API_BASE_URL } from "../../services/api";
import { DynamicStateObject } from "./../../types/DynamicState";

export const fetchAiReportSummary = async (patientId: DynamicStateObject) => (await api.get(`/ai/report-summary/${patientId}`)).data;

export const streamAiReportSummary = (patientId: DynamicStateObject, onMessage: DynamicStateObject, onError: DynamicStateObject, onComplete: DynamicStateObject) => {
  const url = `${API_BASE_URL}/ai/report-summary/${patientId}`;
  const eventSource = new EventSource(url, { withCredentials: true });

  eventSource.onmessage = (event: DynamicStateObject) => {
    if (event.data === "[DONE]") {
      eventSource.close();
      if (onComplete) onComplete();
    } else {
      if (onMessage) onMessage(event.data);
    }
  };

  eventSource.onerror = (error: DynamicStateObject) => {
    eventSource.close();
    if (onError) onError(error);
  };

  return () => eventSource.close();
};

export const exportAiReportSummary = async (patientId: DynamicStateObject) => (await api.post(`/ai/report-summary/export/${patientId}`)).data;
export const fetchAiRiskPrediction = async (patientId: DynamicStateObject) => (await api.get(`/ai/risk-prediction/${patientId}`)).data;
export const fetchAiTreatmentRecommendations = async (patientId: DynamicStateObject) => (await api.get(`/ai/treatment-recommendations/${patientId}`)).data;
export const sendMentalHealthChat = async (payload: DynamicStateObject) => (await api.post("/ai/mental-health/chat", payload)).data;
export const runMentalHealthAssessment = async (payload: DynamicStateObject) => (await api.post("/ai/mental-health/assessment", payload)).data;
export const startVoiceIntake = async (payload: DynamicStateObject) => (await api.post("/ai/voice-intake/start", payload)).data;
export const processVoiceIntake = async (payload: DynamicStateObject) => (await api.post("/ai/voice-intake/process", payload)).data;
export const finalizeVoiceIntake = async (payload: DynamicStateObject) => (await api.post("/ai/voice-intake/finalize", payload)).data;
export const fetchAiAdherenceCoach = async (patientId: DynamicStateObject) => (await api.get(`/ai/insights/adherence/${patientId}`)).data;
export const fetchAiHealthTrends = async (patientId: DynamicStateObject) => (await api.get(`/ai/insights/health-trends/${patientId}`)).data;
export const fetchAiFollowUp = async (patientId: DynamicStateObject) => (await api.get(`/ai/insights/follow-up/${patientId}`)).data;
export const fetchAiJourneyPlan = async (patientId: DynamicStateObject) => (await api.get(`/ai/insights/journey/${patientId}`)).data;
export const fetchDoctorRiskQueue = async (doctorId: DynamicStateObject) => (await api.get(`/ai/insights/risk-queue/doctor/${doctorId}`)).data;
export const fetchCaregiverPriorityQueue = async (caregiverId: DynamicStateObject) => (await api.get(`/ai/insights/caregiver/priority-queue/${caregiverId}`)).data;
export const fetchBehavioralDeviations = async (patientId: DynamicStateObject) => (await api.get(`/ai/insights/caregiver/deviations/${patientId}`)).data;
export const fetchCheckInScript = async (patientId: DynamicStateObject) => (await api.get(`/ai/insights/caregiver/checkin-script/${patientId}`)).data;
export const fetchConsultationSummary = async (consultationId: DynamicStateObject) => (await api.get(`/ai/insights/consultation-summary/${consultationId}`)).data;
export const fetchDifferentialSuggestions = async (payload: DynamicStateObject) => (await api.post("/ai/insights/differential-suggestions", payload)).data;
export const fetchDrugInteractions = async (payload: DynamicStateObject) => (await api.post("/ai/insights/drug-interactions", payload)).data;
export const fetchRefillPrediction = async (pharmacistId: DynamicStateObject) => (await api.get(`/ai/insights/pharmacy/refill-prediction/${pharmacistId}`)).data;
export const fetchInventoryRisk = async (pharmacistId: DynamicStateObject) => (await api.get(`/ai/insights/pharmacy/inventory-risk/${pharmacistId}`)).data;
export const fetchSubstitutionSuggestions = async (payload: DynamicStateObject) => (await api.post("/ai/insights/pharmacy/substitutions", payload)).data;
export const logMoodEntry = async (patientId: DynamicStateObject, payload: DynamicStateObject) => (await api.post(`/ai/insights/mood/${patientId}`, payload)).data;
export const fetchMoodEntries = async (patientId: DynamicStateObject) => (await api.get(`/ai/insights/mood/${patientId}`)).data;
export const fetchMoodTrends = async (patientId: DynamicStateObject) => (await api.get(`/ai/insights/mood/${patientId}/trends`)).data;
export const fetchStressRecommendations = async (patientId: DynamicStateObject) => (await api.get(`/ai/insights/stress-recommendations/${patientId}`)).data;

export const generateSoapNote = async (payload: DynamicStateObject) => (await api.post("/intelligence/doctor/scribe", payload)).data;
export const checkClinicalDrugInteractions = async (payload: DynamicStateObject) => (await api.post("/intelligence/doctor/drug-interactions", payload)).data;
export const calculateDosage = async (payload: DynamicStateObject) => (await api.post("/intelligence/doctor/dosage", payload)).data;
export const suggestClinicalAlternatives = async (payload: DynamicStateObject) => (await api.post("/intelligence/doctor/alternatives", payload)).data;
export const askCopilot = async (payload: DynamicStateObject) => (await api.post("/intelligence/doctor/copilot", payload)).data;
export const extractPrescriptionFromImage = async (formData: DynamicStateObject) => (await api.post("/intelligence/doctor/ocr", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
export const analyzeMedicalImage = async (formData: DynamicStateObject, patientId: DynamicStateObject) => (await api.post(`/intelligence/image-analysis?patientId=${patientId}`, formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
export const fetchImageHistory = async (patientId: DynamicStateObject) => (await api.get(`/intelligence/image-analysis/history/${patientId}`)).data;
export const cancelImageAnalysis = async (jobId: DynamicStateObject) => (await api.delete(`/intelligence/image-analysis/${jobId}`)).data;
export const getSupplyPrediction = async (pharmacistId: DynamicStateObject) => (await api.get(`/intelligence/pharmacy/supply-prediction/${pharmacistId}`)).data;
export const transcribeAudioToSoapNote = async (formData: DynamicStateObject) => (await api.post("/intelligence/doctor/scribe/audio", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
