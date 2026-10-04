package com.chaturang.service;

import com.chaturang.dto.CreateRoomRequest;
import com.chaturang.dto.JoinRoomRequest;
import com.chaturang.dto.MatchmakingRequest;
import com.chaturang.dto.RoomResponse;

public interface RoomService {
    RoomResponse createRoom(CreateRoomRequest request, String username, Integer rating);
    RoomResponse joinRoom(JoinRoomRequest request, String username, Integer rating);
    RoomResponse getRoom(String roomCode);
    RoomResponse findMatch(MatchmakingRequest request, String username, Integer rating);
    void cancelMatch(String playerName);
}
