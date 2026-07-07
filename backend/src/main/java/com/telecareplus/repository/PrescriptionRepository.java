package com.telecareplus.repository;

import com.telecareplus.entity.Prescription;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    long countByPatientId(Long patientId);

    boolean existsByConsultationNoteId(Long consultationNoteId);

    @Query("""
        select prescription.id
        from Prescription prescription
        where prescription.patient.id = :patientId
        order by prescription.createdAt desc
    """)
    Page<Long> findPageIdsByPatientId(@Param("patientId") Long patientId, Pageable pageable);

    @Query("""
        select distinct prescription
        from Prescription prescription
        left join fetch prescription.medicationItems medicationItem
        join fetch prescription.patient patient
        join fetch patient.user patientUser
        join fetch prescription.doctor doctor
        join fetch doctor.user doctorUser
        where prescription.id in :prescriptionIds
        order by prescription.createdAt desc
    """)
    List<Prescription> findAllWithItemsByIdIn(@Param("prescriptionIds") List<Long> prescriptionIds);

    @Query("""
        select distinct prescription
        from Prescription prescription
        left join fetch prescription.medicationItems medicationItem
        join fetch prescription.patient patient
        join fetch patient.user patientUser
        join fetch prescription.doctor doctor
        join fetch doctor.user doctorUser
        where prescription.consultationNote.id = :consultationNoteId
    """)
    Optional<Prescription> findByConsultationNoteId(@Param("consultationNoteId") Long consultationNoteId);

    @Query("""
        select distinct prescription
        from Prescription prescription
        left join fetch prescription.medicationItems medicationItem
        join fetch prescription.patient patient
        join fetch patient.user patientUser
        join fetch prescription.doctor doctor
        join fetch doctor.user doctorUser
        where prescription.id = :prescriptionId
    """)
    Optional<Prescription> findWithItemsById(@Param("prescriptionId") Long prescriptionId);

    @Query("""
        select case when count(prescription) > 0 then true else false end
        from Prescription prescription
        where prescription.id = :prescriptionId
          and (
              prescription.consultationNote.appointment.patient.user.id = :userId
              or prescription.consultationNote.appointment.doctor.user.id = :userId
          )
    """)
    boolean existsByIdAndPatientOrDoctorUserId(@Param("prescriptionId") Long prescriptionId, @Param("userId") Long userId);

    @Query("""
        select case when count(prescription) > 0 then true else false end
        from Prescription prescription
        where prescription.consultationNote.id = :consultationNoteId
          and prescription.consultationNote.appointment.doctor.user.id = :userId
    """)
    boolean existsByConsultationNoteIdAndDoctorUserId(@Param("consultationNoteId") Long consultationNoteId, @Param("userId") Long userId);
}
