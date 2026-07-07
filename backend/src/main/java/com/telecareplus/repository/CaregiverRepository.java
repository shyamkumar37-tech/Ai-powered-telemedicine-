package com.telecareplus.repository;

import com.telecareplus.entity.Caregiver;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CaregiverRepository extends JpaRepository<Caregiver, Long> {
    Optional<Caregiver> findByUserId(Long userId);

    @Query("""
        select case when count(caregiver) > 0 then true else false end
        from Caregiver caregiver
        where caregiver.id = :caregiverId
          and caregiver.user.id = :userId
    """)
    boolean existsByIdAndUserId(@Param("caregiverId") Long caregiverId, @Param("userId") Long userId);
}
