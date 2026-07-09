export const queryKeys = {
  patient: {
    vitals: (patientId) => ["patient", patientId, "vitals"],
    moodTrends: (patientId) => ["patient", patientId, "mood-trends"],
    dashboard: (patientId) => ["patient", patientId, "dashboard"],
  },
  doctor: {
    queue: (doctorId) => ["doctor", doctorId, "queue"],
    dashboard: (doctorId) => ["doctor", doctorId, "dashboard"],
  },
  pharmacist: {
    dashboard: (pharmacistId) => ["pharmacist", pharmacistId, "dashboard"],
    inventoryRisk: (pharmacistId) => ["pharmacist", pharmacistId, "inventory-risk"],
    refillPrediction: (pharmacistId) => ["pharmacist", pharmacistId, "refill-prediction"],
  },
};
