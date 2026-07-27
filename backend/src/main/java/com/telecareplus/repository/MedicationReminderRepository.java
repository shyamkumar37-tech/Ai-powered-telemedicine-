package com.telecareplus.repository;

import com.telecareplus.entity.MedicationReminder;
import com.telecareplus.entity.enums.ReminderStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MedicationReminderRepository extends JpaRepository<MedicationReminder, Long> {
    List<MedicationReminder> findByPatientIdOrderByScheduledDateDesc(Long patientId);
    long countByPatientIdAndStatus(Long patientId, ReminderStatus status);
    List<MedicationReminder> findByStatusAndScheduledDateBefore(ReminderStatus status, LocalDate date);

    @Query("""
        select
            coalesce(sum(case
                when reminder.status = com.telecareplus.entity.enums.ReminderStatus.TAKEN then 1
                else 0
            end), 0) as taken,
            coalesce(sum(case
                when reminder.status = com.telecareplus.entity.enums.ReminderStatus.MISSED
                  or (
                      reminder.status = com.telecareplus.entity.enums.ReminderStatus.PENDING
                      and reminder.scheduledDate < :today
                  )
                then 1
                else 0
            end), 0) as missed
        from MedicationReminder reminder
        where reminder.patient.id = :patientId
    """)
    AdherenceCounts summarizeAdherence(Long patientId, LocalDate today);

    @Query("""
        select count(reminder)
        from MedicationReminder reminder
        where reminder.patient.id = :patientId
          and reminder.status = com.telecareplus.entity.enums.ReminderStatus.PENDING
          and (reminder.scheduledDate is null or reminder.scheduledDate >= :today)
    """)
    long countEffectivePendingByPatientId(Long patientId, LocalDate today);

    @Query("""
        select case when count(reminder) > 0 then true else false end
        from MedicationReminder reminder
        where reminder.id = :reminderId
          and reminder.patient.user.id = :userId
    """)
    boolean existsByIdAndPatientUserId(@Param("reminderId") Long reminderId, @Param("userId") Long userId);

    interface AdherenceCounts {
        long getTaken();
        long getMissed();
    }
}
