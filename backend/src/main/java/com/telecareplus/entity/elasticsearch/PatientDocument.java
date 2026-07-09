package com.telecareplus.entity.elasticsearch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "patients")
public class PatientDocument {

    @Id
    private String id; // Use String for Elasticsearch ID, map from Patient.id

    @Field(type = FieldType.Text, name = "fullName")
    private String fullName;

    @Field(type = FieldType.Text, name = "bloodGroup")
    private String bloodGroup;

    @Field(type = FieldType.Text, name = "allergies")
    private String allergies;

    @Field(type = FieldType.Text, name = "diseases")
    private String diseases;

    @Field(type = FieldType.Text, name = "medicalHistorySummary")
    private String medicalHistorySummary;
}
