# TeleCare+ React Query Clinical Invalidation Strategy

## Policy Overview
To ensure clinical data safety and prevent stale data display across portals (e.g. Doctor, Patient, Pharmacist), all clinical mutations MUST invalidate corresponding React Query cache keys immediately upon successful response.

---

## Invalidation Mappings

| Clinical Action / Mutation | Cache Keys Invalidated | Responsible Service / Handler |
| :--- | :--- | :--- |
| **New e-Prescription Issued** | `["prescriptions"]`, `["patient-prescriptions"]`, `["dashboard"]` | `createPrescription()` in `telecareService.ts` |
| **Medication Dispensed** | `["dispensing"]`, `["inventory"]`, `["prescriptions"]` | `updateDispensingStatus()` in `pharmacistService.ts` |
| **Vitals Sign-off Entry** | `["vitals"]`, `["observations"]`, `["dashboard"]` | `submitVitalsEntry()` in `telecareService.ts` |
| **Emergency SOS Dispatched** | `["alerts"]`, `["patient-alerts"]`, `["emergency-sos"]` | `triggerEmergencySos()` in `telecareService.ts` |
| **Appointment Booked / Rescheduled**| `["appointments"]`, `["doctor-appointments"]`, `["schedule"]` | `bookAppointment()` in `telecareService.ts` |

---

## Rules for Developers & AI Agents
1. **No Speculative Optimistic State for High-Stakes Actions**: High-stakes irreversible clinical actions (e.g. e-prescriptions, dispensing, SOS dispatch) MUST wait for server acknowledgement before updating UI status.
2. **Invalidate After Mutation**: Always call `queryClient.invalidateQueries({ queryKey: [...] })` inside `onSuccess` handlers.
3. **Network Failure Fallback**: On network or server error, retain previous confirmed state and display clear user error notification (`useToast`).
