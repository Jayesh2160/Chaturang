package com.chaturang.service;

import com.chaturang.dto.GameResponse;
import com.chaturang.dto.GameSaveRequest;
import com.chaturang.entity.Game;
import com.chaturang.entity.User;
import com.chaturang.exception.ResourceNotFoundException;
import com.chaturang.repository.GameRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GameServiceImpl implements GameService {

    private final GameRepository gameRepository;

    public GameServiceImpl(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Override
    @Transactional
    public GameResponse saveGame(GameSaveRequest request, User user) {
        Game game = Game.builder()
                .user(user)
                .playerColor(request.getPlayerColor())
                .opponentName(request.getOpponentName())
                .result(request.getResult())
                .moveCount(request.getMoveCount())
                .pgn(request.getPgn())
                .fen(request.getFen())
                .build();

        Game savedGame = gameRepository.save(game);
        return convertToResponse(savedGame);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GameResponse> getGames(User user) {
        return gameRepository.findAllByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GameResponse getGame(Long id, User user) {
        Game game = gameRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id " + id));
        return convertToResponse(game);
    }

    @Override
    @Transactional
    public void deleteGame(Long id, User user) {
        Game game = gameRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id " + id));
        gameRepository.delete(game);
    }

    private GameResponse convertToResponse(Game game) {
        return GameResponse.builder()
                .id(game.getId())
                .playerColor(game.getPlayerColor())
                .opponentName(game.getOpponentName())
                .result(game.getResult())
                .moveCount(game.getMoveCount())
                .pgn(game.getPgn())
                .fen(game.getFen())
                .createdAt(game.getCreatedAt())
                .build();
    }
}
