package com.telecareplus.ai.entity;

import com.telecareplus.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class MoodJournalEntry extends BaseEntity {

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private int moodScore;

    @Column(length = 2000)
    private String notes;
}
