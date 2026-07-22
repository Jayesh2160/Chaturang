import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Square, Move } from 'chess.js';
import type { BoardThemeConfig, Premove } from '../types/chess';

export interface UseMoveHighlightsProps {
  theme: BoardThemeConfig;
  selectedSquare: Square | null;
  legalMoves: Move[];
  lastMove: { from: Square; to: Square } | null;
  kingCheckSquare: Square | null;
  premove: Premove | null;
}

export const useMoveHighlights = ({
  theme,
  selectedSquare,
  legalMoves,
  lastMove,
  kingCheckSquare,
  premove,
}: UseMoveHighlightsProps) => {
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);

  const squareStyles = useMemo<Record<string, CSSProperties>>(() => {
    const styles: Record<string, CSSProperties> = {};

    // 1. Last move highlights (yellow)
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: theme.lastMoveSquare,
      };
      styles[lastMove.to] = {
        backgroundColor: theme.lastMoveSquare,
      };
    }

    // 2. Selected square highlight (blue glow)
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: theme.selectedSquare,
        boxShadow: 'inset 0 0 12px #3B82F6, 0 0 8px #3B82F6',
      };
    }

    // 3. Legal moves (dots for empty, red rings for captures)
    legalMoves.forEach((move) => {
      const isCapture = Boolean(move.captured);
      if (isCapture) {
        styles[move.to] = {
          background: `radial-gradient(circle, transparent 55%, ${theme.captureRing} 56%, ${theme.captureRing} 80%, transparent 81%)`,
          boxShadow: 'inset 0 0 6px rgba(239, 68, 68, 0.6)',
        };
      } else {
        styles[move.to] = {
          background: `radial-gradient(circle, ${theme.legalDot} 24%, transparent 25%)`,
        };
      }
    });

    // 4. King in check (red glowing border)
    if (kingCheckSquare) {
      styles[kingCheckSquare] = {
        backgroundColor: theme.checkSquare,
        boxShadow: 'inset 0 0 16px #EF4444, 0 0 12px #EF4444',
      };
    }

    // 5. Premove highlights (purple)
    if (premove) {
      styles[premove.from] = {
        backgroundColor: theme.premoveSquare,
        boxShadow: 'inset 0 0 8px #A855F7',
      };
      styles[premove.to] = {
        backgroundColor: theme.premoveSquare,
        boxShadow: 'inset 0 0 8px #A855F7',
      };
    }

    // 6. Hovered square (soft purple overlay)
    if (hoveredSquare && hoveredSquare !== selectedSquare) {
      styles[hoveredSquare] = {
        ...(styles[hoveredSquare] || {}),
        backgroundColor: styles[hoveredSquare]?.backgroundColor || theme.hoverSquare,
        outline: '2px solid rgba(124, 58, 237, 0.6)',
        outlineOffset: '-2px',
      };
    }

    return styles;
  }, [theme, selectedSquare, legalMoves, lastMove, kingCheckSquare, premove, hoveredSquare]);

  return {
    squareStyles,
    hoveredSquare,
    setHoveredSquare,
  };
};
