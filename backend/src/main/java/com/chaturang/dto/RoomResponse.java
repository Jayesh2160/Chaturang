package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private String roomCode;
    private String status;
    private String timeControl;
    private Integer minutes;
    private String hostName;
    private Integer hostRating;
    private String hostColor;
    private String guestName;
    private Integer guestRating;
    private String guestColor;
    private Long createdAt;
}
