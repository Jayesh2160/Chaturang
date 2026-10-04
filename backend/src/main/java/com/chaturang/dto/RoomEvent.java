package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomEvent {
    private Long id;
    private String roomCode;
    private String type; // ROOM_JOIN, ROOM_JOIN_ACK, MOVE, RESIGN, DRAW_OFFER, DRAW_ACCEPT, DRAW_DECLINE, CHAT, REMATCH_OFFER, REMATCH_ACCEPT
    private String senderId;
    private String senderName;
    private Object payload;
    private Long timestamp;
}
