import { describe, it, expect } from "vitest";
import {
  ePrescriptionSchema,
  vitalsEntrySchema,
  mentalHealthScreenerSchema,
  emergencySosSchema
} from "./clinicalSchemas";

describe("Clinical Validation Schemas (Zod)", () => {
  describe("ePrescriptionSchema", () => {
    it("accepts valid e-prescription payload", () => {
      const result = ePrescriptionSchema.safeParse({
        patientId: 1001,
        medicationName: "Amoxicillin",
        dosage: "500 mg",
        frequency: "TWICE_DAILY",
        durationDays: 7,
        refillsAllowed: 2,
        instructions: "Take with food",
        allergyAcknowledged: true
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing medication name or unacknowledged allergy check", () => {
      const result = ePrescriptionSchema.safeParse({
        patientId: 1001,
        medicationName: "",
        dosage: "",
        frequency: "TWICE_DAILY",
        durationDays: 0,
        refillsAllowed: 0,
        allergyAcknowledged: false
      });
      expect(result.success).toBe(false);
    });
  });

  describe("vitalsEntrySchema", () => {
    it("accepts valid vital signs payload", () => {
      const result = vitalsEntrySchema.safeParse({
        systolicBp: 120,
        diastolicBp: 80,
        heartRate: 72,
        oxygenSaturation: 98,
        temperatureCelsius: 36.6
      });
      expect(result.success).toBe(true);
    });

    it("rejects out-of-range physiological vitals", () => {
      const result = vitalsEntrySchema.safeParse({
        systolicBp: 300, // exceeds max 260
        diastolicBp: 80,
        heartRate: 350, // exceeds max 240
        oxygenSaturation: 150 // exceeds max 100
      });
      expect(result.success).toBe(false);
    });
  });

  describe("mentalHealthScreenerSchema", () => {
    it("accepts valid PHQ-9 screener answers", () => {
      const result = mentalHealthScreenerSchema.safeParse({
        littleInterest: 1,
        feelingDown: 2,
        sleepTrouble: 0,
        feelingTired: 1,
        poorAppetite: 0,
        feelingBadAboutSelf: 1,
        troubleConcentrating: 0,
        movingSlowlyOrFidgety: 0,
        thoughtsSelfHarm: 0,
        patientConsent: true
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative or out-of-range PHQ-9 scale values", () => {
      const result = mentalHealthScreenerSchema.safeParse({
        littleInterest: 5, // invalid PHQ score
        feelingDown: -1,
        patientConsent: false
      });
      expect(result.success).toBe(false);
    });
  });

  describe("emergencySosSchema", () => {
    it("accepts valid Emergency SOS dispatch request", () => {
      const result = emergencySosSchema.safeParse({
        currentLocation: "123 MG Road, Bengaluru",
        contactPhone: "+91 9876543210",
        symptomSummary: "Chest tightness and shortness of breath",
        authorizeDispatch: true
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing location or unconfirmed dispatch authorization", () => {
      const result = emergencySosSchema.safeParse({
        currentLocation: "",
        contactPhone: "123",
        symptomSummary: "",
        authorizeDispatch: false
      });
      expect(result.success).toBe(false);
    });
  });
});
