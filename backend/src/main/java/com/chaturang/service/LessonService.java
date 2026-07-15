package com.chaturang.service;

import com.chaturang.dto.LessonResponse;
import com.chaturang.dto.ProgressResponse;
import com.chaturang.entity.User;

import java.util.List;

public interface LessonService {
    List<LessonResponse> getAllLessons(User user, String search);
    LessonResponse getLessonBySlug(String slug, User user);
    ProgressResponse getProgress(User user);
    void completeLesson(String slug, User user);
}
