package com.telecareplus.controller;

import com.telecareplus.service.impl.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PATIENT')")
public class GamificationController {

    private final GamificationService gamificationService;

    @GetMapping("/leaderboard")
    public ResponseEntity<List<GamificationService.LeaderboardEntry>> getLeaderboard() {
        return ResponseEntity.ok(gamificationService.getTop10Leaderboard());
    }

    @GetMapping("/streak/{patientId}")
    public ResponseEntity<Map<String, Integer>> getStreak(@PathVariable Long patientId) {
        return ResponseEntity.ok(Map.of("streak", gamificationService.getStreak(patientId)));
    }
}
