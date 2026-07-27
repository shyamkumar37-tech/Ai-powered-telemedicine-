package com.telecareplus.repository;

import com.telecareplus.entity.MedicationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicationScheduleRepository extends JpaRepository<MedicationSchedule, Long> {}
