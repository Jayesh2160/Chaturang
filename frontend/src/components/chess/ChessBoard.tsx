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
    <div className="relative group w-full max-w-[580px] mx-auto">
      {/* Ambient board glow */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600/20 via-indigo-500/10 to-violet-600/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />

      {/* Luxury Tournament Bezel Container */}
      <div
        className={`relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-zinc-950 p-1.5 transition-all duration-300 ${
          shakeSquare ? 'animate-bounce border-red-500/60 shadow-red-500/30' : 'ring-1 ring-white/5'
        }`}
      >
        <div className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-zinc-900">
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
      </div>
    </div>
  );
  }
);

ChessBoard.displayName = 'ChessBoard';
