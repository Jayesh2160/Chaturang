package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoveAnalysisDto {
    private Integer moveIndex; // 0-indexed ply index
    private String san; // e.g. "e4"
    private String uci; // e.g. "e2e4"
    private String color; // "w" or "b"
    private String evaluation; // e.g. "+0.35" or "+Mate in 3" after this move
    private String bestMove; // Stockfish's best move in UCI format from the position before this move
    private String classification; // "BEST", "EXCELLENT", "GOOD", "INACCURACY", "MISTAKE", "BLUNDER"
    private String comment; // e.g. "Best move in this position." or "Blunder: missed Qxd5"
    private String weaknessPattern; // e.g. "FORK", "PIN", "SKEWER", "HANGING_PIECE", "BACK_RANK", "KING_SAFETY", "OPENING", "ENDGAME"
}
