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
        if (lessonRepository.count() == 0) {
            log.info("No lessons found in database. Starting database seeder...");
            seedLessons();
        } else {
            log.info("Database already contains lessons. Skipping seeder.");
        }
    }

    private void seedLessons() {
        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        try {
            Resource[] resources = resolver.getResources("classpath:lessons/*.json");
            log.info("Found {} lesson JSON files to seed.", resources.length);

            for (Resource resource : resources) {
                log.info("Seeding lessons from: {}", resource.getFilename());
                try (InputStream inputStream = resource.getInputStream()) {
                    List<LessonSeedDto> seeds = objectMapper.readValue(
                            inputStream,
                            new TypeReference<List<LessonSeedDto>>() {}
                    );

                    for (LessonSeedDto seed : seeds) {
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
                } catch (IOException e) {
                    log.error("Failed to seed lessons from file: " + resource.getFilename(), e);
                }
            }
            log.info("Database seeding completed successfully!");
        } catch (IOException e) {
            log.error("Failed to find lesson resources", e);
        }
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
