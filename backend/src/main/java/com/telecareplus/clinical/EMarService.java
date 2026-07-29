package com.telecareplus.clinical;

import org.springframework.stereotype.Service;
import com.telecareplus.clinical.MedicationSchedule;
import com.telecareplus.clinical.AdministrationRecord;
import java.util.List;
import java.util.Collections;

@Service
public class EMarService {
    public MedicationSchedule createSchedule(MedicationSchedule schedule) { return schedule; }
    public List<MedicationSchedule> getPatientSchedules(Long patientId) { return Collections.emptyList(); }
    public AdministrationRecord recordAdministration(AdministrationRecord record) { return record; }
    public List<AdministrationRecord> getRecordsForSchedule(Long scheduleId) { return Collections.emptyList(); }
}
