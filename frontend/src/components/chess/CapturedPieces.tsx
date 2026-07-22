import React from 'react';
import type { PieceType, PlayerColor } from '../../types/chess';

interface CapturedPiecesProps {
  captured: PieceType[];
  score: number;
  playerColor: PlayerColor; // 'w' means this panel shows White's captures
}

// Simple Unicode Chess Symbols for Captured Tray
const PIECE_UNICODE: Record<PlayerColor, Record<PieceType, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

const ORDER: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

export const CapturedPieces: React.FC<CapturedPiecesProps> = React.memo(
  ({ captured, score, playerColor }) => {
    // Sort captured pieces by rank (Queen, Rook, Bishop, Knight, Pawn)
    const sortedCaptured = [...captured].sort(
      (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)
    );

    // Opponent piece color is opposite of player color
    const pieceColor: PlayerColor = playerColor === 'w' ? 'b' : 'w';

    if (sortedCaptured.length === 0 && score === 0) {
      return <div className="h-5 flex items-center text-[10px] text-zinc-600">No captures</div>;
    }

    return (
      <div className="flex items-center gap-1.5 min-h-[22px]">
        <div className="flex items-center -space-x-1 text-base leading-none select-none text-zinc-300">
          {sortedCaptured.map((piece, idx) => (
            <span
              key={`${piece}-${idx}`}
              title={piece.toUpperCase()}
              className="drop-shadow-sm hover:scale-125 transition-transform"
            >
              {PIECE_UNICODE[pieceColor][piece]}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className="text-[11px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
            +{score}
          </span>
        )}
      </div>
    );
  }
);

CapturedPieces.displayName = 'CapturedPieces';
