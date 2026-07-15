package com.chaturang.repository;

import com.chaturang.entity.Lesson;
import com.chaturang.entity.LessonProgress;
import com.chaturang.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {
    Optional<LessonProgress> findByUserAndLesson(User user, Lesson lesson);
    List<LessonProgress> findByUser(User user);
    List<LessonProgress> findByUserAndCompleted(User user, boolean completed);
}
