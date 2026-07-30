package com.telecareplus.appointments;

import com.telecareplus.appointments.Appointment;
import com.telecareplus.appointments.AppointmentStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    @EntityGraph(attributePaths = { "patient.user", "doctor.user" })
    List<Appointment> findByPatientIdOrderByAppointmentDateTimeDesc(Long patientId);

    @EntityGraph(attributePaths = { "patient.user", "doctor.user" })
    List<Appointment> findByDoctorIdOrderByAppointmentDateTimeDesc(Long doctorId);

    long countByPatientId(Long patientId);
    long countByPatientIdAndStatusIn(Long patientId, List<AppointmentStatus> statuses);
    boolean existsByDoctorIdAndAppointmentDateTime(Long doctorId, LocalDateTime appointmentDateTime);
    boolean existsByIdAndPatientIdAndDoctorId(Long appointmentId, Long patientId, Long doctorId);

    @Query("""
        select case when count(appointment) > 0 then true else false end
        from Appointment appointment
        where appointment.patient.id = :patientId
          and appointment.doctor.user.id = :userId
    """)
    boolean existsByPatientIdAndDoctorUserId(@Param("patientId") Long patientId, @Param("userId") Long userId);

    @EntityGraph(attributePaths = { "patient.user", "doctor.user" })
    @Query("select appointment from Appointment appointment where appointment.id = :appointmentId")
    Optional<Appointment> findWithDetailsById(@Param("appointmentId") Long appointmentId);

    @Query("""
        select case when count(appointment) > 0 then true else false end
        from Appointment appointment
        where appointment.id = :appointmentId
          and appointment.doctor.user.id = :userId
    """)
    boolean existsByIdAndDoctorUserId(@Param("appointmentId") Long appointmentId, @Param("userId") Long userId);

    @Query("""
        select case when count(appointment) > 0 then true else false end
        from Appointment appointment
        where appointment.id = :appointmentId
          and appointment.patient.user.id = :userId
    """)
    boolean existsByIdAndPatientUserId(@Param("appointmentId") Long appointmentId, @Param("userId") Long userId);
}
