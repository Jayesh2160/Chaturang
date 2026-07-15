package com.chaturang.service;

import com.chaturang.entity.Lesson;
import com.chaturang.repository.LessonRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class LessonServiceTests {

    @Autowired
    private LessonRepository lessonRepository;

    @Test
    void testLessonsSeededSuccessfully() {
        List<Lesson> lessons = lessonRepository.findAll();
        assertNotNull(lessons);
        // The database seeder should insert exactly 24 lessons (4 lessons per category, 6 categories)
        assertEquals(24, lessons.size(), "Database seeder should seed exactly 24 lessons.");
    }

    @Test
    void testGetLessonBySlug() {
        // Test fetching by slug "chessboard-setup"
        Optional<Lesson> lessonOpt = lessonRepository.findBySlug("chessboard-setup");
        assertTrue(lessonOpt.isPresent(), "Lesson with slug 'chessboard-setup' should exist.");
        Lesson lesson = lessonOpt.get();
        assertEquals("The Chessboard and Setup", lesson.getTitle());
        assertNotNull(lesson.getContent());
    }
}
