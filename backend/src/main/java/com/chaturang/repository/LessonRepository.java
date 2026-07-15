package com.chaturang.repository;

import com.chaturang.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    Optional<Lesson> findBySlug(String slug);
    List<Lesson> findAllByOrderByCategoryAscIdAsc();

    @Query("SELECT l FROM Lesson l WHERE LOWER(l.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(l.shortDescription) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Lesson> searchLessons(@Param("query") String query);
}
