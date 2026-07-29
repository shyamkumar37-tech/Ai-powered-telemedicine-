package com.telecareplus.users;

import com.telecareplus.users.Pharmacist;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PharmacistRepository extends JpaRepository<Pharmacist, Long> {
    Optional<Pharmacist> findByUserId(Long userId);

    @Query("""
        select case when count(pharmacist) > 0 then true else false end
        from Pharmacist pharmacist
        where pharmacist.id = :pharmacistId
          and pharmacist.user.id = :userId
    """)
    boolean existsByIdAndUserId(@Param("pharmacistId") Long pharmacistId, @Param("userId") Long userId);
}
