package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressResponse {
    private Integer completedCount;
    private Integer totalCount;
    private Double progressPercentage;
    private Integer streak;
    private Double hoursStudied;
    private String favoriteCategory;
    private List<LessonResponse> completedLessons;
    private List<LessonResponse> remainingLessons;
}
