package com.chaturang.service;

import com.chaturang.dto.GameResponse;
import com.chaturang.dto.GameSaveRequest;
import com.chaturang.entity.User;

import java.util.List;

public interface GameService {
    GameResponse saveGame(GameSaveRequest request, User user);
    List<GameResponse> getGames(User user);
    GameResponse getGame(Long id, User user);
    void deleteGame(Long id, User user);
}
