package com.telecareplus.service.impl;

import com.telecareplus.dto.PharmacistDtos;
import com.telecareplus.entity.DispenseRecord;
import com.telecareplus.entity.Pharmacist;
import com.telecareplus.entity.PharmacyInventoryItem;
import com.telecareplus.entity.enums.DispenseStatus;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.DispenseRecordRepository;
import com.telecareplus.repository.MedicationItemRepository;
import com.telecareplus.repository.PharmacistRepository;
import com.telecareplus.repository.PharmacyInventoryItemRepository;
import com.telecareplus.service.PharmacistService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PharmacistServiceImpl implements PharmacistService {

    private final PharmacistRepository pharmacistRepository;
    private final PharmacyInventoryItemRepository inventoryRepository;
    private final DispenseRecordRepository dispenseRecordRepository;
    private final MedicationItemRepository medicationItemRepository;
    private final DeliveryTrackerService deliveryTrackerService;

    @Override
    public PharmacistDtos.DashboardResponse getDashboard(Long pharmacistId) {
        Pharmacist pharmacist = findPharmacist(pharmacistId);
        List<PharmacistDtos.InventoryResponse> inventory = getInventory(pharmacist.getId());
        long lowStockItems = inventory.stream().filter(PharmacistDtos.InventoryResponse::lowStock).count();
        return new PharmacistDtos.DashboardResponse(
                dispenseRecordRepository.countByPharmacistIdAndStatus(pharmacist.getId(), DispenseStatus.PENDING_VERIFICATION),
                lowStockItems,
                dispenseRecordRepository.countByPharmacistIdAndDispensedAtAfter(pharmacist.getId(), LocalDate.now().atStartOfDay()),
                inventory.size()
        );
    }

    @Override
    public List<PharmacistDtos.InventoryResponse> getInventory(Long pharmacistId) {
        findPharmacist(pharmacistId);
        return inventoryRepository.findByPharmacistIdOrderByMedicineNameAsc(pharmacistId).stream()
                .map(this::toInventoryResponse)
                .toList();
    }

    @Override
    public PharmacistDtos.InventoryResponse addInventoryItem(Long pharmacistId, PharmacistDtos.InventoryRequest request) {
        Pharmacist pharmacist = findPharmacist(pharmacistId);
        PharmacyInventoryItem item = new PharmacyInventoryItem();
        item.setPharmacist(pharmacist);
        item.setMedicineName(request.medicineName());
        item.setFormulation(request.formulation());
        item.setQuantityAvailable(request.quantityAvailable());
        item.setReorderLevel(request.reorderLevel());
        item.setUnitLabel(request.unitLabel());
        item.setExpiryDate(request.expiryDate());
        item.setBatchNumber(request.batchNumber());
        return toInventoryResponse(inventoryRepository.save(item));
    }

    @Override
    public List<PharmacistDtos.DispenseRecordResponse> getDispensingQueue(Long pharmacistId) {
        findPharmacist(pharmacistId);
        return dispenseRecordRepository.findByPharmacistIdOrderByCreatedAtDesc(pharmacistId).stream()
                .map(this::toDispenseResponse)
                .toList();
    }

    @Override
    public PharmacistDtos.DispenseRecordResponse updateDispenseRecord(Long dispenseRecordId, PharmacistDtos.DispenseActionRequest request) {
        DispenseRecord record = dispenseRecordRepository.findById(dispenseRecordId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispense record not found"));
        if (request.status() != null) {
            record.setStatus(request.status());
            if (request.status() == DispenseStatus.DISPENSED) {
                record.setDispensedAt(java.time.LocalDateTime.now());
            } else if (request.status() == DispenseStatus.OUT_FOR_DELIVERY) {
                deliveryTrackerService.startTrackingOrder(record.getPrescription().getId());
            }
        }
        if (request.verificationNotes() != null) {
            record.setVerificationNotes(request.verificationNotes());
        }
        return toDispenseResponse(dispenseRecordRepository.save(record));
    }

    private Pharmacist findPharmacist(Long pharmacistId) {
        return pharmacistRepository.findById(pharmacistId)
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacist not found"));
    }

    private PharmacistDtos.InventoryResponse toInventoryResponse(PharmacyInventoryItem item) {
        return new PharmacistDtos.InventoryResponse(
                item.getId(),
                item.getMedicineName(),
                item.getFormulation(),
                item.getQuantityAvailable(),
                item.getReorderLevel(),
                item.getUnitLabel(),
                item.getQuantityAvailable() <= item.getReorderLevel(),
                item.getExpiryDate(),
                item.getBatchNumber()
        );
    }

    private PharmacistDtos.DispenseRecordResponse toDispenseResponse(DispenseRecord record) {
        List<String> medicines = medicationItemRepository.findByPrescriptionId(record.getPrescription().getId()).stream()
                .map(item -> item.getMedicineName() + " - " + item.getDosage() + " - " + item.getFrequency())
                .toList();
        return new PharmacistDtos.DispenseRecordResponse(
                record.getId(),
                record.getPrescription().getId(),
                record.getPatient().getId(),
                record.getPatient().getUser().getFullName(),
                record.getPrescription().getDoctor().getUser().getFullName(),
                medicines,
                record.getPrescription().getFollowUpDate(),
                record.getStatus(),
                record.getVerificationNotes(),
                record.getPickupCode(),
                record.getDispensedAt(),
                record.getCreatedAt()
        );
    }
}
