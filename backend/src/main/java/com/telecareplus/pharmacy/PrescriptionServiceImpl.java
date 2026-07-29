package com.telecareplus.pharmacy;

import com.telecareplus.users.Doctor;
import com.telecareplus.users.Patient;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.users.DoctorRepository;


import com.telecareplus.pharmacy.PrescriptionDtos;
import com.telecareplus.pharmacy.DispenseRecord;
import com.telecareplus.pharmacy.MedicationItem;
import com.telecareplus.pharmacy.MedicationReminder;
import com.telecareplus.users.Pharmacist;
import com.telecareplus.pharmacy.Prescription;
import com.telecareplus.pharmacy.DispenseStatus;
import com.telecareplus.pharmacy.ReminderStatus;
import com.telecareplus.common.BadRequestException;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.pharmacy.DispenseRecordRepository;
import com.telecareplus.pharmacy.MedicationItemRepository;
import com.telecareplus.pharmacy.MedicationReminderRepository;
import com.telecareplus.users.PharmacistRepository;
import com.telecareplus.pharmacy.PrescriptionRepository;
import com.telecareplus.pharmacy.PrescriptionService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationItemRepository medicationItemRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final PharmacistRepository pharmacistRepository;
    private final DispenseRecordRepository dispenseRecordRepository;

    @Override
    @Transactional
    public PrescriptionDtos.PrescriptionResponse createPrescription(PrescriptionDtos.PrescriptionRequest request) {
        if (prescriptionRepository.existsByConsultationNoteId(request.consultationNoteId())) {
            throw new BadRequestException("Prescription already created for consultation");
        }

        Patient patient = request.patientId() != null
                ? patientRepository.findById(request.patientId()).orElseThrow(() -> new ResourceNotFoundException("Patient not found"))
                : patientRepository.findAll().stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        Doctor doctor = request.doctorId() != null
                ? doctorRepository.findById(request.doctorId()).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"))
                : doctorRepository.findAll().stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        Prescription prescription = new Prescription();
        prescription.setConsultationNoteId(request.consultationNoteId());
        prescription.setPatient(patient);
        prescription.setDoctor(doctor);
        prescription.setNotes(buildPrescriptionNote(request, patient.getUser().getFullName(), doctor.getUser().getFullName()));
        prescription.setFollowUpDate(request.followUpDate());
        prescription = prescriptionRepository.save(prescription);

        List<MedicationItem> items = new ArrayList<>();
        for (var itemRequest : request.medications()) {
            MedicationItem item = new MedicationItem();
            item.setPrescription(prescription);
            item.setMedicineName(itemRequest.medicineName());
            item.setDosage(itemRequest.dosage());
            item.setFrequency(itemRequest.frequency());
            item.setDurationDays(itemRequest.durationDays());
            item.setNotes(itemRequest.notes());
            item = medicationItemRepository.save(item);
            items.add(item);

            for (int day = 0; day < itemRequest.durationDays(); day++) {
                MedicationReminder reminder = new MedicationReminder();
                reminder.setPatient(patient);
                reminder.setMedicationItem(item);
                reminder.setScheduledDate(LocalDate.now().plusDays(day));
                reminder.setStatus(ReminderStatus.PENDING);
                medicationReminderRepository.save(reminder);
            }
        }

        createDispenseRecordIfPossible(prescription, patient);
        return toPrescriptionResponse(prescription, items);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('PATIENT','CAREGIVER') and @medicalAccessAuthorizer.canViewMedicationHistory(authentication, #patientId)")
    @RateLimiter(name = "medicationHistoryRateLimiter", fallbackMethod = "medicationHistoryRateLimitFallback")
    public Page<PrescriptionDtos.PrescriptionResponse> getPatientPrescriptions(Long patientId, Pageable pageable) {

        Page<Long> pageIds = prescriptionRepository.findPageIdsByPatientId(patientId, pageable);
        if (pageIds.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Prescription> prescriptions = prescriptionRepository.findAllWithItemsByIdIn(pageIds.getContent());
        List<PrescriptionDtos.PrescriptionResponse> responses = pageIds.getContent().stream()
                .map(id -> prescriptions.stream()
                        .filter(prescription -> prescription.getId().equals(id))
                        .findFirst()
                        .map(prescription -> toPrescriptionResponse(prescription, prescription.getMedicationItems()))
                        .orElseThrow(() -> new ResourceNotFoundException("Prescription not found")))
                .toList();
        return new PageImpl<>(responses, pageable, pageIds.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDtos.PrescriptionResponse getPrescriptionByConsultationId(Long consultationNoteId) {
        Prescription prescription = prescriptionRepository.findByConsultationNoteId(consultationNoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
        return toPrescriptionResponse(prescription, prescription.getMedicationItems());
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDtos.PrescriptionResponse getPrescription(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findWithItemsById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
        return toPrescriptionResponse(prescription, prescription.getMedicationItems());
    }

    @SuppressWarnings("unused")
    private Page<PrescriptionDtos.PrescriptionResponse> medicationHistoryRateLimitFallback(
            Long patientId,
            Pageable pageable,
            Throwable throwable
    ) {
        throw new BadRequestException("Too many medication history requests. Please try again later.");
    }

    private String buildPrescriptionNote(PrescriptionDtos.PrescriptionRequest request, String patientName, String doctorName) {
        if (request.notes() != null && !request.notes().isBlank()) {
            return request.notes().trim();
        }

        List<String> medicineLines = request.medications().stream()
                .map(item -> String.format(
                        "- %s | Dosage: %s | Frequency: %s | Duration: %d day(s)%s",
                        item.medicineName(),
                        item.dosage(),
                        item.frequency(),
                        item.durationDays(),
                        item.notes() != null && !item.notes().isBlank() ? " | Advice: " + item.notes().trim() : ""))
                .toList();

        List<String> noteParts = new ArrayList<>();
        noteParts.add("PRESCRIPTION SUMMARY");
        noteParts.add("Patient: " + defaultText(request.patientDisplayName(), patientName));
        noteParts.add("Doctor: " + doctorName);
        noteParts.add("Medicines:");
        noteParts.add(String.join("\n", medicineLines));

        if (request.followUpDate() != null) {
            noteParts.add("Follow-up date: " + request.followUpDate());
        }

        noteParts.add("General advice: Take medicines as prescribed and seek review if symptoms worsen.");

        return noteParts.stream()
                .filter(Objects::nonNull)
                .filter(part -> !part.isBlank())
                .reduce((left, right) -> left + "\n" + right)
                .orElse("Prescription generated from consultation record.");
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private void createDispenseRecordIfPossible(Prescription prescription, Patient patient) {
        if (dispenseRecordRepository.findByPrescriptionId(prescription.getId()).isPresent()) {
            return;
        }

        Pharmacist pharmacist = pharmacistRepository.findAll().stream().findFirst().orElse(null);
        if (pharmacist == null) {
            return;
        }

        DispenseRecord record = new DispenseRecord();
        record.setPrescription(prescription);
        record.setPharmacist(pharmacist);
        record.setPatient(patient);
        record.setStatus(DispenseStatus.PENDING_VERIFICATION);
        record.setVerificationNotes("Awaiting pharmacist verification for pickup.");
        record.setPickupCode("TC" + prescription.getId() + "RX");
        dispenseRecordRepository.save(record);
    }
    private PrescriptionDtos.PrescriptionResponse toPrescriptionResponse(Prescription prescription, List<MedicationItem> items) {
        return new PrescriptionDtos.PrescriptionResponse(
                prescription.getId(),
                prescription.getPatient().getId(),
                prescription.getPatient().getUser().getFullName(),
                prescription.getDoctor().getUser().getFullName(),
                prescription.getNotes(),
                prescription.getFollowUpDate(),
                items.stream().map(item -> new PrescriptionDtos.MedicationItemResponse(
                        item.getId(), item.getMedicineName(), item.getDosage(), item.getFrequency(), item.getDurationDays(), item.getNotes()
                )).toList()
        );
    }
}
