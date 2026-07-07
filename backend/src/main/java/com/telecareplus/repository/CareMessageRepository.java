package com.telecareplus.repository;

import com.telecareplus.entity.CareMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CareMessageRepository extends JpaRepository<CareMessage, Long> {
    List<CareMessage> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<CareMessage> findBySenderUserIdOrRecipientUserIdOrderByCreatedAtDesc(Long senderUserId, Long recipientUserId);

    @Query("""
        select case when count(message) > 0 then true else false end
        from CareMessage message
        where message.id = :messageId
          and (message.senderUser.id = :userId or message.recipientUser.id = :userId)
    """)
    boolean existsByIdAndParticipantUserId(@Param("messageId") Long messageId, @Param("userId") Long userId);
}
