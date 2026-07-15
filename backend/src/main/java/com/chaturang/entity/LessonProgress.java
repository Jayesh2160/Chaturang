package com.chaturang.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lesson_progresses", uniqueConstraints = {
    @UniqueConstraint(name = "uc_user_lesson", columnNames = {"user_id", "lesson_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(nullable = false)
    private boolean completed;

    @Column(name = "completion_date")
    private LocalDateTime completionDate;

    @Column(name = "last_viewed", nullable = false)
    private LocalDateTime lastViewed;
}
