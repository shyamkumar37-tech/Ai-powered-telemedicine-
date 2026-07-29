package com.telecareplus.communication;

import com.telecareplus.communication.Conversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c WHERE c.user1.id = :userId OR c.user2.id = :userId ORDER BY c.lastMessageAt DESC")
    List<Conversation> findByUserIdOrderByLastMessageAtDesc(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c WHERE (c.user1.id = :userId1 AND c.user2.id = :userId2) OR (c.user1.id = :userId2 AND c.user2.id = :userId1)")
    Optional<Conversation> findByUser1IdAndUser2Id(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
