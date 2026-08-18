package com.chaturang.service;

import com.chaturang.dto.*;
import com.chaturang.entity.Game;
import com.chaturang.entity.GameAnalysis;
import com.chaturang.entity.User;
import com.chaturang.exception.ResourceNotFoundException;
import com.chaturang.repository.GameAnalysisRepository;
import com.chaturang.repository.GameRepository;
import com.chaturang.repository.LessonRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class GameAnalysisServiceImpl implements GameAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(GameAnalysisServiceImpl.class);

    private final GameRepository gameRepository;
    private final GameAnalysisRepository gameAnalysisRepository;
    private final StockfishService stockfishService;
    private final ObjectMapper objectMapper;
    private final LessonRepository lessonRepository;

    public GameAnalysisServiceImpl(
            GameRepository gameRepository,
            GameAnalysisRepository gameAnalysisRepository,
            StockfishService stockfishService,
            ObjectMapper objectMapper,
            LessonRepository lessonRepository) {
        this.gameRepository = gameRepository;
        this.gameAnalysisRepository = gameAnalysisRepository;
        this.stockfishService = stockfishService;
        this.objectMapper = objectMapper;
        this.lessonRepository = lessonRepository;
    }

    @Override
    @Transactional
    public GameAnalysisResponse analyzeGame(Long gameId, GameAnalysisRequest request, User user) {
        // 1. Verify game ownership
        Game game = gameRepository.findByIdAndUser(gameId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id " + gameId));

        // 2. Return cached analysis if already calculated
        Optional<GameAnalysis> existing = gameAnalysisRepository.findByGame(game);
        if (existing.isPresent()) {
            log.info("Returning cached game analysis for game: {}", gameId);
            return convertToResponse(existing.get());
        }

        List<String> fens = request.getFens();
        List<MoveRequest> moves = request.getMoves();

        if (fens == null || fens.isEmpty()) {
            throw new IllegalArgumentException("FEN positions list cannot be empty");
        }

        log.info("Starting sequential Stockfish evaluation for game {} ({} moves, {} positions)",
                gameId, moves.size(), fens.size());

        // 3. Measure actual performance of sequential Stockfish evaluations
        long startTime = System.currentTimeMillis();
        List<EvaluationResponse> evals = new ArrayList<>();
        for (String fen : fens) {
            evals.add(stockfishService.evaluate(fen));
        }
        long duration = System.currentTimeMillis() - startTime;
        log.info("Sequential Stockfish evaluation completed for game {} in {} ms (average {} ms per position)",
                gameId, duration, duration / fens.size());

        // 4. Classify moves and calculate drops
        List<MoveAnalysisDto> moveAnalyses = new ArrayList<>();
        int blunderCount = 0;
        int mistakeCount = 0;
        int inaccuracyCount = 0;
        int bestMoveCount = 0;
        int excellentMoveCount = 0;
        int goodMoveCount = 0;

        String userColorCode = game.getPlayerColor().equalsIgnoreCase("WHITE") ? "w" : "b";
        List<MoveAnalysisDto> playerMoves = new ArrayList<>();

        for (int i = 0; i < moves.size(); i++) {
            MoveRequest moveReq = moves.get(i);
            EvaluationResponse beforeEval = evals.get(i);
            EvaluationResponse afterEval = evals.get(i + 1);

            // Construct Played Move UCI representation (e.g. "e2e4" or "e7e8q")
            String uciPlayed = moveReq.getFrom() + moveReq.getTo() +
                    (moveReq.getPromotion() != null ? moveReq.getPromotion().toLowerCase() : "");

            String uciBest = beforeEval.getBestMove();

            // Convert string scores to numeric values (normalizing Mate in X to +/- 100 pawns)
            double beforeVal = parseEvalToNumeric(beforeEval.getEvaluation());
            double afterVal = parseEvalToNumeric(afterEval.getEvaluation());

            // Drop in evaluation from active player's perspective (loss of advantage)
            double loss;
            if (moveReq.getColor().equalsIgnoreCase("w")) {
                loss = beforeVal - afterVal;
            } else {
                loss = afterVal - beforeVal;
            }

            // Determine move classification
            String classification;
            String comment;

            if (uciPlayed.equalsIgnoreCase(uciBest) || loss <= 0.0) {
                classification = "BEST";
                comment = "Best move in this position.";
                bestMoveCount++;
            } else if (loss <= 0.2) {
                classification = "EXCELLENT";
                comment = "An excellent move.";
                excellentMoveCount++;
            } else if (loss <= 0.5) {
                classification = "GOOD";
                comment = "A solid move.";
                goodMoveCount++;
            } else if (loss <= 0.9) {
                classification = "INACCURACY";
                comment = "Inaccuracy. Better was " + (uciBest != null ? uciBest : "something else") + ".";
                inaccuracyCount++;
            } else if (loss <= 2.0) {
                classification = "MISTAKE";
                comment = "Mistake. Better was " + (uciBest != null ? uciBest : "something else") + ".";
                mistakeCount++;
            } else {
                classification = "BLUNDER";
                comment = "Blunder. Better was " + (uciBest != null ? uciBest : "something else") + ".";
                blunderCount++;
            }

            String weaknessPattern = null;
            if ("MISTAKE".equals(classification) || "BLUNDER".equals(classification)) {
                String fenBefore = fens.get(i);
                weaknessPattern = ChessPatternDetector.detectPattern(fenBefore, uciPlayed, uciBest, i);
            }

            MoveAnalysisDto moveAnalysis = MoveAnalysisDto.builder()
                    .moveIndex(i)
                    .san(moveReq.getSan())
                    .uci(uciPlayed)
                    .color(moveReq.getColor())
                    .evaluation(afterEval.getEvaluation())
                    .bestMove(uciBest)
                    .classification(classification)
                    .comment(comment)
                    .weaknessPattern(weaknessPattern)
                    .build();

            moveAnalyses.add(moveAnalysis);

            // Separate player's moves for Game Accuracy calculations
            if (moveReq.getColor().equalsIgnoreCase(userColorCode)) {
                playerMoves.add(moveAnalysis);
            }
        }

        // 5. Calculate Game Accuracy based on player moves and defined weights
        // Weights: BEST=100%, EXCELLENT=95%, GOOD=85%, INACCURACY=70%, MISTAKE=45%, BLUNDER=10%
        double accuracySum = 0;
        for (MoveAnalysisDto pMove : playerMoves) {
            switch (pMove.getClassification()) {
                case "BEST": accuracySum += 100.0; break;
                case "EXCELLENT": accuracySum += 95.0; break;
                case "GOOD": accuracySum += 85.0; break;
                case "INACCURACY": accuracySum += 70.0; break;
                case "MISTAKE": accuracySum += 45.0; break;
                case "BLUNDER": accuracySum += 10.0; break;
                default: accuracySum += 100.0;
            }
        }
        double averageAccuracy = playerMoves.isEmpty() ? 100.0 : (accuracySum / playerMoves.size());

        // 6. Generate dynamic coaching summary
        String summary = generateCoachingSummary(averageAccuracy, blunderCount, mistakeCount, inaccuracyCount);

        // 7. Save to database
        String moveAnalysesJson = "";
        try {
            moveAnalysesJson = objectMapper.writeValueAsString(moveAnalyses);
        } catch (Exception e) {
            log.error("Failed to serialize move analyses to JSON", e);
        }

        GameAnalysis gameAnalysis = GameAnalysis.builder()
                .game(game)
                .accuracy(averageAccuracy)
                .blunderCount(blunderCount)
                .mistakeCount(mistakeCount)
                .inaccuracyCount(inaccuracyCount)
                .bestMoveCount(bestMoveCount)
                .excellentMoveCount(excellentMoveCount)
                .goodMoveCount(goodMoveCount)
                .summary(summary)
                .moveAnalyses(moveAnalysesJson)
                .build();

        GameAnalysis saved = gameAnalysisRepository.save(gameAnalysis);
        return convertToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public GameAnalysisResponse getGameAnalysis(Long gameId, User user) {
        Game game = gameRepository.findByIdAndUser(gameId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with id " + gameId));

        GameAnalysis gameAnalysis = gameAnalysisRepository.findByGame(game)
                .orElseThrow(() -> new ResourceNotFoundException("No analysis found for game with id " + gameId));

        return convertToResponse(gameAnalysis);
    }

    private double parseEvalToNumeric(String evalStr) {
        if (evalStr == null) return 0.0;
        evalStr = evalStr.trim();
        if (evalStr.contains("Mate")) {
            boolean isPositive = evalStr.startsWith("+");
            // Extract the number of moves to mate (e.g. "+Mate in 3" -> 3)
            String digits = evalStr.replaceAll("[^0-9]", "");
            int moves = digits.isEmpty() ? 1 : Integer.parseInt(digits);
            // Mate in 1 (99.9) is better for the winning player than Mate in 5 (99.5)
            if (isPositive) {
                return 100.0 - (moves * 0.1);
            } else {
                return -100.0 + (moves * 0.1);
            }
        } else {
            try {
                // Parse scores like "+0.35" or "-1.20"
                return Double.parseDouble(evalStr);
            } catch (NumberFormatException e) {
                return 0.0;
            }
        }
    }

    private String generateCoachingSummary(double accuracy, int blunders, int mistakes, int inaccuracies) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Analysis complete! You achieved a Game Accuracy of %.0f%%. ", accuracy));
        if (accuracy >= 90.0) {
            sb.append("An outstanding performance! You displayed master-level accuracy, making almost no errors and capitalizing on board opportunities.");
        } else if (accuracy >= 75.0) {
            sb.append("A very solid game! You maintained a strong position throughout, though a few minor slips allowed your opponent opportunities.");
        } else if (accuracy >= 60.0) {
            sb.append("Decent showing, but there's room to grow. You had some good positional play, but watch out for tactical mistakes.");
        } else {
            sb.append("A tough match. You struggled to hold the initiative. Focus on double-checking candidate moves before making them to avoid hanging pieces.");
        }

        if (blunders > 0 || mistakes > 0 || inaccuracies > 0) {
            sb.append(" We detected ");
            List<String> details = new ArrayList<>();
            if (blunders > 0) details.add(blunders + (blunders == 1 ? " blunder" : " blunders"));
            if (mistakes > 0) details.add(mistakes + (mistakes == 1 ? " mistake" : " mistakes"));
            if (inaccuracies > 0) details.add(inaccuracies + (inaccuracies == 1 ? " inaccuracy" : " inaccuracies"));
            sb.append(String.join(", ", details));
            sb.append(" in this game.");
        } else {
            sb.append(" You played an flawless match with no blunders, mistakes, or inaccuracies!");
        }
        return sb.toString();
    }

    private GameAnalysisResponse convertToResponse(GameAnalysis ga) {
        List<MoveAnalysisDto> moveAnalysesList = new ArrayList<>();
        try {
            if (ga.getMoveAnalyses() != null && !ga.getMoveAnalyses().isEmpty()) {
                moveAnalysesList = objectMapper.readValue(
                        ga.getMoveAnalyses(),
                        new TypeReference<List<MoveAnalysisDto>>() {}
                );
            }
        } catch (Exception e) {
            log.error("Failed to deserialize move analyses JSON", e);
        }

        return GameAnalysisResponse.builder()
                .id(ga.getId())
                .gameId(ga.getGame().getId())
                .accuracy(ga.getAccuracy())
                .blunderCount(ga.getBlunderCount())
                .mistakeCount(ga.getMistakeCount())
                .inaccuracyCount(ga.getInaccuracyCount())
                .bestMoveCount(ga.getBestMoveCount())
                .excellentMoveCount(ga.getExcellentMoveCount())
                .goodMoveCount(ga.getGoodMoveCount())
                .summary(ga.getSummary())
                .moveAnalyses(moveAnalysesList)
                .createdAt(ga.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public WeaknessProfileResponse getWeaknessProfile(User user) {
        org.springframework.data.domain.Pageable limit8 = org.springframework.data.domain.PageRequest.of(0, 8);
        List<GameAnalysis> analyses = gameAnalysisRepository.findRecentByUser(user, limit8);

        int analyzedCount = analyses.size();

        WeaknessProfileResponse.WeaknessProfileResponseBuilder builder = WeaknessProfileResponse.builder()
                .analyzedGamesCount(analyzedCount);

        if (analyzedCount <= 2) {
            builder.status("NOT_ENOUGH_DATA");
            return builder.build();
        } else if (analyzedCount <= 4) {
            builder.status("EARLY_INSIGHTS");
        } else {
            builder.status("FULL_PROFILE");
        }

        java.util.Map<String, Integer> patternOccurrences = new java.util.HashMap<>();
        java.util.Map<String, java.util.Set<Long>> gamesWithPattern = new java.util.HashMap<>();

        String[] allPatterns = {"FORK", "PIN", "SKEWER", "HANGING_PIECE", "BACK_RANK", "KING_SAFETY", "OPENING", "ENDGAME"};
        for (String pat : allPatterns) {
            patternOccurrences.put(pat, 0);
            gamesWithPattern.put(pat, new java.util.HashSet<>());
        }

        for (GameAnalysis ga : analyses) {
            Long gameId = ga.getGame().getId();
            List<MoveAnalysisDto> moveAnalysesList = new ArrayList<>();
            try {
                if (ga.getMoveAnalyses() != null && !ga.getMoveAnalyses().isEmpty()) {
                    moveAnalysesList = objectMapper.readValue(
                            ga.getMoveAnalyses(),
                            new TypeReference<List<MoveAnalysisDto>>() {}
                    );
                }
            } catch (Exception e) {
                log.error("Failed to deserialize move analyses JSON", e);
            }

            for (MoveAnalysisDto move : moveAnalysesList) {
                String pattern = move.getWeaknessPattern();
                if (pattern != null && patternOccurrences.containsKey(pattern)) {
                    patternOccurrences.put(pattern, patternOccurrences.get(pattern) + 1);
                    gamesWithPattern.get(pattern).add(gameId);
                }
            }
        }

        String biggestPat = null;
        double maxScore = -1.0;
        int biggestPatGamesAffected = 0;
        int biggestPatOccurrences = 0;

        for (String pat : allPatterns) {
            int occurrences = patternOccurrences.get(pat);
            int gamesAffected = gamesWithPattern.get(pat).size();
            
            if (occurrences > 0) {
                double score = (gamesAffected * 3.0) + (occurrences * 0.5);
                if (score > maxScore) {
                    maxScore = score;
                    biggestPat = pat;
                    biggestPatGamesAffected = gamesAffected;
                    biggestPatOccurrences = occurrences;
                }
            }
        }

        if (biggestPat == null) {
            builder.status("NOT_ENOUGH_DATA");
            return builder.build();
        }

        builder.patternOccurrences(patternOccurrences);
        builder.gamesAffected(biggestPatGamesAffected);
        builder.totalOccurrences(biggestPatOccurrences);

        String weaknessName = "";
        String category = "";
        String description = "";
        String recommendedLessonSlug = "";

        switch (biggestPat) {
            case "FORK":
                weaknessName = "Knight Forks";
                category = "Tactical Awareness";
                description = "You repeatedly miss fork opportunities in your games.";
                recommendedLessonSlug = "the-fork";
                break;
            case "PIN":
                weaknessName = "Pins & Absolute Pins";
                category = "Tactical Awareness";
                description = "You struggle with pinned pieces and absolute pins.";
                recommendedLessonSlug = "the-pin";
                break;
            case "SKEWER":
                weaknessName = "Skewers";
                category = "Tactical Awareness";
                description = "You frequently miss skewers, allowing high-value pieces to be targeted.";
                recommendedLessonSlug = "the-skewer";
                break;
            case "HANGING_PIECE":
                weaknessName = "Hanging Pieces";
                category = "Tactical Awareness";
                description = "You repeatedly leave pieces undefended or miss opportunities to capture free pieces.";
                recommendedLessonSlug = "piece-movement";
                break;
            case "BACK_RANK":
                weaknessName = "Back-Rank Weakness";
                category = "Tactical Awareness";
                description = "You frequently leave your King trapped on the back rank behind pawns.";
                recommendedLessonSlug = "king-safety";
                break;
            case "KING_SAFETY":
                weaknessName = "King Safety & Castling";
                category = "General Principles";
                description = "You repeatedly leave your King in the center or fail to castle in time.";
                recommendedLessonSlug = "castling-rules";
                break;
            case "OPENING":
                weaknessName = "Opening Mistakes";
                category = "General Principles";
                description = "You repeatedly make development mistakes or move pieces multiple times in the opening.";
                recommendedLessonSlug = "piece-development";
                break;
            case "ENDGAME":
                weaknessName = "Endgame Principles";
                category = "General Principles";
                description = "You struggle to coordinate your King and pawns in the endgame.";
                recommendedLessonSlug = "king-activity";
                break;
        }

        builder.biggestWeakness(weaknessName);
        builder.category(category);
        builder.description(description);

        if (!recommendedLessonSlug.isEmpty()) {
            lessonRepository.findBySlug(recommendedLessonSlug).ifPresent(lesson -> {
                builder.recommendedLessonTitle(lesson.getTitle());
                builder.recommendedLessonSlug(lesson.getSlug());
                builder.recommendedLessonCategory(lesson.getCategory().name());
                builder.recommendedLessonShortDescription(lesson.getShortDescription());
            });
        }

        return builder.build();
    }
}
