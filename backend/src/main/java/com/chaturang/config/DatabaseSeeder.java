package com.chaturang.config;

import com.chaturang.entity.Difficulty;
import com.chaturang.entity.Lesson;
import com.chaturang.entity.LessonCategory;
import com.chaturang.repository.LessonRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final LessonRepository lessonRepository;
    private final ObjectMapper objectMapper;

    public DatabaseSeeder(LessonRepository lessonRepository, ObjectMapper objectMapper) {
        this.lessonRepository = lessonRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting database seeder and update check...");
        seedOrUpdateLessons();
    }

    private void seedOrUpdateLessons() {
        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        try {
            Resource[] resources = resolver.getResources("classpath:lessons/*.json");
            log.info("Found {} lesson JSON files.", resources.length);

            for (Resource resource : resources) {
                log.info("Processing lessons from: {}", resource.getFilename());
                try (InputStream inputStream = resource.getInputStream()) {
                    List<LessonSeedDto> seeds = objectMapper.readValue(
                            inputStream,
                            new TypeReference<List<LessonSeedDto>>() {}
                    );

                    for (LessonSeedDto seed : seeds) {
                        validateFens(seed.getContent(), seed.getTitle());

                        Optional<Lesson> existingOpt = lessonRepository.findBySlug(seed.getSlug());
                        if (existingOpt.isPresent()) {
                            Lesson existing = existingOpt.get();
                            boolean updated = false;

                            if (!existing.getTitle().equals(seed.getTitle())) {
                                existing.setTitle(seed.getTitle());
                                updated = true;
                            }
                            if (!existing.getContent().equals(seed.getContent())) {
                                existing.setContent(seed.getContent());
                                updated = true;
                            }
                            if (!existing.getShortDescription().equals(seed.getShortDescription())) {
                                existing.setShortDescription(seed.getShortDescription());
                                updated = true;
                            }
                            if (!existing.getEstimatedMinutes().equals(seed.getEstimatedMinutes())) {
                                existing.setEstimatedMinutes(seed.getEstimatedMinutes());
                                updated = true;
                            }
                            if (updated) {
                                log.info("Updating existing lesson in database: {}", seed.getSlug());
                                lessonRepository.save(existing);
                            }
                        } else {
                            log.info("Seeding new lesson: {}", seed.getSlug());
                            Lesson lesson = Lesson.builder()
                                    .title(seed.getTitle())
                                    .slug(seed.getSlug())
                                    .category(LessonCategory.valueOf(seed.getCategory()))
                                    .difficulty(Difficulty.valueOf(seed.getDifficulty()))
                                    .estimatedMinutes(seed.getEstimatedMinutes())
                                    .shortDescription(seed.getShortDescription())
                                    .content(seed.getContent())
                                    .build();
                            lessonRepository.save(lesson);
                        }
                    }
                } catch (IOException e) {
                    log.error("Failed to seed lessons from file: " + resource.getFilename(), e);
                }
            }
            log.info("Database seeding/update check completed successfully!");
        } catch (IOException e) {
            log.error("Failed to find lesson resources", e);
        }
    }

    private void validateFens(String content, String title) {
        if (content == null) return;
        Pattern pattern = Pattern.compile("\\[BOARD:([^\\]]+)\\]");
        Matcher matcher = pattern.matcher(content);
        while (matcher.find()) {
            String fen = matcher.group(1).trim();
            if (!isBasicFenValid(fen)) {
                log.warn("Invalid FEN detected in lesson: \"{}\"", title);
            }
        }
    }

    private boolean isBasicFenValid(String fen) {
        if ("start".equals(fen)) return true;

        String[] fields = fen.split("\\s+");
        String placement = fields[0];
        String[] ranks = placement.split("/");
        if (ranks.length != 8) {
            return false;
        }

        for (String rank : ranks) {
            int sum = 0;
            for (int i = 0; i < rank.length(); i++) {
                char c = rank.charAt(i);
                if (Character.isDigit(c)) {
                    sum += Character.getNumericValue(c);
                } else if (String.valueOf(c).matches("[prnbqkPRNBQK]")) {
                    sum += 1;
                } else {
                    return false;
                }
            }
            if (sum != 8) {
                return false;
            }
        }
        return true;
    }

    // Inner DTO helper for parsing JSON
    private static class LessonSeedDto {
        private String title;
        private String slug;
        private String category;
        private String difficulty;
        private Integer estimatedMinutes;
        private String shortDescription;
        private String content;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getSlug() { return slug; }
        public void setSlug(String slug) { this.slug = slug; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

        public Integer getEstimatedMinutes() { return estimatedMinutes; }
        public void setEstimatedMinutes(Integer estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }

        public String getShortDescription() { return shortDescription; }
        public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
