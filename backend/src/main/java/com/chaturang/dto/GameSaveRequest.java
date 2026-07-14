package com.chaturang.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameSaveRequest {

    @NotBlank(message = "Player color is required")
    private String playerColor;

    @NotBlank(message = "Opponent name is required")
    private String opponentName;

    @NotBlank(message = "Result is required")
    private String result;

    @NotNull(message = "Move count is required")
    private Integer moveCount;

    @NotBlank(message = "PGN is required")
    private String pgn;

    private String fen;
}
