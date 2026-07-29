package com.telecareplus.api;

import com.telecareplus.pharmacy.PharmacistDtos;
import com.telecareplus.pharmacy.PharmacistService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pharmacists")
@RequiredArgsConstructor
public class PharmacistController {

    private final PharmacistService pharmacistService;

    @GetMapping("/{pharmacistId}/dashboard")
    @PreAuthorize("hasRole('PHARMACIST') and @accessScopeAuthorizer.canAccessPharmacist(authentication, #pharmacistId)")
    public PharmacistDtos.DashboardResponse dashboard(@PathVariable Long pharmacistId) {
        return pharmacistService.getDashboard(pharmacistId);
    }

    @GetMapping("/{pharmacistId}/inventory")
    @PreAuthorize("hasRole('PHARMACIST') and @accessScopeAuthorizer.canAccessPharmacist(authentication, #pharmacistId)")
    public List<PharmacistDtos.InventoryResponse> inventory(@PathVariable Long pharmacistId) {
        return pharmacistService.getInventory(pharmacistId);
    }

    @PostMapping("/{pharmacistId}/inventory")
    @PreAuthorize("hasRole('PHARMACIST') and @accessScopeAuthorizer.canAccessPharmacist(authentication, #pharmacistId)")
    public PharmacistDtos.InventoryResponse addInventory(@PathVariable Long pharmacistId, @Valid @RequestBody PharmacistDtos.InventoryRequest request) {
        return pharmacistService.addInventoryItem(pharmacistId, request);
    }

    @GetMapping("/{pharmacistId}/dispensing")
    @PreAuthorize("hasRole('PHARMACIST') and @accessScopeAuthorizer.canAccessPharmacist(authentication, #pharmacistId)")
    public List<PharmacistDtos.DispenseRecordResponse> dispensing(@PathVariable Long pharmacistId) {
        return pharmacistService.getDispensingQueue(pharmacistId);
    }

    @PatchMapping("/dispensing/{dispenseRecordId}")
    @PreAuthorize("hasRole('PHARMACIST') and @accessScopeAuthorizer.canAccessDispenseRecord(authentication, #dispenseRecordId)")
    public PharmacistDtos.DispenseRecordResponse updateDispensing(@PathVariable Long dispenseRecordId, @RequestBody PharmacistDtos.DispenseActionRequest request) {
        return pharmacistService.updateDispenseRecord(dispenseRecordId, request);
    }
}
