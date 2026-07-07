import api from "../../services/api";

export async function fetchAnomalyReport(patientId) {
  const { data } = await api.get(`/api/ai/extensions/anomaly/${patientId}`);
  return data;
}

export async function fetchRecommendations(patientId) {
  const { data } = await api.get(`/api/ai/extensions/recommendations/${patientId}`);
  return data;
}

export async function triggerN8nWorkflow(payload) {
  const { data } = await api.post(`/api/ai/extensions/n8n/trigger`, payload);
  return data;
}
