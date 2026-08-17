package com.chaturang.repository;

import com.chaturang.entity.Game;
import com.chaturang.entity.GameAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameAnalysisRepository extends JpaRepository<GameAnalysis, Long> {
    Optional<GameAnalysis> findByGame(Game game);
    Optional<GameAnalysis> findByGameId(Long gameId);
}
