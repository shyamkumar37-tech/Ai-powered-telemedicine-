package com.telecareplus.clinical;

import com.telecareplus.clinical.AdministrationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdministrationRecordRepository extends JpaRepository<AdministrationRecord, Long> {}
