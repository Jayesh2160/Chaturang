package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameAnalysisResponse {
    private Long id;
    private Long gameId;
    private Double accuracy; // Game Accuracy
    private Integer blunderCount;
    private Integer mistakeCount;
    private Integer inaccuracyCount;
    private Integer bestMoveCount;
    private Integer excellentMoveCount;
    private Integer goodMoveCount;
    private String summary;
    private List<MoveAnalysisDto> moveAnalyses;
    private LocalDateTime createdAt;
}
