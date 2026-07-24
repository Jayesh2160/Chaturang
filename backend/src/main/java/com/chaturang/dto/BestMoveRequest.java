package com.chaturang.dto;

import com.chaturang.entity.EngineDifficulty;
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
public class BestMoveRequest {
    @NotBlank(message = "FEN is required")
    private String fen;
    
    @NotNull(message = "Difficulty is required")
    private EngineDifficulty difficulty;
}
