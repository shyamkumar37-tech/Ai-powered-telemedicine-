package com.telecareplus.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.telecareplus.entity.Appointment;
import com.telecareplus.entity.AlertNotification;
import com.telecareplus.entity.Caregiver;
import com.telecareplus.entity.ConsultationNote;
import com.telecareplus.entity.Doctor;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.PatientCaregiverLink;
import com.telecareplus.entity.Prescription;
import com.telecareplus.entity.TriageAssessment;
import com.telecareplus.entity.User;
import com.telecareplus.entity.enums.AlertSeverity;
import com.telecareplus.entity.enums.AppointmentStatus;
import com.telecareplus.entity.enums.ConsultationMode;
import com.telecareplus.entity.enums.ConsultationOutcome;
import com.telecareplus.entity.enums.RoleType;
import com.telecareplus.entity.enums.TriageLevel;
import com.telecareplus.repository.AlertNotificationRepository;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.CaregiverRepository;
import com.telecareplus.repository.ConsultationNoteRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.PatientCaregiverLinkRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PrescriptionRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import com.telecareplus.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import com.telecareplus.repository.elasticsearch.PatientSearchRepository;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ResourceAuthorizationIntegrationTest {

    @MockBean
    private ElasticsearchOperations elasticsearchOperations;

    @MockBean
    private PatientSearchRepository patientSearchRepository;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private CaregiverRepository caregiverRepository;

    @Autowired
    private PatientCaregiverLinkRepository patientCaregiverLinkRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private ConsultationNoteRepository consultationNoteRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private TriageAssessmentRepository triageAssessmentRepository;

    @Autowired
    private AlertNotificationRepository alertNotificationRepository;

    private Patient primaryPatient;
    private Patient otherPatient;
    private Doctor primaryDoctor;
    private Doctor otherDoctor;
    private Caregiver primaryCaregiver;
    private Caregiver otherCaregiver;

    @BeforeEach
    void setUp() {
        primaryPatient = patientFor("patient@telecareplus.com");
        otherPatient = patientFor("anita@patient.com");
        primaryDoctor = doctorFor("doctor@telecareplus.com");
        otherDoctor = doctorFor("cardio@telecareplus.com");
        primaryCaregiver = caregiverFor("caregiver@telecareplus.com");
        otherCaregiver = caregiverFor("caregiver.family@telecareplus.com");
    }

    @ParameterizedTest
    @MethodSource("patientScopedEndpoints")
    void patientCannotReadAnotherPatientsResources(String endpointTemplate) {
        String path = endpointTemplate.formatted(otherPatient.getId());

        ResponseEntity<String> response = get(path, tokenFor(primaryPatient.getUser()));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void doctorCannotUseAnotherDoctorProfileId() {
        ResponseEntity<String> response = get(
                "/api/appointments/doctor/" + otherDoctor.getId(),
                tokenFor(primaryDoctor.getUser())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void doctorCannotReadUnassignedPatientAiResource() {
        ResponseEntity<String> response = get(
                "/api/ai/treatment-recommendations/" + otherPatient.getId(),
                tokenFor(primaryDoctor.getUser())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @ParameterizedTest
    @MethodSource("doctorPatientScopedEndpoints")
    void doctorCannotReadUnassignedPatientResources(String endpointTemplate) {
        String path = endpointTemplate.formatted(otherPatient.getId());

        ResponseEntity<String> response = get(path, tokenFor(primaryDoctor.getUser()));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void caregiverCannotUseAnotherCaregiverProfileId() {
        ResponseEntity<String> response = get(
                "/api/messages/caregiver/" + otherCaregiver.getId(),
                tokenFor(primaryCaregiver.getUser())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void caregiverCannotReadUnlinkedPatientResource() {
        ResponseEntity<String> response = get(
                "/api/ai/insights/caregiver/deviations/" + otherPatient.getId(),
                tokenFor(primaryCaregiver.getUser())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @ParameterizedTest
    @MethodSource("caregiverPatientScopedEndpoints")
    void caregiverCannotReadUnlinkedPatientResources(String endpointTemplate) {
        String path = endpointTemplate.formatted(otherPatient.getId());

        ResponseEntity<String> response = get(path, tokenFor(primaryCaregiver.getUser()));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void caregiverCannotReadPatientWithExpiredLink() {
        PatientCaregiverLink link = caregiverLinkFor(otherPatient, primaryCaregiver);
        link.setActive(true);
        link.setValidFrom(Instant.now().minusSeconds(86_400));
        link.setValidTo(Instant.now().minusSeconds(60));

        assertCaregiverLinkDoesNotAuthorize(link, "/api/ai/insights/adherence/" + otherPatient.getId());
    }

    @Test
    void caregiverCannotReadPatientWithRevokedLink() {
        PatientCaregiverLink link = caregiverLinkFor(otherPatient, primaryCaregiver);
        link.setActive(true);
        link.setValidFrom(Instant.now().minusSeconds(86_400));
        link.setRevokedAt(Instant.now().minusSeconds(60));

        assertCaregiverLinkDoesNotAuthorize(link, "/api/ai/insights/adherence/" + otherPatient.getId());
    }

    @Test
    void caregiverRevocationIsReadLiveOnNextRequest() {
        PatientCaregiverLink link = caregiverLinkFor(otherPatient, primaryCaregiver);
        link.setActive(true);
        link.setValidFrom(Instant.now().minusSeconds(86_400));
        link.setValidTo(Instant.now().plusSeconds(86_400));

        link = patientCaregiverLinkRepository.save(link);
        try {
            ResponseEntity<String> allowed = get(
                    "/api/ai/insights/adherence/" + otherPatient.getId(),
                    tokenFor(primaryCaregiver.getUser())
            );
            assertThat(allowed.getStatusCode()).isNotEqualTo(HttpStatus.FORBIDDEN);

            link.setRevokedAt(Instant.now());
            patientCaregiverLinkRepository.save(link);

            ResponseEntity<String> denied = get(
                    "/api/ai/insights/adherence/" + otherPatient.getId(),
                    tokenFor(primaryCaregiver.getUser())
            );
            assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        } finally {
            patientCaregiverLinkRepository.deleteById(link.getId());
        }
    }

    @Test
    void prescriptionAuthorizationUsesConsultationAppointmentOwnership() {
        Appointment appointment = new Appointment();
        ConsultationNote consultation = new ConsultationNote();
        Prescription prescription = new Prescription();

        try {
            appointment.setPatient(primaryPatient);
            appointment.setDoctor(primaryDoctor);
            appointment.setAppointmentDateTime(LocalDateTime.now().plusYears(5).plusSeconds(System.nanoTime() % 10_000));
            appointment.setStatus(AppointmentStatus.BOOKED);
            appointment.setMode(ConsultationMode.TELECONSULTATION);
            appointment.setConcernSummary("Ownership regression test");
            appointment = appointmentRepository.save(appointment);

            consultation.setAppointment(appointment);
            consultation.setPatient(primaryPatient);
            consultation.setDoctor(primaryDoctor);
            consultation.setNotes("Prescription authorization should follow the appointment relationship.");
            consultation.setOutcome(ConsultationOutcome.ROUTINE);
            consultation = consultationNoteRepository.save(consultation);

            prescription.setConsultationNote(consultation);
            prescription.setPatient(otherPatient);
            prescription.setDoctor(otherDoctor);
            prescription.setNotes("Deliberately mismatched denormalized owner columns.");
            prescription = prescriptionRepository.save(prescription);

            ResponseEntity<String> response = get(
                    "/api/prescriptions/" + prescription.getId(),
                    tokenFor(primaryPatient.getUser())
            );

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        } finally {
            if (prescription.getId() != null) {
                prescriptionRepository.deleteById(prescription.getId());
            }
            if (consultation.getId() != null) {
                consultationNoteRepository.deleteById(consultation.getId());
            }
            if (appointment.getId() != null) {
                appointmentRepository.deleteById(appointment.getId());
            }
        }
    }

    @Test
    void patientCannotSpoofPatientIdInWriteRequests() {
        String token = tokenFor(primaryPatient.getUser());

        assertForbidden(post("/api/triage", """
                {"patientId":%d,"symptoms":"test","symptomDurationDays":1,"chestPain":false,"severeBreathlessness":false,"fainting":false,"oxygenLevel":98,"temperature":98.6,"persistentHighFever":false}
                """.formatted(otherPatient.getId()), token));
        assertForbidden(post("/api/health-records", """
                {"patientId":%d,"bloodPressure":"120/80","sugar":110,"weight":70,"spo2":98,"pulse":80,"temperature":98.6}
                """.formatted(otherPatient.getId()), token));
        assertForbidden(post("/api/chatbot/ask", """
                {"patientId":%d,"question":"show me data"}
                """.formatted(otherPatient.getId()), token));
        assertForbidden(post("/api/ivr/sessions", """
                {"patientId":%d,"phoneNumber":"9000000000","languageCode":"en","serviceType":"APPOINTMENT"}
                """.formatted(otherPatient.getId()), token));
        assertForbidden(post("/api/ai/premium/symptom-chat", """
                {"patientId":%d,"message":"headache","history":[],"locale":"en"}
                """.formatted(otherPatient.getId()), token));
    }

    @Test
    void doctorCannotSpoofPatientOrDoctorIdsInWriteRequests() {
        String token = tokenFor(primaryDoctor.getUser());

        assertForbidden(post("/api/care-plans", """
                {"patientId":%d,"doctorId":%d,"title":"Plan","conditionName":"Test","goals":"Review","active":true}
                """.formatted(otherPatient.getId(), primaryDoctor.getId()), token));
        assertForbidden(post("/api/future-care/referrals", """
                {"doctorId":%d,"patientId":%d,"specialty":"Cardiology","reason":"Test","urgency":"ROUTINE"}
                """.formatted(primaryDoctor.getId(), otherPatient.getId()), token));
    }

    @Test
    void caregiverCannotSpoofUnlinkedPatientInWriteRequests() {
        String token = tokenFor(primaryCaregiver.getUser());

        assertForbidden(post("/api/caregiver-interventions", """
                {"caregiverId":%d,"patientId":%d,"actionType":"CALLED_PATIENT","wellbeingStatus":"STABLE","notes":"Test","followUpNeeded":false}
                """.formatted(primaryCaregiver.getId(), otherPatient.getId()), token));
        assertForbidden(post("/api/ai/extensions/n8n/trigger", """
                {"workflowName":"test","patientId":%d,"payload":{}}
                """.formatted(otherPatient.getId()), token));
    }

    @Test
    void messageSenderCannotSpoofAnotherUser() {
        String token = tokenFor(primaryPatient.getUser());

        assertForbidden(post("/api/messages", """
                {"patientId":%d,"senderUserId":%d,"recipientUserId":%d,"subject":"Test","body":"Test"}
                """.formatted(primaryPatient.getId(), primaryDoctor.getUser().getId(), primaryCaregiver.getUser().getId()), token));
    }

    @Test
    void messageSenderCannotSpoofUnrelatedRecipientUser() {
        String token = tokenFor(primaryPatient.getUser());

        assertForbidden(post("/api/messages", """
                {"patientId":%d,"senderUserId":%d,"recipientUserId":%d,"subject":"Test","body":"Test"}
                """.formatted(primaryPatient.getId(), primaryPatient.getUser().getId(), otherPatient.getUser().getId()), token));
    }

    @Test
    void caregiverCannotSelfLinkToUnlinkedPatient() {
        String token = tokenFor(primaryCaregiver.getUser());

        assertForbidden(post("/api/caregivers/link", """
                {"patientId":%d,"caregiverId":%d}
                """.formatted(otherPatient.getId(), primaryCaregiver.getId()), token));
    }

    @Test
    void patientCannotAttachAnotherPatientsTriageToAppointment() {
        TriageAssessment triage = triageFor(otherPatient);
        try {
            String token = tokenFor(primaryPatient.getUser());

            assertForbidden(post("/api/appointments", """
                    {"patientId":%d,"doctorId":%d,"triageAssessmentId":%d,"appointmentDateTime":"%s","mode":"TELECONSULTATION","concernSummary":"Test"}
                    """.formatted(
                    primaryPatient.getId(),
                    primaryDoctor.getId(),
                    triage.getId(),
                    LocalDateTime.now().plusYears(5).plusSeconds(System.nanoTime() % 10_000)
            ), token));
        } finally {
            triageAssessmentRepository.deleteById(triage.getId());
        }
    }

    @Test
    void caregiverCannotAttachAnotherPatientsAlertToIntervention() {
        AlertNotification alert = alertFor(otherPatient);
        try {
            String token = tokenFor(primaryCaregiver.getUser());

            assertForbidden(post("/api/caregiver-interventions", """
                    {"caregiverId":%d,"patientId":%d,"alertNotificationId":%d,"actionType":"CALLED_PATIENT","wellbeingStatus":"STABLE","notes":"Test","followUpNeeded":false}
                    """.formatted(primaryCaregiver.getId(), primaryPatient.getId(), alert.getId()), token));
        } finally {
            alertNotificationRepository.deleteById(alert.getId());
        }
    }

    @Test
    void doctorCannotAttachMismatchedAppointmentToReferral() {
        Appointment primaryAppointment = appointmentFor(primaryPatient, primaryDoctor);
        Appointment otherAppointment = appointmentFor(otherPatient, primaryDoctor);
        try {
            String token = tokenFor(primaryDoctor.getUser());

            assertForbidden(post("/api/future-care/referrals", """
                    {"doctorId":%d,"patientId":%d,"appointmentId":%d,"specialty":"Cardiology","reason":"Test","urgency":"ROUTINE"}
                    """.formatted(primaryDoctor.getId(), otherPatient.getId(), primaryAppointment.getId()), token));
        } finally {
            appointmentRepository.deleteById(otherAppointment.getId());
            appointmentRepository.deleteById(primaryAppointment.getId());
        }
    }

    static List<String> patientScopedEndpoints() {
        return List.of(
                "/api/dashboard/patient/%d",
                "/api/appointments/patient/%d",
                "/api/care-plans/patient/%d",
                "/api/chatbot/patient/%d",
                "/api/consultations/patient/%d",
                "/api/reminders/patient/%d/adherence",
                "/api/reminders/patient/%d",
                "/api/health-records/patient/%d",
                "/api/health-records/patient/%d/summary",
                "/api/triage/patient/%d",
                "/api/medical-records/patient/%d",
                "/api/alerts/patient/%d",
                "/api/prescriptions/patient/%d",
                "/api/future-care/patient/%d/deterioration",
                "/api/future-care/patient/%d/copilot",
                "/api/future-care/patient/%d/adaptive-triage",
                "/api/future-care/patient/%d/family-network",
                "/api/future-care/patient/%d/observations",
                "/api/future-care/patient/%d/follow-up-autopilot",
                "/api/intelligence/patient/%d/timeline",
                "/api/intelligence/patient/%d/compliance",
                "/api/intelligence/patient/%d/education",
                "/api/ivr/patient/%d/sessions",
                "/api/messages/patient/%d",
                "/api/ai/report-summary/%d",
                "/api/ai/risk-prediction/%d",
                "/api/ai/extensions/anomaly/%d",
                "/api/ai/extensions/recommendations/%d",
                "/api/ai/insights/adherence/%d",
                "/api/ai/insights/health-trends/%d",
                "/api/ai/insights/follow-up/%d",
                "/api/ai/insights/journey/%d",
                "/api/ai/insights/caregiver/deviations/%d",
                "/api/ai/insights/mood/%d",
                "/api/ai/insights/mood/%d/trends",
                "/api/ai/insights/stress-recommendations/%d",
                "/api/ai/premium/risk-snapshot/%d",
                "/api/ai/premium/appointment-prep/%d",
                "/api/ai/premium/follow-up-plan/%d",
                "/api/ai/premium/predictive-risk/%d",
                "/api/ai/premium/report-generator/%d"
        );
    }

    static List<String> doctorPatientScopedEndpoints() {
        return List.of(
                "/api/ai/report-summary/%d",
                "/api/ai/risk-prediction/%d",
                "/api/ai/treatment-recommendations/%d",
                "/api/ai/extensions/anomaly/%d",
                "/api/ai/extensions/recommendations/%d",
                "/api/ai/insights/adherence/%d",
                "/api/ai/insights/health-trends/%d",
                "/api/ai/insights/follow-up/%d",
                "/api/ai/insights/journey/%d",
                "/api/ai/insights/caregiver/deviations/%d",
                "/api/ai/insights/caregiver/checkin-script/%d",
                "/api/ai/premium/follow-up-plan/%d",
                "/api/ai/premium/careplan-adherence/%d",
                "/api/ai/premium/escalation-rules/%d",
                "/api/ai/premium/predictive-risk/%d",
                "/api/ai/premium/report-generator/%d"
        );
    }

    static List<String> caregiverPatientScopedEndpoints() {
        return List.of(
                "/api/ai/report-summary/%d",
                "/api/ai/risk-prediction/%d",
                "/api/ai/extensions/anomaly/%d",
                "/api/ai/extensions/recommendations/%d",
                "/api/ai/insights/adherence/%d",
                "/api/ai/insights/health-trends/%d",
                "/api/ai/insights/follow-up/%d",
                "/api/ai/insights/journey/%d",
                "/api/ai/insights/caregiver/deviations/%d",
                "/api/ai/insights/caregiver/checkin-script/%d",
                "/api/ai/insights/mood/%d",
                "/api/ai/insights/mood/%d/trends",
                "/api/ai/insights/stress-recommendations/%d",
                "/api/ai/premium/risk-snapshot/%d",
                "/api/ai/premium/careplan-adherence/%d",
                "/api/ai/premium/escalation-rules/%d",
                "/api/ai/premium/report-generator/%d"
        );
    }

    private ResponseEntity<String> get(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return restTemplate.exchange(path, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    private ResponseEntity<String> post(String path, String body, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.exchange(path, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
    }

    private void assertForbidden(ResponseEntity<String> response) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    private void assertCaregiverLinkDoesNotAuthorize(PatientCaregiverLink link, String path) {
        link = patientCaregiverLinkRepository.save(link);
        try {
            ResponseEntity<String> response = get(path, tokenFor(primaryCaregiver.getUser()));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        } finally {
            patientCaregiverLinkRepository.deleteById(link.getId());
        }
    }

    private PatientCaregiverLink caregiverLinkFor(Patient patient, Caregiver caregiver) {
        assertThat(patientCaregiverLinkRepository.hasActivePatientAccess(
                patient.getId(),
                caregiver.getUser().getId(),
                Instant.now()
        )).isFalse();

        PatientCaregiverLink link = new PatientCaregiverLink();
        link.setPatient(patient);
        link.setCaregiver(caregiver);
        link.setMedicationHistoryReadAllowed(true);
        return link;
    }

    private TriageAssessment triageFor(Patient patient) {
        TriageAssessment triage = new TriageAssessment();
        triage.setPatient(patient);
        triage.setSymptoms("Phase 2 authorization test");
        triage.setLevel(TriageLevel.ROUTINE_CONSULTATION);
        triage.setRecommendation("Test only");
        triage.setAssessedAt(LocalDateTime.now());
        return triageAssessmentRepository.save(triage);
    }

    private AlertNotification alertFor(Patient patient) {
        AlertNotification alert = new AlertNotification();
        alert.setPatient(patient);
        alert.setSeverity(AlertSeverity.WARNING);
        alert.setMessage("Phase 2 authorization test");
        alert.setActive(true);
        return alertNotificationRepository.save(alert);
    }

    private Appointment appointmentFor(Patient patient, Doctor doctor) {
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDateTime(LocalDateTime.now().plusYears(5).plusSeconds(System.nanoTime() % 10_000));
        appointment.setStatus(AppointmentStatus.BOOKED);
        appointment.setMode(ConsultationMode.TELECONSULTATION);
        appointment.setConcernSummary("Phase 2 authorization test");
        return appointmentRepository.save(appointment);
    }

    private String tokenFor(User user) {
        Long profileId = switch (user.getRole()) {
            case PATIENT -> patientRepository.findByUserId(user.getId()).map(Patient::getId).orElse(null);
            case DOCTOR -> doctorRepository.findByUserId(user.getId()).map(Doctor::getId).orElse(null);
            case CAREGIVER -> caregiverRepository.findByUserId(user.getId()).map(Caregiver::getId).orElse(null);
            default -> null;
        };
        return jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name(), profileId);
    }

    private Patient patientFor(String email) {
        User user = userFor(email, RoleType.PATIENT);
        return patientRepository.findByUserId(user.getId()).orElseThrow();
    }

    private Doctor doctorFor(String email) {
        User user = userFor(email, RoleType.DOCTOR);
        return doctorRepository.findByUserId(user.getId()).orElseThrow();
    }

    private Caregiver caregiverFor(String email) {
        User user = userFor(email, RoleType.CAREGIVER);
        return caregiverRepository.findByUserId(user.getId()).orElseThrow();
    }

    private User userFor(String email, RoleType role) {
        User user = userRepository.findByEmail(email).orElseThrow();
        assertThat(user.getRole()).isEqualTo(role);
        return user;
    }
}
