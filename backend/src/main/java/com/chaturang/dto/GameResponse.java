package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import com.chaturang.entity.EngineDifficulty;
import com.chaturang.entity.GameMode;


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
    private GameMode gameMode;
    private EngineDifficulty difficulty;
    private LocalDateTime createdAt;
}
