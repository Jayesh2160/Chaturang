import React from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'chess.js';
import type { BoardThemeConfig } from '../../types/chess';
import { CHESS_UI } from '../../constants/chessUI';

interface ChessBoardProps {
  fen: string;
  boardOrientation: 'white' | 'black';
  theme: BoardThemeConfig;
  squareStyles: Record<string, React.CSSProperties>;
  onSquareClick: (square: Square) => void;
  onPieceDrop: (sourceSquare: Square, targetSquare: Square) => boolean;
  onSquareMouseOver: (square: Square) => void;
  onSquareMouseOut: () => void;
  shakeSquare: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = React.memo(
  ({
    fen,
    boardOrientation,
    theme,
    squareStyles,
    onSquareClick,
    onPieceDrop,
    onSquareMouseOver,
    onSquareMouseOut,
    shakeSquare,
  }) => {
    return (
      <div
        className={`w-full max-w-[560px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative transition-transform duration-300 ${
          shakeSquare ? 'animate-bounce border-red-500/50 shadow-red-500/20' : ''
        }`}
      >
        <Chessboard
          options={{
            position: fen,
            boardOrientation: boardOrientation,
            onPieceDrop: ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
              if (!targetSquare) return false;
              return onPieceDrop(sourceSquare as Square, targetSquare as Square);
            },
            onSquareClick: ({ square }: { square: string }) => {
              onSquareClick(square as Square);
            },
            onMouseOverSquare: ({ square }: { square: string }) => {
              onSquareMouseOver(square as Square);
            },
            onMouseOutSquare: () => {
              onSquareMouseOut();
            },
            squareStyles: squareStyles,
            darkSquareStyle: { backgroundColor: theme.darkSquare },
            lightSquareStyle: { backgroundColor: theme.lightSquare },
            animationDurationInMs: CHESS_UI.ANIMATION_DURATION_MS,
            showNotation: true,
            allowDragging: true,
          }}
        />
      </div>
    );
  }
);

ChessBoard.displayName = 'ChessBoard';
