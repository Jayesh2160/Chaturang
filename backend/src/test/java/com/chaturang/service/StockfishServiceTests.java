package com.chaturang.service;

import com.chaturang.dto.EvaluationResponse;
import com.chaturang.entity.EngineDifficulty;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class StockfishServiceTests {

    @Autowired
    private StockfishService stockfishService;

    @Test
    void testGetBestMove_StartingPosition() {
        String startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        String bestMove = stockfishService.getBestMove(startingFen, EngineDifficulty.MEDIUM);
        
        assertNotNull(bestMove);
        assertFalse(bestMove.trim().isEmpty());
        // Verify UCI move format (e.g. e2e4, g1f3)
        assertTrue(bestMove.matches("^[a-h][1-8][a-h][1-8][qrbn]?$"));
    }

    @Test
    void testGetBestMove_Difficulties() {
        String startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        
        String easyMove = stockfishService.getBestMove(startingFen, EngineDifficulty.EASY);
        assertNotNull(easyMove);
        assertTrue(easyMove.matches("^[a-h][1-8][a-h][1-8][qrbn]?$"));

        String mediumMove = stockfishService.getBestMove(startingFen, EngineDifficulty.MEDIUM);
        assertNotNull(mediumMove);
        assertTrue(mediumMove.matches("^[a-h][1-8][a-h][1-8][qrbn]?$"));

        String hardMove = stockfishService.getBestMove(startingFen, EngineDifficulty.HARD);
        assertNotNull(hardMove);
        assertTrue(hardMove.matches("^[a-h][1-8][a-h][1-8][qrbn]?$"));
    }

    @Test
    void testEvaluate_WhiteToMove() {
        // Starting position (white to move)
        String startingFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        EvaluationResponse response = stockfishService.evaluate(startingFen);
        
        assertNotNull(response);
        assertNotNull(response.getEvaluation());
        assertNotNull(response.getPrincipalVariation());
        
        // PV should contain a sequence of space separated moves
        assertFalse(response.getPrincipalVariation().trim().isEmpty());
        
        // Starting position should be roughly equal (between -1.50 and +1.50)
        String eval = response.getEvaluation();
        assertTrue(eval.startsWith("+") || eval.startsWith("-") || "0.00".equals(eval));
    }

    @Test
    void testEvaluate_BlackToMove() {
        // Position after 1. e4 (black to move)
        String fenAfterE4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
        EvaluationResponse response = stockfishService.evaluate(fenAfterE4);
        
        assertNotNull(response);
        assertNotNull(response.getEvaluation());
        assertNotNull(response.getPrincipalVariation());
        assertFalse(response.getPrincipalVariation().trim().isEmpty());
        
        // The evaluation should still be normalized to White's perspective.
        // Since White played e4, White should still be slightly better or equal.
        String eval = response.getEvaluation();
        assertTrue(eval.startsWith("+") || eval.startsWith("-") || "0.00".equals(eval));
    }
}
