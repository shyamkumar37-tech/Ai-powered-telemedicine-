import { z } from "zod";

/**
 * e-Prescription Validation Schema (React Hook Form + Zod)
 * Validates clinical prescription inputs, dosage boundaries, and refills.
 */
export const ePrescriptionSchema = z.object({
  patientId: z.number({ required_error: "Patient selection is required" }).min(1, "Patient selection is required"),
  medicationName: z.string().min(2, "Medication name must be at least 2 characters").max(120, "Medication name is too long"),
  dosage: z.string().min(1, "Dosage is required (e.g. 500mg, 10ml)"),
  frequency: z.enum(["ONCE_DAILY", "TWICE_DAILY", "THREE_TIMES_DAILY", "FOUR_TIMES_DAILY", "EVERY_8_HOURS", "AS_NEEDED"], {
    errorMap: () => ({ message: "Please select a valid dosing frequency" })
  }),
  durationDays: z.number().int().min(1, "Duration must be at least 1 day").max(365, "Duration cannot exceed 365 days"),
  refillsAllowed: z.number().int().min(0, "Refills cannot be negative").max(12, "Maximum 12 refills allowed"),
  instructions: z.string().max(500, "Instructions cannot exceed 500 characters").optional(),
  allergyAcknowledged: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge allergy & drug interaction check prior to sign"
  })
});

export type EPrescriptionFormValues = z.infer<typeof ePrescriptionSchema>;

/**
 * Vitals Entry Validation Schema
 * Validates physiological parameter boundaries for patient and clinical entry.
 */
export const vitalsEntrySchema = z.object({
  systolicBp: z.number().int().min(60, "Systolic BP must be at least 60 mmHg").max(260, "Systolic BP cannot exceed 260 mmHg"),
  diastolicBp: z.number().int().min(40, "Diastolic BP must be at least 40 mmHg").max(160, "Diastolic BP cannot exceed 160 mmHg"),
  heartRate: z.number().int().min(30, "Heart rate must be at least 30 bpm").max(240, "Heart rate cannot exceed 240 bpm"),
  oxygenSaturation: z.number().min(70, "SpO2 must be at least 70%").max(100, "SpO2 cannot exceed 100%"),
  bloodGlucose: z.number().min(20, "Blood glucose must be at least 20 mg/dL").max(800, "Blood glucose cannot exceed 800 mg/dL").optional(),
  temperatureCelsius: z.number().min(32.0, "Temperature must be at least 32°C").max(43.0, "Temperature cannot exceed 43°C").optional(),
  notes: z.string().max(300, "Vitals notes cannot exceed 300 characters").optional()
});

export type VitalsEntryFormValues = z.infer<typeof vitalsEntrySchema>;

/**
 * PHQ-9 / GAD-7 Mental Health Screener Validation Schema
 * Validates 0-3 rating range per item and triggers emergency alert review on severe scores.
 */
export const mentalHealthScreenerSchema = z.object({
  littleInterest: z.number().int().min(0).max(3),
  feelingDown: z.number().int().min(0).max(3),
  sleepTrouble: z.number().int().min(0).max(3),
  feelingTired: z.number().int().min(0).max(3),
  poorAppetite: z.number().int().min(0).max(3),
  feelingBadAboutSelf: z.number().int().min(0).max(3),
  troubleConcentrating: z.number().int().min(0).max(3),
  movingSlowlyOrFidgety: z.number().int().min(0).max(3),
  thoughtsSelfHarm: z.number().int().min(0).max(3),
  patientConsent: z.boolean().refine((val) => val === true, {
    message: "Consent is required to submit health evaluation"
  })
});

export type MentalHealthScreenerFormValues = z.infer<typeof mentalHealthScreenerSchema>;

/**
 * Emergency SOS Safety Trigger Schema
 * Ensures mandatory contact location and urgent symptom details are captured.
 */
export const emergencySosSchema = z.object({
  currentLocation: z.string().min(5, "Please enter your current location address or room"),
  contactPhone: z.string().min(8, "A valid callback phone number is required"),
  symptomSummary: z.string().min(3, "Please specify main urgent symptoms (e.g. chest pain, difficulty breathing)"),
  authorizeDispatch: z.boolean().refine((val) => val === true, {
    message: "Dispatch authorization is required for emergency SOS dispatch"
  })
});

export type EmergencySosFormValues = z.infer<typeof emergencySosSchema>;
