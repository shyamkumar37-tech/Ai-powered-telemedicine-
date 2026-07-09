package com.telecareplus.repository.elasticsearch;

import com.telecareplus.entity.elasticsearch.PatientDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientSearchRepository extends ElasticsearchRepository<PatientDocument, String> {
    List<PatientDocument> findByFullNameContainingOrMedicalHistorySummaryContaining(String name, String history);
}
