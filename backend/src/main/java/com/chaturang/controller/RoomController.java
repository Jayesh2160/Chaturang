package com.chaturang.controller;

import com.chaturang.dto.CreateRoomRequest;
import com.chaturang.dto.JoinRoomRequest;
import com.chaturang.dto.MatchmakingRequest;
import com.chaturang.dto.RoomEvent;
import com.chaturang.dto.RoomResponse;
import com.chaturang.dto.SendEventRequest;
import com.chaturang.security.CustomUserDetails;
import com.chaturang.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @PostMapping("/{code}/events")
    public ResponseEntity<RoomEvent> sendEvent(
            @PathVariable String code,
            @Valid @RequestBody SendEventRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails != null && userDetails.getUser() != null && request.getSenderName() == null) {
            request.setSenderName(userDetails.getUsername());
        }
        RoomEvent event = roomService.sendEvent(code, request);
        return ResponseEntity.ok(event);
    }

    @GetMapping("/{code}/events")
    public ResponseEntity<List<RoomEvent>> getEvents(
            @PathVariable String code,
            @RequestParam(required = false, defaultValue = "0") Long since) {
        List<RoomEvent> events = roomService.getEvents(code, since);
        return ResponseEntity.ok(events);
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
