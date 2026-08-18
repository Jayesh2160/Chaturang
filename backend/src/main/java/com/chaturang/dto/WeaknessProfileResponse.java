package com.chaturang.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeaknessProfileResponse {
    private String status; // "NOT_ENOUGH_DATA", "EARLY_INSIGHTS", "FULL_PROFILE"
    private Integer analyzedGamesCount;
    private String biggestWeakness;
    private String category;
    private String description;
    private Integer gamesAffected;
    private Integer totalOccurrences;
    private Map<String, Integer> patternOccurrences;

    // Recommended Academy lesson details (can be null if not found)
    private String recommendedLessonTitle;
    private String recommendedLessonSlug;
    private String recommendedLessonCategory;
    private String recommendedLessonShortDescription;
}
