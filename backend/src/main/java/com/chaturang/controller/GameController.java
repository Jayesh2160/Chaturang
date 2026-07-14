package com.chaturang.controller;

import com.chaturang.dto.GameResponse;
import com.chaturang.dto.GameSaveRequest;
import com.chaturang.security.CustomUserDetails;
import com.chaturang.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping
    public ResponseEntity<GameResponse> saveGame(
            @Valid @RequestBody GameSaveRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        GameResponse response = gameService.saveGame(request, userDetails.getUser());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<GameResponse>> getGames(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<GameResponse> response = gameService.getGames(userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameResponse> getGame(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        GameResponse response = gameService.getGame(id, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGame(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        gameService.deleteGame(id, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }
}
