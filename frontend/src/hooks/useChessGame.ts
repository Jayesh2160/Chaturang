import { useState, useCallback, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square, Move } from 'chess.js';
import type { GameResult, PieceType, PlayerColor } from '../types/chess';
import { GameResultType } from '../types/chess';

export interface CapturedState {
  whiteCaptured: PieceType[]; // Pieces captured by White (black pieces)
  blackCaptured: PieceType[]; // Pieces captured by Black (white pieces)
  whiteScore: number;
  blackScore: number;
}

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const useChessGame = (initialFen?: string) => {
  // We maintain chess.js instance in ref for performance, and force reactive updates on FEN changes
  const chessRef = useRef<Chess>(new Chess(initialFen));
  const [fen, setFen] = useState<string>(() => chessRef.current.fen());

  // History stack for undo/redo & move position navigation
  const [historyFens, setHistoryFens] = useState<string[]>(() => [chessRef.current.fen()]);
  const [currentPlyIndex, setCurrentPlyIndex] = useState<number>(0);

  // Selection & Promotion State
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [promotionPending, setPromotionPending] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // Last Move
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Force re-render helper
  const syncState = useCallback((newLastMove?: { from: Square; to: Square } | null) => {
    const currentFen = chessRef.current.fen();
    setFen(currentFen);
    if (newLastMove !== undefined) {
      setLastMove(newLastMove);
    }
  }, []);

  // Compute Game Result
  const gameResult = useMemo<GameResult | null>(() => {
    const game = chessRef.current;
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'b' : 'w';
      return {
        type: GameResultType.CHECKMATE,
        winner,
        title: `${winner === 'w' ? 'White' : 'Black'} Wins!`,
        subtitle: 'By Checkmate',
      };
    }
    if (game.isStalemate()) {
      return {
        type: GameResultType.STALEMATE,
        winner: 'draw',
        title: 'Draw',
        subtitle: 'Stalemate - No legal moves remaining',
      };
    }
    if (game.isThreefoldRepetition()) {
      return {
        type: GameResultType.THREEFOLD_REPETITION,
        winner: 'draw',
        title: 'Draw',
        subtitle: 'Threefold Repetition',
      };
    }
    if (game.isInsufficientMaterial()) {
      return {
        type: GameResultType.INSUFFICIENT_MATERIAL,
        winner: 'draw',
        title: 'Draw',
        subtitle: 'Insufficient Material to checkmate',
      };
    }
    if (game.isDraw()) {
      return {
        type: GameResultType.FIFTY_MOVE_RULE,
        winner: 'draw',
        title: 'Draw',
        subtitle: '50-Move Rule / Draw',
      };
    }
    return null;
  }, [fen]);

  // Derived Properties
  const turn = useMemo<PlayerColor>(() => chessRef.current.turn(), [fen]);
  const isCheck = useMemo<boolean>(() => chessRef.current.isCheck(), [fen]);
  const isGameOver = useMemo<boolean>(() => gameResult !== null, [gameResult]);

  // Move History
  const history = useMemo(() => chessRef.current.history({ verbose: true }), [fen]);

  // Find King Square when in check
  const kingCheckSquare = useMemo<Square | null>(() => {
    if (!isCheck) return null;
    const board = chessRef.current.board();
    const activeTurn = chessRef.current.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === activeTurn) {
          return piece.square as Square;
        }
      }
    }
    return null;
  }, [isCheck, fen]);

  // Calculate Captured Pieces & Material Scores
  const capturedState = useMemo<CapturedState>(() => {
    const initialCounts: Record<PlayerColor, Record<PieceType, number>> = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    };

    const board = chessRef.current.board();
    const currentCounts: Record<PlayerColor, Record<PieceType, number>> = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          currentCounts[p.color][p.type]++;
        }
      }
    }

    const whiteCaptured: PieceType[] = []; // Black pieces captured by White
    const blackCaptured: PieceType[] = []; // White pieces captured by Black

    (Object.keys(initialCounts.b) as PieceType[]).forEach((type) => {
      const diff = initialCounts.b[type] - currentCounts.b[type];
      for (let i = 0; i < diff; i++) whiteCaptured.push(type);
    });

    (Object.keys(initialCounts.w) as PieceType[]).forEach((type) => {
      const diff = initialCounts.w[type] - currentCounts.w[type];
      for (let i = 0; i < diff; i++) blackCaptured.push(type);
    });

    const whiteMat = whiteCaptured.reduce((sum, p) => sum + PIECE_VALUES[p], 0);
    const blackMat = blackCaptured.reduce((sum, p) => sum + PIECE_VALUES[p], 0);

    return {
      whiteCaptured,
      blackCaptured,
      whiteScore: Math.max(0, whiteMat - blackMat),
      blackScore: Math.max(0, blackMat - whiteMat),
    };
  }, [fen]);

  // Legal moves for currently selected square
  const legalMovesForSelected = useMemo<Move[]>(() => {
    if (!selectedSquare) return [];
    return chessRef.current.moves({ square: selectedSquare, verbose: true });
  }, [selectedSquare, fen]);

  // Execute Move
  const makeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: PieceType): Move | null => {
      try {
        // Check for promotion requirement
        const piece = chessRef.current.get(from);
        const isPromotion =
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1')));

        if (isPromotion && !promotionPiece) {
          setPromotionPending({ from, to });
          return null; // Waiting for promotion choice
        }

        const moveObj = {
          from,
          to,
          promotion: promotionPiece || 'q',
        };

        const result = chessRef.current.move(moveObj);
        if (result) {
          const newFen = chessRef.current.fen();
          setHistoryFens((prev) => [...prev.slice(0, currentPlyIndex + 1), newFen]);
          setCurrentPlyIndex((prev) => prev + 1);
          setSelectedSquare(null);
          setPromotionPending(null);
          syncState({ from: result.from as Square, to: result.to as Square });
          return result;
        }
      } catch (err) {
        // Illegal move
      }
      return null;
    },
    [currentPlyIndex, syncState]
  );

  // Confirm Promotion Choice
  const confirmPromotion = useCallback(
    (piece: PieceType) => {
      if (!promotionPending) return null;
      const { from, to } = promotionPending;
      return makeMove(from, to, piece);
    },
    [promotionPending, makeMove]
  );

  const cancelPromotion = useCallback(() => {
    setPromotionPending(null);
  }, []);

  // Reset Game
  const resetGame = useCallback((newFen?: string) => {
    chessRef.current = new Chess(newFen);
    const startFen = chessRef.current.fen();
    setFen(startFen);
    setHistoryFens([startFen]);
    setCurrentPlyIndex(0);
    setSelectedSquare(null);
    setPromotionPending(null);
    setLastMove(null);
  }, []);

  // Load position FEN directly
  const loadFen = useCallback((newFen: string) => {
    try {
      chessRef.current.load(newFen);
      setFen(newFen);
      setSelectedSquare(null);
      setPromotionPending(null);
    } catch (e) {
      console.error('Invalid FEN:', newFen);
    }
  }, []);

  // Navigation / Preview Past Moves (Undo/Redo)
  const canUndo = currentPlyIndex > 0;
  const canRedo = currentPlyIndex < historyFens.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    const prevIndex = currentPlyIndex - 1;
    const targetFen = historyFens[prevIndex];
    chessRef.current.load(targetFen);
    setCurrentPlyIndex(prevIndex);
    syncState(null);
  }, [canUndo, currentPlyIndex, historyFens, syncState]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const nextIndex = currentPlyIndex + 1;
    const targetFen = historyFens[nextIndex];
    chessRef.current.load(targetFen);
    setCurrentPlyIndex(nextIndex);
    syncState(null);
  }, [canRedo, currentPlyIndex, historyFens, syncState]);

  const jumpToPly = useCallback(
    (plyIndex: number) => {
      if (plyIndex >= 0 && plyIndex < historyFens.length) {
        const targetFen = historyFens[plyIndex];
        chessRef.current.load(targetFen);
        setCurrentPlyIndex(plyIndex);
        syncState(null);
      }
    },
    [historyFens, syncState]
  );

  return {
    chess: chessRef.current,
    fen,
    turn,
    isCheck,
    isGameOver,
    gameResult,
    kingCheckSquare,
    selectedSquare,
    setSelectedSquare,
    legalMovesForSelected,
    lastMove,
    history,
    capturedState,
    promotionPending,
    makeMove,
    confirmPromotion,
    cancelPromotion,
    resetGame,
    loadFen,
    // Undo / Redo
    canUndo,
    canRedo,
    undo,
    redo,
    jumpToPly,
    currentPlyIndex,
  };
};
