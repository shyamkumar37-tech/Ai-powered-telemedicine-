package com.telecareplus.service.impl;

import com.telecareplus.dto.PrescriptionDtos;
import com.telecareplus.entity.DispenseRecord;
import com.telecareplus.entity.MedicationItem;
import com.telecareplus.entity.MedicationReminder;
import com.telecareplus.entity.Pharmacist;
import com.telecareplus.entity.Prescription;
import com.telecareplus.entity.enums.DispenseStatus;
import com.telecareplus.entity.enums.ReminderStatus;
import com.telecareplus.exception.BadRequestException;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.security.MedicalAccessAuthorizer;
import com.telecareplus.repository.ConsultationNoteRepository;
import com.telecareplus.repository.DispenseRecordRepository;
import com.telecareplus.repository.MedicationItemRepository;
import com.telecareplus.repository.MedicationReminderRepository;
import com.telecareplus.repository.PharmacistRepository;
import com.telecareplus.repository.PrescriptionRepository;
import com.telecareplus.service.PrescriptionService;
import com.telecareplus.util.MapperUtil;
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

    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationItemRepository medicationItemRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final PharmacistRepository pharmacistRepository;
    private final DispenseRecordRepository dispenseRecordRepository;
    private final MedicalAccessAuthorizer medicalAccessAuthorizer;

    @Override
    @Transactional
    public PrescriptionDtos.PrescriptionResponse createPrescription(PrescriptionDtos.PrescriptionRequest request) {
        var consultation = consultationNoteRepository.findById(request.consultationNoteId()).orElseThrow(() -> new ResourceNotFoundException("Consultation not found"));
        if (prescriptionRepository.existsByConsultationNoteId(request.consultationNoteId())) {
            throw new BadRequestException("Prescription already created for consultation");
        }

        Prescription prescription = new Prescription();
        prescription.setConsultationNote(consultation);
        prescription.setPatient(consultation.getPatient());
        prescription.setDoctor(consultation.getDoctor());
        prescription.setNotes(buildPrescriptionNote(request, consultation));
        prescription.setFollowUpDate(request.followUpDate() != null ? request.followUpDate() : consultation.getFollowUpDate());
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
                reminder.setPatient(consultation.getPatient());
                reminder.setMedicationItem(item);
                reminder.setScheduledDate(LocalDate.now().plusDays(day));
                reminder.setStatus(ReminderStatus.PENDING);
                medicationReminderRepository.save(reminder);
            }
        }

        createDispenseRecordIfPossible(prescription, consultation.getPatient());
        return MapperUtil.toPrescriptionResponse(prescription, items);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('PATIENT','CAREGIVER') and @medicalAccessAuthorizer.canViewMedicationHistory(authentication, #patientId)")
    @RateLimiter(name = "medicationHistoryRateLimiter", fallbackMethod = "medicationHistoryRateLimitFallback")
    public Page<PrescriptionDtos.PrescriptionResponse> getPatientPrescriptions(Long patientId, Pageable pageable) {
        medicalAccessAuthorizer.assertCanViewMedicationHistory(SecurityContextHolder.getContext().getAuthentication(), patientId);

        Page<Long> pageIds = prescriptionRepository.findPageIdsByPatientId(patientId, pageable);
        if (pageIds.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Prescription> prescriptions = prescriptionRepository.findAllWithItemsByIdIn(pageIds.getContent());
        List<PrescriptionDtos.PrescriptionResponse> responses = pageIds.getContent().stream()
                .map(id -> prescriptions.stream()
                        .filter(prescription -> prescription.getId().equals(id))
                        .findFirst()
                        .map(prescription -> MapperUtil.toPrescriptionResponse(prescription, prescription.getMedicationItems()))
                        .orElseThrow(() -> new ResourceNotFoundException("Prescription not found")))
                .toList();
        return new PageImpl<>(responses, pageable, pageIds.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDtos.PrescriptionResponse getPrescriptionByConsultationId(Long consultationNoteId) {
        Prescription prescription = prescriptionRepository.findByConsultationNoteId(consultationNoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
        return MapperUtil.toPrescriptionResponse(prescription, prescription.getMedicationItems());
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDtos.PrescriptionResponse getPrescription(Long prescriptionId) {
        Prescription prescription = prescriptionRepository.findWithItemsById(prescriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
        return MapperUtil.toPrescriptionResponse(prescription, prescription.getMedicationItems());
    }

    @SuppressWarnings("unused")
    private Page<PrescriptionDtos.PrescriptionResponse> medicationHistoryRateLimitFallback(
            Long patientId,
            Pageable pageable,
            Throwable throwable
    ) {
        throw new BadRequestException("Too many medication history requests. Please try again later.");
    }

    private String buildPrescriptionNote(PrescriptionDtos.PrescriptionRequest request, com.telecareplus.entity.ConsultationNote consultation) {
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
        noteParts.add("Patient: " + defaultText(request.patientDisplayName(), consultation.getPatient().getUser().getFullName()));
        noteParts.add("Doctor: " + consultation.getDoctor().getUser().getFullName());
        noteParts.add("Consultation summary: " + defaultText(consultation.getNotes(), "Doctor review completed."));
        noteParts.add("Clinical outcome: " + consultation.getOutcome().name().replace('_', ' '));
        noteParts.add("Medicines:");
        noteParts.add(String.join("\n", medicineLines));

        LocalDate followUpDate = request.followUpDate() != null ? request.followUpDate() : consultation.getFollowUpDate();
        if (followUpDate != null) {
            noteParts.add("Follow-up date: " + followUpDate);
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

    private void createDispenseRecordIfPossible(Prescription prescription, com.telecareplus.entity.Patient patient) {
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
}
