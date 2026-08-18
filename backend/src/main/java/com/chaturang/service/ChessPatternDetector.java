package com.chaturang.service;

import com.github.bhlangonijr.chesslib.Board;
import com.github.bhlangonijr.chesslib.Square;
import com.github.bhlangonijr.chesslib.Piece;
import com.github.bhlangonijr.chesslib.Side;
import com.github.bhlangonijr.chesslib.PieceType;
import com.github.bhlangonijr.chesslib.Rank;
import com.github.bhlangonijr.chesslib.File;
import com.github.bhlangonijr.chesslib.move.Move;
import com.github.bhlangonijr.chesslib.Bitboard;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChessPatternDetector {
    private static final Logger log = LoggerFactory.getLogger(ChessPatternDetector.class);

    public static String detectPattern(String fenBefore, String uciPlayed, String uciBest, int moveIndex) {
        try {
            Board board = new Board();
            board.loadFromFen(fenBefore);

            Side activeSide = board.getSideToMove();
            Side opponentSide = activeSide == Side.WHITE ? Side.BLACK : Side.WHITE;

            // 1. High-confidence Tactical Patterns
            
            // Check Fork
            if (isForkOpportunity(board, uciBest, activeSide, opponentSide)) {
                return "FORK";
            }

            // Check Pin & Skewer
            String pinOrSkewer = detectPinOrSkewer(board, uciBest, activeSide, opponentSide);
            if (pinOrSkewer != null) {
                return pinOrSkewer; // "PIN" or "SKEWER"
            }

            // Check Hanging Piece
            if (isHangingPieceTactic(board, uciBest, uciPlayed, activeSide, opponentSide)) {
                return "HANGING_PIECE";
            }

            // 2. Contextual Patterns
            
            // Check Back Rank Weakness
            if (isBackRankWeakness(board, uciBest, activeSide, opponentSide)) {
                return "BACK_RANK";
            }

            // Check King Safety
            if (isKingSafetyMistake(board, uciBest, uciPlayed, activeSide, opponentSide)) {
                return "KING_SAFETY";
            }

            // Check Endgame Context fallback
            if (isEndgameContext(board)) {
                return "ENDGAME";
            }

            // Check Opening Context fallback
            if (moveIndex <= 20) { // first 10 full moves
                return "OPENING";
            }

        } catch (Exception e) {
            log.error("Error during chess pattern detection", e);
        }
        return null;
    }

    private static boolean isForkOpportunity(Board board, String uciBest, Side activeSide, Side opponentSide) {
        if (uciBest == null || uciBest.length() < 4) return false;
        try {
            Square from = Square.fromValue(uciBest.substring(0, 2).toUpperCase());
            Square to = Square.fromValue(uciBest.substring(2, 4).toUpperCase());
            Piece piece = board.getPiece(from);
            if (piece == Piece.NONE) return false;

            // Simulate best move
            Board simBoard = board.clone();
            Move move = new Move(from, to);
            simBoard.doMove(move);

            // Get attacks from destination square 'to'
            long occupied = simBoard.getBitboard();
            long attacks = getAttacks(simBoard, piece.getPieceType(), activeSide, to, occupied);

            int attackCount = 0;
            for (Square sq : Square.values()) {
                if (sq == Square.NONE) continue;
                if ((attacks & sq.getBitboard()) != 0) {
                    Piece oppPiece = simBoard.getPiece(sq);
                    if (oppPiece != Piece.NONE && oppPiece.getPieceSide() == opponentSide) {
                        // Attacks opponent piece. Check if it's a valuable fork target:
                        // King is always a high value target, Queen is high value.
                        // Or if piece value is greater than the attacker's value.
                        // Or if the target is undefended.
                        boolean undefended = simBoard.squareAttackedBy(sq, opponentSide) == 0L;
                        int attackerVal = getPieceValue(piece.getPieceType());
                        int targetVal = getPieceValue(oppPiece.getPieceType());
                        if (oppPiece.getPieceType() == PieceType.KING || 
                            oppPiece.getPieceType() == PieceType.QUEEN ||
                            targetVal > attackerVal || 
                            undefended) {
                            attackCount++;
                        }
                    }
                }
            }
            return attackCount >= 2;
        } catch (Exception e) {
            return false;
        }
    }

    private static String detectPinOrSkewer(Board board, String uciBest, Side activeSide, Side opponentSide) {
        if (uciBest == null || uciBest.length() < 4) return null;
        try {
            Square from = Square.fromValue(uciBest.substring(0, 2).toUpperCase());
            Square to = Square.fromValue(uciBest.substring(2, 4).toUpperCase());
            Piece piece = board.getPiece(from);
            if (piece == Piece.NONE) return null;

            PieceType type = piece.getPieceType();
            if (type != PieceType.BISHOP && type != PieceType.ROOK && type != PieceType.QUEEN) {
                return null;
            }

            Board simBoard = board.clone();
            simBoard.doMove(new Move(from, to));

            // Traverse ray paths to find double blocker alignments
            int[][] directions = getDirectionsForPiece(type);
            int toCol = to.getFile().ordinal();
            int toRow = to.getRank().ordinal();

            for (int[] d : directions) {
                Square firstBlockerSq = null;
                Square secondBlockerSq = null;

                int r = toRow + d[0];
                int c = toCol + d[1];

                while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    Square currentSq = Square.encode(Rank.values()[r], File.values()[c]);
                    Piece p = simBoard.getPiece(currentSq);
                    if (p != Piece.NONE) {
                        if (firstBlockerSq == null) {
                            firstBlockerSq = currentSq;
                        } else {
                            secondBlockerSq = currentSq;
                            break; // found the piece behind it, stop searching this ray
                        }
                    }
                    r += d[0];
                    c += d[1];
                }

                if (firstBlockerSq != null && secondBlockerSq != null) {
                    Piece p1 = simBoard.getPiece(firstBlockerSq);
                    Piece p2 = simBoard.getPiece(secondBlockerSq);

                    // Both blockers must be opponent pieces
                    if (p1.getPieceSide() == opponentSide && p2.getPieceSide() == opponentSide) {
                        int v1 = getPieceValue(p1.getPieceType());
                        int v2 = getPieceValue(p2.getPieceType());

                        // Pin: piece behind has higher value or is King
                        if (v2 > v1 || p2.getPieceType() == PieceType.KING) {
                            return "PIN";
                        }
                        // Skewer: piece in front has higher value or is King
                        if (v1 > v2 || p1.getPieceType() == PieceType.KING) {
                            return "SKEWER";
                        }
                    }
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    private static boolean isHangingPieceTactic(Board board, String uciBest, String uciPlayed, Side activeSide, Side opponentSide) {
        try {
            // Scenario 1: Capturing an undefended piece (hanging piece) was the best move
            if (uciBest != null && uciBest.length() >= 4) {
                Square toBest = Square.fromValue(uciBest.substring(2, 4).toUpperCase());
                Piece targetBest = board.getPiece(toBest);
                if (targetBest != Piece.NONE && targetBest.getPieceSide() == opponentSide) {
                    // Check if target was undefended by opponent
                    boolean isDefended = board.squareAttackedBy(toBest, opponentSide) != 0L;
                    if (!isDefended) {
                        return true;
                    }
                }
            }

            // Scenario 2: The player's played move hangs a piece (moves to an attacked, undefended square)
            if (uciPlayed != null && uciPlayed.length() >= 4) {
                Square fromPlayed = Square.fromValue(uciPlayed.substring(0, 2).toUpperCase());
                Square toPlayed = Square.fromValue(uciPlayed.substring(2, 4).toUpperCase());
                Piece movingPiece = board.getPiece(fromPlayed);
                if (movingPiece != Piece.NONE) {
                    Board simBoard = board.clone();
                    simBoard.doMove(new Move(fromPlayed, toPlayed));

                    // After move, is the piece on toPlayed attacked but not defended?
                    boolean attacked = simBoard.squareAttackedBy(toPlayed, opponentSide) != 0L;
                    boolean defended = simBoard.squareAttackedBy(toPlayed, activeSide) != 0L;
                    if (attacked && !defended) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return false;
    }

    private static boolean isBackRankWeakness(Board board, String uciBest, Side activeSide, Side opponentSide) {
        if (uciBest == null || uciBest.length() < 4) return false;
        try {
            Square from = Square.fromValue(uciBest.substring(0, 2).toUpperCase());
            Square to = Square.fromValue(uciBest.substring(2, 4).toUpperCase());
            Piece piece = board.getPiece(from);
            if (piece == Piece.NONE) return false;

            PieceType type = piece.getPieceType();
            if (type != PieceType.ROOK && type != PieceType.QUEEN) return false;

            // Must target back rank of opponent
            int opponentBackRank = (opponentSide == Side.BLACK) ? 7 : 0;
            if (to.getRank().ordinal() != opponentBackRank) return false;

            // Locate opponent king
            Square kingSq = null;
            for (Square sq : Square.values()) {
                if (sq == Square.NONE) continue;
                Piece p = board.getPiece(sq);
                if (p != Piece.NONE && p.getPieceType() == PieceType.KING && p.getPieceSide() == opponentSide) {
                    kingSq = sq;
                    break;
                }
            }

            if (kingSq == null || kingSq.getRank().ordinal() != opponentBackRank) return false;

            // Simulate the back rank move
            Board simBoard = board.clone();
            simBoard.doMove(new Move(from, to));

            // Is the King now in check?
            if (simBoard.isKingAttacked()) {
                // Check if the King has escape squares or is blocked by own pawns
                int blockRank = (opponentSide == Side.BLACK) ? 6 : 1;
                int kingFile = kingSq.getFile().ordinal();

                int blockedCount = 0;
                int possibleEscapeCount = 0;

                for (int df = -1; df <= 1; df++) {
                    int f = kingFile + df;
                    if (f >= 0 && f < 8) {
                        Square blockSq = Square.encode(Rank.values()[blockRank], File.values()[f]);
                        Piece blocker = board.getPiece(blockSq);
                        if (blocker != Piece.NONE && blocker.getPieceSide() == opponentSide) {
                            blockedCount++;
                        } else {
                            possibleEscapeCount++;
                        }
                    }
                }

                // If King is blocked by pieces in front, and check is delivered
                if (blockedCount >= 2 && possibleEscapeCount <= 1) {
                    return true;
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return false;
    }

    private static boolean isKingSafetyMistake(Board board, String uciBest, String uciPlayed, Side activeSide, Side opponentSide) {
        try {
            // Best move was castling, which was missed
            if (uciBest != null) {
                if (activeSide == Side.WHITE) {
                    if ("E1G1".equalsIgnoreCase(uciBest) || "E1C1".equalsIgnoreCase(uciBest)) return true;
                } else {
                    if ("E8G8".equalsIgnoreCase(uciBest) || "E8C8".equalsIgnoreCase(uciBest)) return true;
                }
            }

            // Played move allowed an immediate check (king safety issue)
            if (uciPlayed != null && uciPlayed.length() >= 4) {
                Square from = Square.fromValue(uciPlayed.substring(0, 2).toUpperCase());
                Square to = Square.fromValue(uciPlayed.substring(2, 4).toUpperCase());
                Board simBoard = board.clone();
                simBoard.doMove(new Move(from, to));

                // If after player's move, opponent can check
                Square activeKingSq = null;
                for (Square sq : Square.values()) {
                    if (sq == Square.NONE) continue;
                    Piece p = simBoard.getPiece(sq);
                    if (p != Piece.NONE && p.getPieceType() == PieceType.KING && p.getPieceSide() == activeSide) {
                        activeKingSq = sq;
                        break;
                    }
                }
                if (activeKingSq != null) {
                    boolean kingAttackedAfter = simBoard.squareAttackedBy(activeKingSq, opponentSide) != 0L;
                    if (kingAttackedAfter) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            // ignore
        }
        return false;
    }

    private static boolean isEndgameContext(Board board) {
        int count = 0;
        for (Square sq : Square.values()) {
            if (sq == Square.NONE) continue;
            Piece p = board.getPiece(sq);
            if (p != Piece.NONE) {
                PieceType type = p.getPieceType();
                if (type != PieceType.PAWN && type != PieceType.KING) {
                    count++;
                }
            }
        }
        return count <= 4;
    }

    private static long getAttacks(Board board, PieceType type, Side side, Square sq, long occupied) {
        switch (type) {
            case KNIGHT:
                return Bitboard.getKnightAttacks(sq, ~0L);
            case BISHOP:
                return Bitboard.getBishopAttacks(occupied, sq);
            case ROOK:
                return Bitboard.getRookAttacks(occupied, sq);
            case QUEEN:
                return Bitboard.getBishopAttacks(occupied, sq) | Bitboard.getRookAttacks(occupied, sq);
            case KING:
                return Bitboard.getKingAttacks(sq, ~0L);
            case PAWN:
                return Bitboard.getPawnAttacks(side, sq);
            default:
                return 0L;
        }
    }

    private static int[][] getDirectionsForPiece(PieceType type) {
        if (type == PieceType.BISHOP) {
            return new int[][]{{-1,-1}, {-1,1}, {1,-1}, {1,1}};
        } else if (type == PieceType.ROOK) {
            return new int[][]{{-1,0}, {1,0}, {0,-1}, {0,1}};
        } else { // Queen
            return new int[][]{
                {-1,-1}, {-1,1}, {1,-1}, {1,1},
                {-1,0}, {1,0}, {0,-1}, {0,1}
            };
        }
    }

    private static int getPieceValue(PieceType type) {
        if (type == null) return 0;
        switch (type) {
            case PAWN: return 1;
            case KNIGHT: return 3;
            case BISHOP: return 3;
            case ROOK: return 5;
            case QUEEN: return 9;
            case KING: return 1000;
            default: return 0;
        }
    }
}
