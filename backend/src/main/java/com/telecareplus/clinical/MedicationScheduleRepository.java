package com.telecareplus.clinical;

import com.telecareplus.clinical.MedicationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicationScheduleRepository extends JpaRepository<MedicationSchedule, Long> {}
