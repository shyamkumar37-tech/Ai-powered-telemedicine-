package com.telecareplus.users;

import com.telecareplus.users.Doctor;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);

    @Query("""
        select case when count(doctor) > 0 then true else false end
        from Doctor doctor
        where doctor.id = :doctorId
          and doctor.user.id = :userId
    """)
    boolean existsByIdAndUserId(@Param("doctorId") Long doctorId, @Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Doctor d where d.id = :doctorId")
    Optional<Doctor> findByIdForUpdate(@Param("doctorId") Long doctorId);
}
