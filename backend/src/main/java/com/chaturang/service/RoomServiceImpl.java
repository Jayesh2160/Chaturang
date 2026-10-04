package com.chaturang.service;

import com.chaturang.dto.CreateRoomRequest;
import com.chaturang.dto.JoinRoomRequest;
import com.chaturang.dto.MatchmakingRequest;
import com.chaturang.dto.RoomResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Slf4j
@Service
public class RoomServiceImpl implements RoomService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 6;
    private static final long ROOM_EXPIRATION_MS = 2 * 60 * 60 * 1000L; // 2 hours
    private static final SecureRandom RANDOM = new SecureRandom();

    // In-memory thread-safe room registry: roomCode -> RoomResponse
    private final Map<String, RoomResponse> roomRegistry = new ConcurrentHashMap<>();

    // Matchmaking waiting queues by timeControl (e.g. "rapid", "blitz", "bullet")
    private final Map<String, Queue<WaitingPlayer>> matchmakingQueues = new ConcurrentHashMap<>();

    private static class WaitingPlayer {
        final String playerName;
        final Integer rating;
        final String roomCode;
        final long queuedAt;

        WaitingPlayer(String playerName, Integer rating, String roomCode) {
            this.playerName = playerName;
            this.rating = rating;
            this.roomCode = roomCode;
            this.queuedAt = System.currentTimeMillis();
        }
    }

    @Override
    public RoomResponse createRoom(CreateRoomRequest request, String username, Integer rating) {
        cleanExpiredRooms();

        String code = generateUniqueRoomCode();
        String hostName = resolvePlayerName(request.getPlayerName(), username);
        Integer hostRating = resolvePlayerRating(request.getRating(), rating);

        String preferredColor = request.getPreferredColor() != null ? request.getPreferredColor().toLowerCase() : "random";
        String hostColor;
        if ("white".equals(preferredColor)) {
            hostColor = "w";
        } else if ("black".equals(preferredColor)) {
            hostColor = "b";
        } else {
            hostColor = RANDOM.nextBoolean() ? "w" : "b";
        }

        RoomResponse room = RoomResponse.builder()
                .roomCode(code)
                .status("WAITING")
                .timeControl(request.getTimeControl() != null ? request.getTimeControl() : "rapid")
                .minutes(request.getMinutes() != null ? request.getMinutes() : 10)
                .hostName(hostName)
                .hostRating(hostRating)
                .hostColor(hostColor)
                .guestName(null)
                .guestRating(null)
                .guestColor("w".equals(hostColor) ? "b" : "w")
                .createdAt(System.currentTimeMillis())
                .build();

        roomRegistry.put(code, room);
        log.info("Created online room: code={}, host={}, timeControl={}", code, hostName, room.getTimeControl());
        return room;
    }

    @Override
    public RoomResponse joinRoom(JoinRoomRequest request, String username, Integer rating) {
        cleanExpiredRooms();

        if (request.getRoomCode() == null || request.getRoomCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Room code cannot be empty");
        }

        String cleanCode = request.getRoomCode().trim().toUpperCase();
        RoomResponse existing = roomRegistry.get(cleanCode);

        if (existing == null) {
            throw new IllegalArgumentException("Room code '" + cleanCode + "' not found or has expired.");
        }

        if ("READY".equals(existing.getStatus()) || "IN_PROGRESS".equals(existing.getStatus())) {
            // If the same player is reconnecting
            String currentGuest = existing.getGuestName();
            String playerName = resolvePlayerName(request.getPlayerName(), username);
            if (playerName.equalsIgnoreCase(currentGuest) || playerName.equalsIgnoreCase(existing.getHostName())) {
                return existing;
            }
            throw new IllegalArgumentException("Room '" + cleanCode + "' is already full.");
        }

        String guestName = resolvePlayerName(request.getPlayerName(), username);
        Integer guestRating = resolvePlayerRating(request.getRating(), rating);

        existing.setGuestName(guestName);
        existing.setGuestRating(guestRating);
        existing.setStatus("READY");

        log.info("Player {} joined room: code={}, host={}", guestName, cleanCode, existing.getHostName());
        return existing;
    }

    @Override
    public RoomResponse getRoom(String roomCode) {
        if (roomCode == null || roomCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Room code cannot be empty");
        }
        String cleanCode = roomCode.trim().toUpperCase();
        RoomResponse room = roomRegistry.get(cleanCode);
        if (room == null) {
            throw new IllegalArgumentException("Room code '" + cleanCode + "' not found or has expired.");
        }
        return room;
    }

    @Override
    public RoomResponse findMatch(MatchmakingRequest request, String username, Integer rating) {
        cleanExpiredRooms();

        String tc = request.getTimeControl() != null ? request.getTimeControl().toLowerCase() : "rapid";
        String playerName = resolvePlayerName(request.getPlayerName(), username);
        Integer playerRating = resolvePlayerRating(request.getRating(), rating);

        Queue<WaitingPlayer> queue = matchmakingQueues.computeIfAbsent(tc, k -> new ConcurrentLinkedQueue<>());

        // Check if there is already a waiting opponent in the queue
        WaitingPlayer opponent = queue.poll();
        while (opponent != null && (opponent.playerName.equalsIgnoreCase(playerName) || !roomRegistry.containsKey(opponent.roomCode))) {
            // Discard self or expired room entries
            opponent = queue.poll();
        }

        if (opponent != null) {
            // Pair with waiting opponent
            RoomResponse pairedRoom = roomRegistry.get(opponent.roomCode);
            if (pairedRoom != null && "WAITING".equals(pairedRoom.getStatus())) {
                pairedRoom.setGuestName(playerName);
                pairedRoom.setGuestRating(playerRating);
                pairedRoom.setStatus("READY");
                log.info("Matchmaking paired: room={}, host={}, guest={}", pairedRoom.getRoomCode(), pairedRoom.getHostName(), playerName);
                return pairedRoom;
            }
        }

        // No opponent ready: create a new waiting room and add to matchmaking queue
        CreateRoomRequest createReq = CreateRoomRequest.builder()
                .timeControl(tc)
                .minutes("bullet".equals(tc) ? 1 : "blitz".equals(tc) ? 3 : 10)
                .preferredColor("random")
                .playerName(playerName)
                .rating(playerRating)
                .build();

        RoomResponse newRoom = createRoom(createReq, username, rating);
        queue.add(new WaitingPlayer(playerName, playerRating, newRoom.getRoomCode()));
        log.info("Player {} queued for matchmaking: tc={}, room={}", playerName, tc, newRoom.getRoomCode());
        return newRoom;
    }

    @Override
    public void cancelMatch(String playerName) {
        if (playerName == null) return;
        for (Queue<WaitingPlayer> queue : matchmakingQueues.values()) {
            queue.removeIf(w -> w.playerName.equalsIgnoreCase(playerName));
        }
        log.info("Cancelled matchmaking for player: {}", playerName);
    }

    private String generateUniqueRoomCode() {
        for (int i = 0; i < 20; i++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int j = 0; j < CODE_LENGTH; j++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (!roomRegistry.containsKey(code)) {
                return code;
            }
        }
        return "R" + System.currentTimeMillis() % 100000;
    }

    private String resolvePlayerName(String inputName, String authUsername) {
        if (authUsername != null && !authUsername.trim().isEmpty()) {
            return authUsername.trim();
        }
        if (inputName != null && !inputName.trim().isEmpty()) {
            return inputName.trim();
        }
        return "Player-" + (1000 + RANDOM.nextInt(9000));
    }

    private Integer resolvePlayerRating(Integer inputRating, Integer authRating) {
        if (authRating != null && authRating > 0) {
            return authRating;
        }
        if (inputRating != null && inputRating > 0) {
            return inputRating;
        }
        return 1200;
    }

    private void cleanExpiredRooms() {
        long now = System.currentTimeMillis();
        roomRegistry.entrySet().removeIf(entry -> (now - entry.getValue().getCreatedAt()) > ROOM_EXPIRATION_MS);
    }
}
