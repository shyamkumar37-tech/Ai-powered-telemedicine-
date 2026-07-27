export const queryKeys = {
  patient: {
    vitals: (patientId: string) => ["patient", patientId, "vitals"],
    moodTrends: (patientId: string) => ["patient", patientId, "mood-trends"],
    dashboard: (patientId: string) => ["patient", patientId, "dashboard"],
  },
  doctor: {
    queue: (doctorId: string) => ["doctor", doctorId, "queue"],
    dashboard: (doctorId: string) => ["doctor", doctorId, "dashboard"],
  },
  pharmacist: {
    dashboard: (pharmacistId: string) => ["pharmacist", pharmacistId, "dashboard"],
    inventoryRisk: (pharmacistId: string) => ["pharmacist", pharmacistId, "inventory-risk"],
    refillPrediction: (pharmacistId: string) => ["pharmacist", pharmacistId, "refill-prediction"],
  },
};
