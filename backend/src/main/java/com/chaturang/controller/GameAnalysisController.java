package com.chaturang.controller;

import com.chaturang.dto.GameAnalysisRequest;
import com.chaturang.dto.GameAnalysisResponse;
import com.chaturang.security.CustomUserDetails;
import com.chaturang.service.GameAnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games")
public class GameAnalysisController {

    private final GameAnalysisService gameAnalysisService;

    public GameAnalysisController(GameAnalysisService gameAnalysisService) {
        this.gameAnalysisService = gameAnalysisService;
    }

    @PostMapping("/{id}/analysis")
    public ResponseEntity<GameAnalysisResponse> analyzeGame(
            @PathVariable Long id,
            @Valid @RequestBody GameAnalysisRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        GameAnalysisResponse response = gameAnalysisService.analyzeGame(id, request, userDetails.getUser());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}/analysis")
    public ResponseEntity<GameAnalysisResponse> getGameAnalysis(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        GameAnalysisResponse response = gameAnalysisService.getGameAnalysis(id, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/weakness-profile")
    public ResponseEntity<com.chaturang.dto.WeaknessProfileResponse> getWeaknessProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        com.chaturang.dto.WeaknessProfileResponse response = gameAnalysisService.getWeaknessProfile(userDetails.getUser());
        return ResponseEntity.ok(response);
    }
}
