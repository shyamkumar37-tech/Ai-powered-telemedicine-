package com.telecareplus.users;

import com.telecareplus.users.Patient;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUserId(Long userId);

    @Query("""
        select case when count(patient) > 0 then true else false end
        from Patient patient
        where patient.id = :patientId
          and patient.user.id = :userId
    """)
    boolean existsByIdAndUserId(@Param("patientId") Long patientId, @Param("userId") Long userId);
}
