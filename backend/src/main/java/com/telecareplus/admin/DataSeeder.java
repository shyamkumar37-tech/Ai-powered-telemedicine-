package com.telecareplus.admin;

import com.telecareplus.appointments.IvrServiceType;
import com.telecareplus.clinical.CarePlanRepository;
import com.telecareplus.clinical.CareMessage;
import com.telecareplus.clinical.HealthRecordRepository;
import com.telecareplus.clinical.ReferralUrgency;
import com.telecareplus.clinical.ReferralRecommendation;
import com.telecareplus.clinical.TriageAssessment;
import com.telecareplus.common.AlertSeverity;
import com.telecareplus.appointments.IvrSessionStatus;
import com.telecareplus.clinical.WellbeingStatus;
import com.telecareplus.clinical.CarePlan;
import com.telecareplus.pharmacy.ReminderStatus;
import com.telecareplus.common.RoleType;
import com.telecareplus.clinical.ConsultationOutcome;
import com.telecareplus.common.AppProperties;
import com.telecareplus.clinical.TriageLevel;
import com.telecareplus.clinical.ConsultationNote;
import com.telecareplus.clinical.ConsultationNoteRepository;
import com.telecareplus.common.ConsultationMode;
import com.telecareplus.clinical.HealthRecord;
import com.telecareplus.clinical.ReferralStatus;
import com.telecareplus.clinical.TriageAssessmentRepository;
import com.telecareplus.clinical.CareMessageRepository;
import com.telecareplus.clinical.ReferralRecommendationRepository;

import com.telecareplus.clinical.CaregiverInterventionRepository;
import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.appointments.Appointment;
import com.telecareplus.pharmacy.PharmacyInventoryItem;
import com.telecareplus.pharmacy.Prescription;
import com.telecareplus.appointments.IvrBookingSessionRepository;
import com.telecareplus.pharmacy.MedicationItem;
import com.telecareplus.users.PatientChatMessageRepository;
import com.telecareplus.clinical.CaregiverInterventionStatus;
import com.telecareplus.clinical.PatientObservationRepository;
import com.telecareplus.pharmacy.DispenseRecord;
import com.telecareplus.users.Caregiver;
import com.telecareplus.clinical.CaregiverIntervention;
import com.telecareplus.users.PatientChatMessage;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.notification.AlertNotificationRepository;
import com.telecareplus.clinical.CaregiverActionType;
import com.telecareplus.pharmacy.PrescriptionRepository;
import com.telecareplus.pharmacy.MedicationItemRepository;
import com.telecareplus.pharmacy.DispenseRecordRepository;
import com.telecareplus.users.Patient;
import com.telecareplus.users.User;
import com.telecareplus.pharmacy.DispenseStatus;
import com.telecareplus.users.DoctorRepository;
import com.telecareplus.users.PatientCaregiverLink;
import com.telecareplus.users.UserRepository;
import com.telecareplus.appointments.AppointmentRepository;
import com.telecareplus.appointments.IvrBookingSession;
import com.telecareplus.appointments.AppointmentStatus;
import com.telecareplus.pharmacy.PharmacyInventoryItemRepository;
import com.telecareplus.clinical.ObservationSource;
import com.telecareplus.users.Doctor;
import com.telecareplus.pharmacy.MedicationReminder;
import com.telecareplus.notification.AlertNotification;
import com.telecareplus.pharmacy.MedicationReminderRepository;
import com.telecareplus.users.PharmacistRepository;
import com.telecareplus.users.PatientCaregiverLinkRepository;
import com.telecareplus.users.Patient;
import com.telecareplus.users.Pharmacist;
import com.telecareplus.clinical.PatientObservation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final PharmacistRepository pharmacistRepository;
    private final PatientCaregiverLinkRepository linkRepository;
    private final TriageAssessmentRepository triageRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationItemRepository medicationItemRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final CarePlanRepository carePlanRepository;
    private final CaregiverInterventionRepository caregiverInterventionRepository;
    private final PatientObservationRepository patientObservationRepository;
    private final ReferralRecommendationRepository referralRecommendationRepository;
    private final CareMessageRepository careMessageRepository;
    private final DispenseRecordRepository dispenseRecordRepository;
    private final PharmacyInventoryItemRepository pharmacyInventoryItemRepository;
    private final PatientChatMessageRepository patientChatMessageRepository;
    private final IvrBookingSessionRepository ivrBookingSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    public void run(String... args) {
        if (appProperties.getDemo() == null || !appProperties.getDemo().isSeedEnabled()) {
            return;
        }
        
        seedDemoData();
    }

    public synchronized void seedDemoData() {
        // Unsuspend all users to fix persistent test state
        userRepository.findAll().forEach(u -> {
            u.setActive(true);
            userRepository.save(u);
        });

        if (userRepository.existsByEmail("patient@telecareplus.com")) {
            seedExtensionDataForExistingDemoUsers();
            ensureAdditionalDemoAccounts();
            ensureSampleDoctors();
            return;
        }

        User patientUser = new User();
        patientUser.setFullName("Anita Patient");
        patientUser.setEmail("patient@telecareplus.com");
        patientUser.setPassword(passwordEncoder.encode("Password123"));
        patientUser.setPhone("9000000001");
        patientUser.setRole(RoleType.PATIENT);
        patientUser.setPreferredLanguage("en");
        patientUser = userRepository.save(patientUser);

        Patient patient = new Patient();
        patient.setUser(patientUser);
        patient.setProfileComplete(true);
        patient.setDateOfBirth("1968-01-01");
        patient.setGender("Female");
        patient.setBloodGroup("B+");
        patient.setAllergies("Penicillin");
        patient.setDiseases("Diabetes, Hypertension");
        patient.setEmergencyContactName("Ravi Family");
        patient.setEmergencyContactPhone("9000000004");
        patient.setMedicalHistorySummary("Chronic diabetic patient under continuity monitoring.");
        patient = patientRepository.save(patient);

        User doctorUser = new User();
        doctorUser.setFullName("Dr. Arjun Mehta");
        doctorUser.setEmail("doctor@telecareplus.com");
        doctorUser.setPassword(passwordEncoder.encode("Password123"));
        doctorUser.setPhone("9000000002");
        doctorUser.setRole(RoleType.DOCTOR);
        doctorUser.setPreferredLanguage("en");
        doctorUser = userRepository.save(doctorUser);

        Doctor doctor = new Doctor();
        doctor.setUser(doctorUser);
        doctor.setSpecialization("Internal Medicine");
        doctor.setExperienceYears(12);
        doctor.setConsultationFee(new BigDecimal("800.00"));
        doctor.setQualification("MD");
        doctor.setAvailabilitySummary("Mon-Sat 10:00-18:00");
        doctor.setBio("Focus on chronic care continuity and remote patient monitoring.");
        doctor = doctorRepository.save(doctor);

        User caregiverUser = new User();
        caregiverUser.setFullName("Ravi Caregiver");
        caregiverUser.setEmail("caregiver@telecareplus.com");
        caregiverUser.setPassword(passwordEncoder.encode("Password123"));
        caregiverUser.setPhone("9000000003");
        caregiverUser.setRole(RoleType.CAREGIVER);
        caregiverUser.setPreferredLanguage("en");
        caregiverUser = userRepository.save(caregiverUser);

        Caregiver caregiver = new Caregiver();
        caregiver.setUser(caregiverUser);
        caregiver.setRelationshipLabel("Son");
        caregiver = caregiverRepository.save(caregiver);

        Pharmacist pharmacist = seedPharmacist();

        seedCaregiverLinkIfMissing(patient, caregiver);

        Caregiver sharedCaregiver = seedSecondaryCaregiver(patient);

        DemoFlow flow = seedDemoClinicalFlow(patient, doctor);
        AlertNotification alert = flow.alert;

        seedCarePlanIfMissing(patient, doctor);
        seedCaregiverInterventionIfMissing(patient, caregiver, alert);
        seedCaregiverInterventionIfMissing(patient, sharedCaregiver, alert);
        seedObservationsIfMissing(patient, doctor);
        seedReferralIfMissing(patient, doctor, flow.appointment);
        seedPharmacyDataIfMissing(patient, doctor, pharmacist, flow.prescription);
        seedMessagesIfMissing(patient, doctor, caregiver, pharmacist);
        seedChatHistoryIfMissing(patient);
        seedIvrSessionIfMissing(patient, flow.appointment);
        ensureAdditionalDemoAccounts();
        ensureSampleDoctors();
    }

    private void seedExtensionDataForExistingDemoUsers() {
        User patientUser = userRepository.findByEmail("patient@telecareplus.com").orElse(null);
        User doctorUser = userRepository.findByEmail("doctor@telecareplus.com").orElse(null);
        if (patientUser == null || doctorUser == null) {
            return;
        }

        Patient patient = patientRepository.findByUserId(patientUser.getId()).orElse(null);
        Doctor doctor = doctorRepository.findByUserId(doctorUser.getId()).orElse(null);
        if (patient == null || doctor == null) {
            return;
        }

        seedCarePlanIfMissing(patient, doctor);

        AlertNotification alert;
        if (alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patient.getId()).isEmpty()) {
            AlertNotification newAlert = new AlertNotification();
            newAlert.setPatient(patient);
            newAlert.setSeverity(AlertSeverity.WARNING);
            newAlert.setMessage("Care continuity reminder: review sugar trend, medication adherence, and weekly monitoring plan.");
            newAlert.setActive(true);
            alert = alertNotificationRepository.save(newAlert);
        } else {
            alert = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patient.getId()).get(0);
        }
        Caregiver existingCaregiver = seedPrimaryCaregiver(patient);
        Caregiver sharedCaregiver = seedSecondaryCaregiver(patient);
        if (existingCaregiver != null) {
            seedCaregiverLinkIfMissing(patient, existingCaregiver);
            seedCaregiverInterventionIfMissing(patient, existingCaregiver, alert);
        }
        if (sharedCaregiver != null) {
            seedCaregiverInterventionIfMissing(patient, sharedCaregiver, alert);
        }
        Appointment latestAppointment = appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patient.getId()).stream().findFirst().orElse(null);
        seedObservationsIfMissing(patient, doctor);
        if (latestAppointment == null) {
            DemoFlow flow = seedDemoClinicalFlow(patient, doctor);
            latestAppointment = flow.appointment;
        }
        if (latestAppointment != null) {
            seedReferralIfMissing(patient, doctor, latestAppointment);
        }
        Pharmacist pharmacist = seedPharmacist();
        Prescription latestPrescription = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream().findFirst().orElse(null);
        if (latestPrescription == null && latestAppointment != null) {
            latestPrescription = seedPrescriptionFlowIfMissing(patient, doctor, latestAppointment);
        }
        if (latestPrescription != null) {
            seedMedicationItemsIfMissing(patient, latestPrescription);
            seedPharmacyDataIfMissing(patient, doctor, pharmacist, latestPrescription);
        }
        if (existingCaregiver != null) {
            seedMessagesIfMissing(patient, doctor, existingCaregiver, pharmacist);
        }
        seedChatHistoryIfMissing(patient);
        if (latestAppointment != null) {
            seedIvrSessionIfMissing(patient, latestAppointment);
        }
    }

    private void ensureAdditionalDemoAccounts() {
        User patientUser = ensureUser("anita@patient.com", "Anita Patient", "9000000011", RoleType.PATIENT, "password123");
        if (patientUser != null) {
            Patient patient = patientRepository.findByUserId(patientUser.getId()).orElse(null);
            if (patient == null) {
                Patient newPatient = new Patient();
                newPatient.setUser(patientUser);
                newPatient.setProfileComplete(true);
                newPatient.setDateOfBirth("1969-01-01");
                newPatient.setGender("Female");
                newPatient.setBloodGroup("B+");
                newPatient.setAllergies("Penicillin");
                newPatient.setDiseases("Diabetes, Hypertension");
                newPatient.setEmergencyContactName("Ravi Family");
                newPatient.setEmergencyContactPhone("9000000004");
                newPatient.setMedicalHistorySummary("Chronic diabetic patient under continuity monitoring.");
                patientRepository.save(newPatient);
            }
        }

        User pharmacistUser = ensureUser("pharmacist@telecare.com", "Priya Pharmacist", "9000000012", RoleType.PHARMACIST, "password123");
        if (pharmacistUser != null && pharmacistRepository.findByUserId(pharmacistUser.getId()).orElse(null) == null) {
            Pharmacist pharmacist = new Pharmacist();
            pharmacist.setUser(pharmacistUser);
            pharmacist.setFacilityName("TeleCare+ Community Pharmacy");
            pharmacist.setLicenseNumber("TCP-PH-002");
            pharmacist.setShiftSummary("Mon-Sat 09:00-20:00");
            pharmacistRepository.save(pharmacist);
        }

        ensureUser("admin@telecare.com", "Admin User", "9000000013", RoleType.ADMIN, "password123");
        ensureSampleDoctors();
    }

    private User ensureUser(String email, String fullName, String phone, RoleType role, String rawPassword) {
        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            return existing;
        }
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setPhone(phone);
        user.setRole(role);
        user.setPreferredLanguage("en");
        return userRepository.save(user);
    }

    private void ensureSampleDoctors() {
        ensureDoctor("doctor@telecareplus.com", "Dr. Arjun Mehta", "9000000002",
                "Internal Medicine", 12, "800.00", "MD",
                "Mon-Sat 10:00-18:00",
                "Focus on chronic care continuity and remote patient monitoring.");
        ensureDoctor("cardio@telecareplus.com", "Dr. Neha Kapoor", "9000000014",
                "Cardiology", 10, "1200.00", "DM Cardiology",
                "Mon-Fri 11:00-17:00",
                "Specializes in hypertension, heart-failure follow-up, and preventive cardiology.");
        ensureDoctor("pediatrics@telecareplus.com", "Dr. Rohan Iyer", "9000000015",
                "Pediatrics", 8, "700.00", "MD Pediatrics",
                "Mon-Sat 09:00-14:00",
                "Child wellness, fever management, and vaccination counseling.");
        ensureDoctor("derma@telecareplus.com", "Dr. Sana Verma", "9000000016",
                "Dermatology", 9, "900.00", "MD Dermatology",
                "Tue-Sun 12:00-19:00",
                "Skin and hair consultations with continuity plans for chronic conditions.");
        ensureDoctor("ortho@telecareplus.com", "Dr. Vikram Rao", "9000000017",
                "Orthopedics", 14, "1100.00", "MS Orthopedics",
                "Mon-Sat 08:00-13:00",
                "Joint pain, mobility review, and post-injury rehabilitation follow-up.");
    }

    private Doctor ensureDoctor(String email, String fullName, String phone, String specialization,
                                int experienceYears, String consultationFee, String qualification,
                                String availabilitySummary, String bio) {
        User user = ensureUser(email, fullName, phone, RoleType.DOCTOR, "Password123");
        Doctor doctor = doctorRepository.findByUserId(user.getId()).orElse(null);
        if (doctor == null) {
            doctor = new Doctor();
            doctor.setUser(user);
        }
        doctor.setSpecialization(specialization);
        doctor.setExperienceYears(experienceYears);
        doctor.setConsultationFee(new BigDecimal(consultationFee));
        doctor.setQualification(qualification);
        doctor.setAvailabilitySummary(availabilitySummary);
        doctor.setBio(bio);
        return doctorRepository.save(doctor);
    }

    private Pharmacist seedPharmacist() {
        User pharmacistUser = userRepository.findByEmail("pharmacist@telecareplus.com").orElse(null);
        if (pharmacistUser == null) {
            pharmacistUser = new User();
            pharmacistUser.setFullName("Priya Pharmacist");
            pharmacistUser.setEmail("pharmacist@telecareplus.com");
            pharmacistUser.setPassword(passwordEncoder.encode("Password123"));
            pharmacistUser.setPhone("9000000006");
            pharmacistUser.setRole(RoleType.PHARMACIST);
            pharmacistUser.setPreferredLanguage("en");
            pharmacistUser = userRepository.save(pharmacistUser);
        }

        Pharmacist pharmacist = pharmacistRepository.findByUserId(pharmacistUser.getId()).orElse(null);
        if (pharmacist == null) {
            pharmacist = new Pharmacist();
            pharmacist.setUser(pharmacistUser);
            pharmacist.setFacilityName("TeleCare+ Community Pharmacy");
            pharmacist.setLicenseNumber("TCP-PH-001");
            pharmacist.setShiftSummary("Mon-Sat 09:00-20:00");
            pharmacist = pharmacistRepository.save(pharmacist);
        }
        return pharmacist;
    }

    private Caregiver seedPrimaryCaregiver(Patient patient) {
        User caregiverUser = userRepository.findByEmail("caregiver@telecareplus.com").orElse(null);
        if (caregiverUser == null) {
            caregiverUser = new User();
            caregiverUser.setFullName("Ravi Caregiver");
            caregiverUser.setEmail("caregiver@telecareplus.com");
            caregiverUser.setPassword(passwordEncoder.encode("Password123"));
            caregiverUser.setPhone("9000000003");
            caregiverUser.setRole(RoleType.CAREGIVER);
            caregiverUser.setPreferredLanguage("en");
            caregiverUser = userRepository.save(caregiverUser);
        }

        Caregiver caregiver = caregiverRepository.findByUserId(caregiverUser.getId()).orElse(null);
        if (caregiver == null) {
            caregiver = new Caregiver();
            caregiver.setUser(caregiverUser);
            caregiver.setRelationshipLabel("Son");
            caregiver = caregiverRepository.save(caregiver);
        }

        seedCaregiverLinkIfMissing(patient, caregiver);
        return caregiver;
    }

    private void seedCaregiverLinkIfMissing(Patient patient, Caregiver caregiver) {
        if (!linkRepository.existsByPatientIdAndCaregiverIdAndActiveTrue(patient.getId(), caregiver.getId())) {
            PatientCaregiverLink link = new PatientCaregiverLink();
            link.setPatient(patient);
            link.setCaregiver(caregiver);
            link.setActive(true);
            linkRepository.save(link);
        }
    }

    private Caregiver seedSecondaryCaregiver(Patient patient) {
        User sharedUser = userRepository.findByEmail("caregiver.family@telecareplus.com").orElse(null);
        if (sharedUser == null) {
            sharedUser = new User();
            sharedUser.setFullName("Meera Family Caregiver");
            sharedUser.setEmail("caregiver.family@telecareplus.com");
            sharedUser.setPassword(passwordEncoder.encode("Password123"));
            sharedUser.setPhone("9000000005");
            sharedUser.setRole(RoleType.CAREGIVER);
            sharedUser.setPreferredLanguage("en");
            sharedUser = userRepository.save(sharedUser);
        }

        Caregiver caregiver = caregiverRepository.findByUserId(sharedUser.getId()).orElse(null);
        if (caregiver == null) {
            caregiver = new Caregiver();
            caregiver.setUser(sharedUser);
            caregiver.setRelationshipLabel("Daughter");
            caregiver = caregiverRepository.save(caregiver);
        }

        seedCaregiverLinkIfMissing(patient, caregiver);
        return caregiver;
    }

    private DemoFlow seedDemoClinicalFlow(Patient patient, Doctor doctor) {
        TriageAssessment triage = new TriageAssessment();
        triage.setPatient(patient);
        triage.setSymptoms("Fatigue, elevated sugar, mild dizziness");
        triage.setSymptomDurationDays(3);
        triage.setChestPain(false);
        triage.setSevereBreathlessness(false);
        triage.setFainting(false);
        triage.setOxygenLevel(97.0);
        triage.setTemperature(99.1);
        triage.setPersistentHighFever(false);
        triage.setLevel(TriageLevel.PRIORITY_CONSULTATION);
        triage.setRecommendation("Priority consultation advised within 24 hours with continuity review.");
        triage.setAssessedAt(LocalDateTime.now().minusDays(1));
        triage = triageRepository.save(triage);

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setTriageAssessmentId(triage.getId());
        appointment.setAppointmentDateTime(LocalDateTime.now().plusDays(1));
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setMode(ConsultationMode.TELECONSULTATION);
        appointment.setConcernSummary("Sugar fluctuation and weakness");
        appointment = appointmentRepository.save(appointment);

        Prescription prescription = seedPrescriptionFlowIfMissing(patient, doctor, appointment);

        seedMedicationItemsIfMissing(patient, prescription);

        if (healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patient.getId()).isEmpty()) {
            HealthRecord record = new HealthRecord();
            record.setPatient(patient);
            record.setBloodPressure("145/95");
            record.setSugar(248.0);
            record.setWeight(71.5);
            record.setSpo2(96.0);
            record.setPulse(92.0);
            record.setTemperature(98.7);
            record.setAlertSeverity(AlertSeverity.WARNING);
            record.setAlertMessage("Abnormal health trend detected. Priority doctor review advised.");
            record.setRecordedAt(LocalDateTime.now().minusHours(5));
            healthRecordRepository.save(record);
        }

        AlertNotification alert = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patient.getId())
            .stream()
            .findFirst()
            .orElseGet(() -> {
                AlertNotification notification = new AlertNotification();
                notification.setPatient(patient);
                notification.setSeverity(AlertSeverity.WARNING);
                notification.setMessage("Abnormal health trend detected. Priority doctor review advised.");
                notification.setActive(true);
                return alertNotificationRepository.save(notification);
            });

        return new DemoFlow(appointment, prescription, alert);
    }

    private Prescription seedPrescriptionFlowIfMissing(Patient patient, Doctor doctor, Appointment appointment) {
        Prescription existing = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream().findFirst().orElse(null);
        if (existing != null) {
            return existing;
        }

        ConsultationNote note = new ConsultationNote();
        note.setAppointment(appointment);
        note.setDoctor(appointment.getDoctor() != null ? appointment.getDoctor() : doctor);
        note.setPatient(patient);
        note.setNotes("Reviewed chronic status, advised sugar monitoring and medication adherence.");
        note.setOutcome(ConsultationOutcome.PRIORITY);
        note.setFollowUpDate(LocalDate.now().plusDays(14));
        note = consultationNoteRepository.save(note);

        Prescription prescription = new Prescription();
        prescription.setConsultationNoteId(note.getId());
        prescription.setPatient(patient);
        prescription.setDoctor(note.getDoctor());
        prescription.setNotes("Continue diabetes control medication and hydration");
        prescription.setFollowUpDate(LocalDate.now().plusDays(14));
        return prescriptionRepository.save(prescription);
    }

    private void seedMedicationItemsIfMissing(Patient patient, Prescription prescription) {
        if (prescription == null) {
            return;
        }

        MedicationItem item = medicationItemRepository.findByPrescriptionId(prescription.getId()).stream().findFirst().orElse(null);
        if (item == null) {
            item = new MedicationItem();
            item.setPrescription(prescription);
            item.setMedicineName("Metformin");
            item.setDosage("500mg");
            item.setFrequency("Twice daily");
            item.setDurationDays(5);
            item.setNotes("After meals");
            item = medicationItemRepository.save(item);
        }

        if (medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patient.getId()).isEmpty()) {
            for (int i = 0; i < 5; i++) {
                MedicationReminder reminder = new MedicationReminder();
                reminder.setPatient(patient);
                reminder.setMedicationItem(item);
                reminder.setScheduledDate(LocalDate.now().plusDays(i));
                reminder.setStatus(i == 0 ? ReminderStatus.TAKEN : ReminderStatus.PENDING);
                medicationReminderRepository.save(reminder);
            }
        }
    }

    private static class DemoFlow {
        private final Appointment appointment;
        private final Prescription prescription;
        private final AlertNotification alert;

        private DemoFlow(Appointment appointment, Prescription prescription, AlertNotification alert) {
            this.appointment = appointment;
            this.prescription = prescription;
            this.alert = alert;
        }
    }

    private void seedCarePlanIfMissing(Patient patient, Doctor doctor) {
        if (carePlanRepository.countByPatientIdAndActiveTrue(patient.getId()) > 0) {
            return;
        }

        CarePlan carePlan = new CarePlan();
        carePlan.setPatient(patient);
        carePlan.setDoctor(doctor);
        carePlan.setTitle("Diabetes continuity care plan");
        carePlan.setConditionName("Type 2 Diabetes");
        carePlan.setGoals("Keep fasting sugar under control, maintain medicine adherence above 90%, and avoid emergency fluctuations.");
        carePlan.setMedicationGuidance("Take diabetic medicines after meals as prescribed. Do not skip doses. Record missed doses in the reminders page.");
        carePlan.setLifestyleGuidance("Walk 30 minutes at least 5 days a week, reduce refined sugar intake, maintain hydration, and log weekly weight.");
        carePlan.setWarningThresholds("Escalate if sugar remains above 250 mg/dL, if dizziness worsens, or if repeated missed medication events occur.");
        carePlan.setReviewFrequency("Weekly review");
        carePlan.setActive(true);
        carePlanRepository.save(carePlan);
    }

    private void seedCaregiverInterventionIfMissing(Patient patient, Caregiver caregiver, AlertNotification alert) {
        if (caregiver == null || !caregiverInterventionRepository.findByCaregiverIdOrderByActionAtDesc(caregiver.getId()).isEmpty()) {
            return;
        }

        CaregiverIntervention intervention = new CaregiverIntervention();
        intervention.setCaregiver(caregiver);
        intervention.setPatient(patient);
        intervention.setAlertNotificationId(alert.getId());
        intervention.setActionType(CaregiverActionType.CALLED_PATIENT);
        intervention.setStatus(CaregiverInterventionStatus.IN_PROGRESS);
        intervention.setWellbeingStatus(WellbeingStatus.NEEDS_ATTENTION);
        intervention.setNotes("Called patient after abnormal sugar trend alert and advised immediate hydration plus doctor follow-up.");
        intervention.setFollowUpNeeded(true);
        intervention.setActionAt(LocalDateTime.now().minusHours(2));
        caregiverInterventionRepository.save(intervention);
    }

    private void seedObservationsIfMissing(Patient patient, Doctor doctor) {
        if (patientObservationRepository.countByPatientId(patient.getId()) > 0) {
            return;
        }

        PatientObservation labObservation = new PatientObservation();
        labObservation.setPatient(patient);
        labObservation.setDoctor(doctor);
        labObservation.setSource(ObservationSource.LAB_REPORT);
        labObservation.setObservationType("Lab chemistry");
        labObservation.setMetricName("HbA1c");
        labObservation.setMetricValue("8.4");
        labObservation.setUnit("%");
        labObservation.setAbnormalFlag(true);
        labObservation.setNotes("Recent diabetic control is above the target range.");
        labObservation.setMeasuredAt(LocalDateTime.now().minusDays(2));
        patientObservationRepository.save(labObservation);

        PatientObservation wearableObservation = new PatientObservation();
        wearableObservation.setPatient(patient);
        wearableObservation.setDoctor(doctor);
        wearableObservation.setSource(ObservationSource.WEARABLE_DEVICE);
        wearableObservation.setObservationType("Wearable trend");
        wearableObservation.setMetricName("Resting heart rate");
        wearableObservation.setMetricValue("108");
        wearableObservation.setUnit("bpm");
        wearableObservation.setAbnormalFlag(true);
        wearableObservation.setNotes("Wearable trend indicates elevated resting pulse over the last 48 hours.");
        wearableObservation.setMeasuredAt(LocalDateTime.now().minusHours(18));
        patientObservationRepository.save(wearableObservation);
    }

    private void seedReferralIfMissing(Patient patient, Doctor doctor, Appointment appointment) {
        if (!referralRecommendationRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).isEmpty()) {
            return;
        }

        ReferralRecommendation referral = new ReferralRecommendation();
        referral.setPatient(patient);
        referral.setDoctor(doctor);
        referral.setAppointment(appointment);
        referral.setSpecialty("Endocrinology");
        referral.setTargetFacility("City endocrine continuity clinic");
        referral.setReason("Persistent sugar fluctuation with abnormal HbA1c and continuity risk.");
        referral.setRecommendationNote("Specialist input advised if sugar trend remains uncontrolled after continuity review.");
        referral.setUrgency(ReferralUrgency.PRIORITY);
        referral.setStatus(ReferralStatus.SUGGESTED);
        referral.setRecommendedDate(LocalDate.now().plusDays(5));
        referralRecommendationRepository.save(referral);
    }

    private void seedPharmacyDataIfMissing(Patient patient, Doctor doctor, Pharmacist pharmacist, Prescription prescription) {
        if (pharmacyInventoryItemRepository.findByPharmacistIdOrderByMedicineNameAsc(pharmacist.getId()).isEmpty()) {
            PharmacyInventoryItem metformin = new PharmacyInventoryItem();
            metformin.setPharmacist(pharmacist);
            metformin.setMedicineName("Metformin");
            metformin.setFormulation("500mg tablet");
            metformin.setQuantityAvailable(120);
            metformin.setReorderLevel(40);
            metformin.setUnitLabel("tablets");
            metformin.setBatchNumber("B-90210");
            metformin.setExpiryDate(java.time.LocalDate.now().plusMonths(14));
            pharmacyInventoryItemRepository.save(metformin);

            PharmacyInventoryItem amoxicillin = new PharmacyInventoryItem();
            amoxicillin.setPharmacist(pharmacist);
            amoxicillin.setMedicineName("Amoxicillin");
            amoxicillin.setFormulation("500mg capsule");
            amoxicillin.setQuantityAvailable(24);
            amoxicillin.setReorderLevel(30);
            amoxicillin.setUnitLabel("capsules");
            amoxicillin.setBatchNumber("AX-330");
            amoxicillin.setExpiryDate(java.time.LocalDate.now().plusDays(45)); // Expiring soon
            pharmacyInventoryItemRepository.save(amoxicillin);

            PharmacyInventoryItem lisinopril = new PharmacyInventoryItem();
            lisinopril.setPharmacist(pharmacist);
            lisinopril.setMedicineName("Lisinopril");
            lisinopril.setFormulation("10mg tablet");
            lisinopril.setQuantityAvailable(15);
            lisinopril.setReorderLevel(50);
            lisinopril.setUnitLabel("tablets");
            lisinopril.setBatchNumber("L-4412");
            lisinopril.setExpiryDate(java.time.LocalDate.now().plusYears(2));
            pharmacyInventoryItemRepository.save(lisinopril);
        }

        if (dispenseRecordRepository.findByPrescriptionId(prescription.getId()).isEmpty()) {
            DispenseRecord record = new DispenseRecord();
            record.setPrescription(prescription);
            record.setPharmacist(pharmacist);
            record.setPatient(patient);
            record.setStatus(DispenseStatus.PENDING_VERIFICATION);
            record.setVerificationNotes("Awaiting pharmacist verification for pickup.");
            record.setPickupCode("TC" + prescription.getId() + "RX");
            dispenseRecordRepository.save(record);
        }
    }

    private void seedMessagesIfMissing(Patient patient, Doctor doctor, Caregiver caregiver, Pharmacist pharmacist) {
        if (!careMessageRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).isEmpty()) {
            return;
        }

        CareMessage doctorMessage = new CareMessage();
        doctorMessage.setPatient(patient);
        doctorMessage.setSenderUser(doctor.getUser());
        doctorMessage.setRecipientUser(patient.getUser());
        doctorMessage.setSubject("Follow-up advice");
        doctorMessage.setBody("Please keep your sugar readings updated and reply if weakness increases before the next review.");
        doctorMessage.setAcknowledged(false);
        careMessageRepository.save(doctorMessage);

        CareMessage caregiverMessage = new CareMessage();
        caregiverMessage.setPatient(patient);
        caregiverMessage.setSenderUser(caregiver.getUser());
        caregiverMessage.setRecipientUser(patient.getUser());
        caregiverMessage.setSubject("Caregiver check-in");
        caregiverMessage.setBody("I will help confirm today's medicine reminder and your evening reading.");
        caregiverMessage.setAcknowledged(false);
        careMessageRepository.save(caregiverMessage);

        CareMessage pharmacistMessage = new CareMessage();
        pharmacistMessage.setPatient(patient);
        pharmacistMessage.setSenderUser(pharmacist.getUser());
        pharmacistMessage.setRecipientUser(patient.getUser());
        pharmacistMessage.setSubject("Prescription verification");
        pharmacistMessage.setBody("Your prescription is in the pharmacist queue. Please watch for pickup confirmation.");
        pharmacistMessage.setAcknowledged(false);
        careMessageRepository.save(pharmacistMessage);
    }

    private void seedChatHistoryIfMissing(Patient patient) {
        if (!patientChatMessageRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).isEmpty()) {
            return;
        }

        PatientChatMessage chat = new PatientChatMessage();
        chat.setPatient(patient);
        chat.setQuestion("How should I manage my sugar readings this week?");
        chat.setAnswer("Track fasting and post-meal sugar regularly, avoid skipped medicines, and request doctor review if dizziness worsens.");
        chat.setUrgencyLabel("ROUTINE");
        chat.setSuggestedActions("Record fasting sugar||Do not skip medicines||Book a follow-up if weakness continues");
        patientChatMessageRepository.save(chat);
    }

    private void seedIvrSessionIfMissing(Patient patient, Appointment appointment) {
        if (!ivrBookingSessionRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).isEmpty()) {
            return;
        }

        IvrBookingSession session = new IvrBookingSession();
        session.setPatient(patient);
        session.setPhoneNumber(patient.getUser().getPhone());
        session.setLanguageCode("en");
        session.setServiceType(IvrServiceType.APPOINTMENT);
        session.setStatus(IvrSessionStatus.COMPLETED);
        session.setSelectedMode(ConsultationMode.TELECONSULTATION);
        session.setRequestedDateTime(appointment.getAppointmentDateTime());
        session.setConcernSummary(appointment.getConcernSummary());
        session.setTranscriptSummary("IVR appointment support created a continuity booking for the latest patient review.");
        session.setAppointment(appointment);
        ivrBookingSessionRepository.save(session);
    }
}
