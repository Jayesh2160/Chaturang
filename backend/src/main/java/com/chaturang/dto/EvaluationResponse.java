package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationResponse {
    private String evaluation;
    private String principalVariation;
    private String bestMove;
}
