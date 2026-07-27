package com.telecareplus.repository;

import com.telecareplus.entity.AdministrationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdministrationRecordRepository extends JpaRepository<AdministrationRecord, Long> {}
