package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {
    private Long id;
    private String slug;
    private String title;
    private String category; // maps enum name to string
    private String difficulty; // maps enum name to string
    private Integer estimatedMinutes;
    private String shortDescription;
    private String content;
    private Boolean completed;
    private LocalDateTime createdAt;
}
