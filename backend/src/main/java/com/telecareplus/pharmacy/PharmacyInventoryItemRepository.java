package com.telecareplus.pharmacy;

import com.telecareplus.pharmacy.PharmacyInventoryItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PharmacyInventoryItemRepository extends JpaRepository<PharmacyInventoryItem, Long> {
    List<PharmacyInventoryItem> findByPharmacistIdOrderByMedicineNameAsc(Long pharmacistId);
}
