package com.telecareplus.clinical;

import com.telecareplus.clinical.ConsultationNote;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConsultationNoteRepository extends JpaRepository<ConsultationNote, Long> {
    List<ConsultationNote> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    long countByPatientIdAndFollowUpDateGreaterThanEqual(Long patientId, LocalDate followUpDate);
    Optional<ConsultationNote> findByAppointmentId(Long appointmentId);

    @Query("""
        select case when count(note) > 0 then true else false end
        from ConsultationNote note
        where note.id = :consultationNoteId
          and note.appointment.doctor.user.id = :userId
    """)
    boolean existsByIdAndDoctorUserId(@Param("consultationNoteId") Long consultationNoteId, @Param("userId") Long userId);

    @Query("""
        select case when count(note) > 0 then true else false end
        from ConsultationNote note
        where note.appointment.id = :appointmentId
          and note.appointment.doctor.user.id = :userId
    """)
    boolean existsByAppointmentIdAndDoctorUserId(@Param("appointmentId") Long appointmentId, @Param("userId") Long userId);
}
