package com.telecareplus.service;

import com.telecareplus.dto.PharmacistDtos;
import java.util.List;

public interface PharmacistService {
    PharmacistDtos.DashboardResponse getDashboard(Long pharmacistId);
    List<PharmacistDtos.InventoryResponse> getInventory(Long pharmacistId);
    PharmacistDtos.InventoryResponse addInventoryItem(Long pharmacistId, PharmacistDtos.InventoryRequest request);
    List<PharmacistDtos.DispenseRecordResponse> getDispensingQueue(Long pharmacistId);
    PharmacistDtos.DispenseRecordResponse updateDispenseRecord(Long dispenseRecordId, PharmacistDtos.DispenseActionRequest request);
}
