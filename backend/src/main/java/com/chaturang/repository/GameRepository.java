package com.chaturang.repository;

import com.chaturang.entity.Game;
import com.chaturang.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findAllByUserOrderByCreatedAtDesc(User user);
    Optional<Game> findByIdAndUser(Long id, User user);
}
