package com.chaturang.controller;

import com.chaturang.dto.CreateRoomRequest;
import com.chaturang.dto.JoinRoomRequest;
import com.chaturang.dto.MatchmakingRequest;
import com.chaturang.dto.RoomResponse;
import com.chaturang.security.CustomUserDetails;
import com.chaturang.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping("/create")
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody(required = false) CreateRoomRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (request == null) {
            request = new CreateRoomRequest();
        }
        String username = (userDetails != null && userDetails.getUser() != null) ? userDetails.getUsername() : null;
        Integer rating = (userDetails != null && userDetails.getUser() != null) ? userDetails.getUser().getRating() : null;
        RoomResponse response = roomService.createRoom(request, username, rating);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @Valid @RequestBody JoinRoomRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String username = (userDetails != null && userDetails.getUser() != null) ? userDetails.getUsername() : null;
        Integer rating = (userDetails != null && userDetails.getUser() != null) ? userDetails.getUser().getRating() : null;
        RoomResponse response = roomService.joinRoom(request, username, rating);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{code}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable String code) {
        RoomResponse response = roomService.getRoom(code);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/matchmaking/find")
    public ResponseEntity<RoomResponse> findMatch(
            @Valid @RequestBody(required = false) MatchmakingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (request == null) {
            request = new MatchmakingRequest();
        }
        String username = (userDetails != null && userDetails.getUser() != null) ? userDetails.getUsername() : null;
        Integer rating = (userDetails != null && userDetails.getUser() != null) ? userDetails.getUser().getRating() : null;
        RoomResponse response = roomService.findMatch(request, username, rating);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/matchmaking/cancel")
    public ResponseEntity<Map<String, String>> cancelMatch(
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String playerName = null;
        if (userDetails != null && userDetails.getUser() != null) {
            playerName = userDetails.getUsername();
        } else if (body != null) {
            playerName = body.get("playerName");
        }
        if (playerName != null) {
            roomService.cancelMatch(playerName);
        }
        return ResponseEntity.ok(Map.of("message", "Matchmaking cancelled"));
    }
}
