import React from 'react';
import type { PieceType, PlayerColor } from '../../types/chess';
import { Card } from '../ui/Card';

interface PromotionModalProps {
  color: PlayerColor;
  onSelectPiece: (piece: PieceType) => void;
  onCancel: () => void;
}

const PROMOTION_PIECES: { type: PieceType; label: string; symbol: Record<PlayerColor, string> }[] = [
  { type: 'q', label: 'Queen', symbol: { w: '♕', b: '♛' } },
  { type: 'r', label: 'Rook', symbol: { w: '♖', b: '♜' } },
  { type: 'b', label: 'Bishop', symbol: { w: '♗', b: '♝' } },
  { type: 'n', label: 'Knight', symbol: { w: '♘', b: '♞' } },
];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  color,
  onSelectPiece,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <Card className="w-full max-w-sm bg-zinc-950 border-purple-500/30 p-6 text-center space-y-4 shadow-2xl rounded-2xl">
        <div>
          <h3 className="font-display font-bold text-lg text-white">Promote Pawn</h3>
          <p className="text-zinc-400 text-xs mt-1">Select a piece to replace your pawn.</p>
        </div>

        <div className="grid grid-cols-4 gap-3 py-2">
          {PROMOTION_PIECES.map((piece) => (
            <button
              key={piece.type}
              onClick={() => onSelectPiece(piece.type)}
              className="flex flex-col items-center justify-center p-3 bg-zinc-900 border border-white/10 hover:border-purple-500 hover:bg-purple-500/20 rounded-xl transition-all hover:scale-105 active:scale-95 group"
            >
              <span className="text-4xl text-zinc-100 group-hover:text-purple-300 transition-colors">
                {piece.symbol[color]}
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-white mt-1">
                {piece.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline font-medium pt-1"
        >
          Cancel
        </button>
      </Card>
    </div>
  );
};
