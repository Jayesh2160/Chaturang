package com.chaturang.service;

import com.chaturang.dto.GameAnalysisRequest;
import com.chaturang.dto.GameAnalysisResponse;
import com.chaturang.entity.User;

public interface GameAnalysisService {
    GameAnalysisResponse analyzeGame(Long gameId, GameAnalysisRequest request, User user);
    GameAnalysisResponse getGameAnalysis(Long gameId, User user);
    com.chaturang.dto.WeaknessProfileResponse getWeaknessProfile(User user);
}
