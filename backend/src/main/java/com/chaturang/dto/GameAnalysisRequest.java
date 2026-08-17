package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameAnalysisRequest {
    @NotEmpty(message = "FEN list cannot be empty")
    private List<String> fens;

    @NotNull(message = "Moves list cannot be null")
    private List<MoveRequest> moves;
}
