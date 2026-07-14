package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameResponse {
    private Long id;
    private String playerColor;
    private String opponentName;
    private String result;
    private Integer moveCount;
    private String pgn;
    private String fen;
    private LocalDateTime createdAt;
}
