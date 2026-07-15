package com.chaturang.controller;

import com.chaturang.dto.LessonResponse;
import com.chaturang.dto.ProgressResponse;
import com.chaturang.security.CustomUserDetails;
import com.chaturang.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @GetMapping("/lessons")
    public ResponseEntity<List<LessonResponse>> getAllLessons(
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(lessonService.getAllLessons(userDetails.getUser(), search));
    }

    @GetMapping("/lessons/{slug}")
    public ResponseEntity<LessonResponse> getLessonBySlug(
            @PathVariable String slug,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(lessonService.getLessonBySlug(slug, userDetails.getUser()));
    }

    @GetMapping("/progress")
    public ResponseEntity<ProgressResponse> getProgress(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(lessonService.getProgress(userDetails.getUser()));
    }

    @PostMapping("/progress/{slug}/complete")
    public ResponseEntity<Void> completeLesson(
            @PathVariable String slug,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        lessonService.completeLesson(slug, userDetails.getUser());
        return ResponseEntity.ok().build();
    }
}
