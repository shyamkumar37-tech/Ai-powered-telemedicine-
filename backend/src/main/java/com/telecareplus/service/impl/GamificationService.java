package com.telecareplus.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class GamificationService {

    private final StringRedisTemplate redisTemplate;
    private static final String LEADERBOARD_KEY = "telecare:gamification:leaderboard";
    private static final String STREAK_PREFIX = "telecare:gamification:streak:";

    public void awardPoints(Long patientId, int points) {
        String member = "Patient #" + patientId;
        redisTemplate.opsForZSet().incrementScore(LEADERBOARD_KEY, member, points);
        log.info("Awarded {} points to patient {}", points, patientId);
    }

    public void incrementStreak(Long patientId) {
        String key = STREAK_PREFIX + patientId;
        redisTemplate.opsForValue().increment(key);
    }

    public int getStreak(Long patientId) {
        String val = redisTemplate.opsForValue().get(STREAK_PREFIX + patientId);
        return val != null ? Integer.parseInt(val) : 0;
    }

    public List<LeaderboardEntry> getTop10Leaderboard() {
        Set<org.springframework.data.redis.core.ZSetOperations.TypedTuple<String>> tops = 
            redisTemplate.opsForZSet().reverseRangeWithScores(LEADERBOARD_KEY, 0, 9);
        
        List<LeaderboardEntry> leaderboard = new ArrayList<>();
        if (tops != null) {
            int rank = 1;
            for (var t : tops) {
                leaderboard.add(new LeaderboardEntry(rank++, t.getValue(), t.getScore().intValue()));
            }
        }
        return leaderboard;
    }

    public record LeaderboardEntry(int rank, String alias, int points) {}
}
