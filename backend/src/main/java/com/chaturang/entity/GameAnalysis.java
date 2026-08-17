package com.chaturang.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_analyses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false, unique = true)
    private Game game;

    @Column(nullable = false)
    private Double accuracy; // Game Accuracy

    @Column(name = "blunder_count", nullable = false)
    private Integer blunderCount;

    @Column(name = "mistake_count", nullable = false)
    private Integer mistakeCount;

    @Column(name = "inaccuracy_count", nullable = false)
    private Integer inaccuracyCount;

    @Column(name = "best_move_count", nullable = false)
    private Integer bestMoveCount;

    @Column(name = "excellent_move_count", nullable = false)
    private Integer excellentMoveCount;

    @Column(name = "good_move_count", nullable = false)
    private Integer goodMoveCount;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "move_analyses", nullable = false, columnDefinition = "TEXT")
    private String moveAnalyses; // Stores JSON representation of List<MoveAnalysisDto>

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
