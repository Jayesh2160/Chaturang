package com.chaturang.service;

import com.chaturang.dto.EvaluationResponse;
import com.chaturang.entity.EngineDifficulty;

public interface StockfishService {
    String getBestMove(String fen, EngineDifficulty difficulty);
    EvaluationResponse evaluate(String fen);
}
