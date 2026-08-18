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

    @org.springframework.data.jpa.repository.Query("SELECT ga FROM GameAnalysis ga WHERE ga.game.user = :user ORDER BY ga.createdAt DESC")
    java.util.List<GameAnalysis> findRecentByUser(
        @org.springframework.data.repository.query.Param("user") com.chaturang.entity.User user, 
        org.springframework.data.domain.Pageable pageable
    );
}
