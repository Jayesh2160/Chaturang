package com.chaturang.service;

import com.chaturang.dto.LessonResponse;
import com.chaturang.dto.ProgressResponse;
import com.chaturang.entity.Lesson;
import com.chaturang.entity.LessonCategory;
import com.chaturang.entity.LessonProgress;
import com.chaturang.entity.User;
import com.chaturang.exception.ResourceNotFoundException;
import com.chaturang.repository.GameRepository;
import com.chaturang.repository.LessonProgressRepository;
import com.chaturang.repository.LessonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final GameRepository gameRepository;

    public LessonServiceImpl(LessonRepository lessonRepository,
                             LessonProgressRepository lessonProgressRepository,
                             GameRepository gameRepository) {
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.gameRepository = gameRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LessonResponse> getAllLessons(User user, String search) {
        List<Lesson> lessons;
        if (search != null && !search.trim().isEmpty()) {
            lessons = lessonRepository.searchLessons(search.trim());
        } else {
            lessons = lessonRepository.findAllByOrderByCategoryAscIdAsc();
        }

        List<LessonProgress> userProgress = lessonProgressRepository.findByUser(user);
        Map<Long, Boolean> completionMap = userProgress.stream()
                .collect(Collectors.toMap(
                        p -> p.getLesson().getId(),
                        LessonProgress::isCompleted,
                        (existing, replacement) -> existing
                ));

        return lessons.stream()
                .map(lesson -> convertToResponse(lesson, completionMap.getOrDefault(lesson.getId(), false)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LessonResponse getLessonBySlug(String slug, User user) {
        Lesson lesson = lessonRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found with slug: " + slug));

        // Create or update progress for last viewed tracking
        LessonProgress progress = lessonProgressRepository.findByUserAndLesson(user, lesson)
                .orElseGet(() -> LessonProgress.builder()
                        .user(user)
                        .lesson(lesson)
                        .completed(false)
                        .lastViewed(LocalDateTime.now())
                        .build());

        progress.setLastViewed(LocalDateTime.now());
        lessonProgressRepository.save(progress);

        return convertToResponse(lesson, progress.isCompleted());
    }

    @Override
    @Transactional(readOnly = true)
    public ProgressResponse getProgress(User user) {
        List<Lesson> allLessons = lessonRepository.findAll();
        List<LessonProgress> userProgress = lessonProgressRepository.findByUser(user);

        Map<Long, LessonProgress> progressMap = userProgress.stream()
                .collect(Collectors.toMap(
                        p -> p.getLesson().getId(),
                        p -> p,
                        (existing, replacement) -> existing
                ));

        List<LessonResponse> completedLessons = new ArrayList<>();
        List<LessonResponse> remainingLessons = new ArrayList<>();

        int completedMinutes = 0;

        for (Lesson lesson : allLessons) {
            LessonProgress progress = progressMap.get(lesson.getId());
            boolean isCompleted = progress != null && progress.isCompleted();
            LessonResponse response = convertToResponse(lesson, isCompleted);

            if (isCompleted) {
                completedLessons.add(response);
                completedMinutes += lesson.getEstimatedMinutes();
            } else {
                remainingLessons.add(response);
            }
        }

        int completedCount = completedLessons.size();
        int totalCount = allLessons.size();
        double progressPercentage = totalCount > 0 ? (completedCount * 100.0) / totalCount : 0.0;

        // Favorite Category
        Map<LessonCategory, Long> categoryCounts = userProgress.stream()
                .filter(LessonProgress::isCompleted)
                .map(p -> p.getLesson().getCategory())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        String favoriteCategory = categoryCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> formatEnumName(entry.getKey().name()))
                .orElse("None");

        // Streak Calculation (Lessons completed + Games played)
        SortedSet<LocalDate> activeDates = new TreeSet<>(Collections.reverseOrder());

        userProgress.stream()
                .filter(LessonProgress::isCompleted)
                .forEach(p -> {
                    if (p.getCompletionDate() != null) {
                        activeDates.add(p.getCompletionDate().toLocalDate());
                    }
                });

        gameRepository.findAllByUserOrderByCreatedAtDesc(user).forEach(g -> {
            if (g.getCreatedAt() != null) {
                activeDates.add(g.getCreatedAt().toLocalDate());
            }
        });

        int streak = 0;
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        if (!activeDates.isEmpty()) {
            LocalDate currentCheck = activeDates.first();
            if (currentCheck.equals(today) || currentCheck.equals(yesterday)) {
                streak = 1;
                LocalDate expected = currentCheck.minusDays(1);
                for (LocalDate date : activeDates) {
                    if (date.equals(currentCheck)) {
                        continue;
                    }
                    if (date.equals(expected)) {
                        streak++;
                        expected = date.minusDays(1);
                    } else if (date.isBefore(expected)) {
                        break;
                    }
                }
            }
        }

        return ProgressResponse.builder()
                .completedCount(completedCount)
                .totalCount(totalCount)
                .progressPercentage(progressPercentage)
                .streak(streak)
                .hoursStudied(completedMinutes / 60.0)
                .favoriteCategory(favoriteCategory)
                .completedLessons(completedLessons)
                .remainingLessons(remainingLessons)
                .build();
    }

    @Override
    @Transactional
    public void completeLesson(String slug, User user) {
        Lesson lesson = lessonRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found with slug: " + slug));

        LessonProgress progress = lessonProgressRepository.findByUserAndLesson(user, lesson)
                .orElseGet(() -> LessonProgress.builder()
                        .user(user)
                        .lesson(lesson)
                        .completed(false)
                        .lastViewed(LocalDateTime.now())
                        .build());

        if (!progress.isCompleted()) {
            progress.setCompleted(true);
            progress.setCompletionDate(LocalDateTime.now());
        }
        progress.setLastViewed(LocalDateTime.now());
        lessonProgressRepository.save(progress);
    }

    private LessonResponse convertToResponse(Lesson lesson, boolean completed) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .slug(lesson.getSlug())
                .title(lesson.getTitle())
                .category(formatEnumName(lesson.getCategory().name()))
                .difficulty(formatEnumName(lesson.getDifficulty().name()))
                .estimatedMinutes(lesson.getEstimatedMinutes())
                .shortDescription(lesson.getShortDescription())
                .content(lesson.getContent())
                .completed(completed)
                .createdAt(lesson.getCreatedAt())
                .build();
    }

    private String formatEnumName(String name) {
        if (name == null || name.isEmpty()) return "";
        String[] parts = name.split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            sb.append(part.substring(0, 1).toUpperCase())
              .append(part.substring(1).toLowerCase())
              .append(" ");
        }
        return sb.toString().trim();
    }
}
