package com.chaturang.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "games")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "player_color", nullable = false, length = 10)
    private String playerColor; // "WHITE" or "BLACK"

    @Column(name = "opponent_name", nullable = false, length = 100)
    private String opponentName; // e.g. "Computer" or "Self"

    @Column(nullable = false, length = 20)
    private String result; // e.g. "WHITE_WIN", "BLACK_WIN", "DRAW", "RESIGNED"

    @Column(name = "move_count", nullable = false)
    private Integer moveCount;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String pgn;

    @Column(columnDefinition = "TEXT")
    private String fen; // Final FEN position of the board

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
