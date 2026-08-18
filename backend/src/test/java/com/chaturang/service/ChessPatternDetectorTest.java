package com.chaturang.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ChessPatternDetectorTest {

    @Test
    void testDetectFork() {
        // FEN with a white Knight on d5, black King on e8, black Rook on d7.
        // Best move is d5f6 (Knight fork).
        String fen = "4k3/3r4/8/3N4/8/8/8/4K3 w - - 0 1";
        String uciBest = "d5f6";
        String uciPlayed = "e1f1"; // Played a mistake instead

        String pattern = ChessPatternDetector.detectPattern(fen, uciPlayed, uciBest, 10);
        assertEquals("FORK", pattern);
    }

    @Test
    void testDetectPin() {
        // FEN with a white Bishop on e2, black Queen on d5, black King on a8 (on the diagonal h1-a8).
        // Best move is e2f3 (Bishop pins Queen).
        String fen = "k7/8/8/3q4/8/8/4B3/4K3 w - - 0 1";
        String uciBest = "e2f3";
        String uciPlayed = "e1d1"; // Played a mistake

        String pattern = ChessPatternDetector.detectPattern(fen, uciPlayed, uciBest, 12);
        assertEquals("PIN", pattern);
    }

    @Test
    void testDetectSkewer() {
        // FEN with white Bishop on g2, black King on f3, black Queen on c6.
        // Best move is g2h1 (Bishop skewers King on f3 to Queen on c6).
        String fen = "8/8/2q5/8/8/5k2/6B1/7K w - - 0 1";
        String uciBest = "g2h1";
        String uciPlayed = "7h2"; // Played a mistake

        String pattern = ChessPatternDetector.detectPattern(fen, uciPlayed, uciBest, 15);
        assertEquals("SKEWER", pattern);
    }

    @Test
    void testDetectHangingPiece() {
        // FEN with white Rook on a1, undefended black pawn on a7.
        // Best move is a1a7 (captures hanging pawn).
        String fen = "8/p7/8/8/8/8/8/R3K3 w Q - 0 1";
        String uciBest = "a1a7";
        String uciPlayed = "e1f1"; // Played a mistake

        String pattern = ChessPatternDetector.detectPattern(fen, uciPlayed, uciBest, 11);
        assertEquals("HANGING_PIECE", pattern);
    }

    @Test
    void testDetectBackRankWeakness() {
        // FEN with white Rook on d1, black King trapped behind pawns on g8/h7/g7/f7.
        // Best move is d1d8 (delivers mate on the back rank).
        String fen = "6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1";
        String uciBest = "d1d8";
        String uciPlayed = "g1f1"; // Played a mistake

        String pattern = ChessPatternDetector.detectPattern(fen, uciPlayed, uciBest, 25);
        assertEquals("BACK_RANK", pattern);
    }

    @Test
    void testDetectOpeningFallback() {
        // FEN starting position.
        // Played move e2e3, but best move e2e4.
        // Since it's move index 2 (<=20 plies) and no tactics, should fallback to OPENING.
        String fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        String uciBest = "e2e4";
        String uciPlayed = "h2h3"; // played bad move

        String pattern = ChessPatternDetector.detectPattern(fen, uciPlayed, uciBest, 2);
        assertEquals("OPENING", pattern);
    }

    @Test
    void testDetectEndgameFallback() {
        // FEN with only 3 non-pawn pieces.
        // Played move e3f3, best move e3d3.
        // Since count of non-pawns is <= 4 and it's ply 30 (> 20), should fallback to ENDGAME.
        String fen = "8/8/p3k3/P3p3/2K1P3/8/8/8 w - - 0 1";
        String uciBest = "c4c5";
        String uciPlayed = "c4d3"; // played mistake

        String pattern = ChessPatternDetector.detectPattern(fen, uciPlayed, uciBest, 30);
        assertEquals("ENDGAME", pattern);
    }
}
