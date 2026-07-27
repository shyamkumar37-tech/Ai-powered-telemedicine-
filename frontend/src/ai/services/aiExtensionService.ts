import api from "../../services/api";
import { DynamicStateObject } from "./../../types/DynamicState";

export async function fetchAnomalyReport(patientId: DynamicStateObject) {
  const { data } = await api.get(`/api/ai/extensions/anomaly/${patientId}`);
  return data;
}

export async function fetchRecommendations(patientId: DynamicStateObject) {
  const { data } = await api.get(`/api/ai/extensions/recommendations/${patientId}`);
  return data;
}

export async function triggerN8nWorkflow(payload: DynamicStateObject) {
  const { data } = await api.post(`/api/ai/extensions/n8n/trigger`, payload);
  return data;
}
