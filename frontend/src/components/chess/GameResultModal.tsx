import React from 'react';
import { Award, RotateCcw, Home, Save, BarChart2 } from 'lucide-react';
import type { GameResult } from '../../types/chess';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface GameResultModalProps {
  result: GameResult;
  moveCount: number;
  onPlayAgain: () => void;
  onSaveMatch: () => void;
  onAnalyze: () => void;
  onReturnHome: () => void;
  onClose: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  result,
  moveCount,
  onPlayAgain,
  onSaveMatch,
  onAnalyze,
  onReturnHome,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <Card className="w-full max-w-sm bg-zinc-950 border-purple-500/30 p-6 space-y-6 text-center shadow-2xl rounded-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />

        {/* Header Icon */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
            <Award className="w-8 h-8" strokeWidth={1.5} />
          </div>

          <h2 className="text-2xl font-extrabold font-display text-white tracking-tight mt-2">
            {result.title}
          </h2>
          <p className="text-xs text-zinc-400 font-medium">{result.subtitle}</p>
        </div>

        {/* Match Statistics Summary */}
        <div className="relative z-10 bg-zinc-900/80 border border-white/5 rounded-xl p-3.5 space-y-2 text-xs font-mono text-zinc-400">
          <div className="flex justify-between">
            <span>Result Type:</span>
            <span className="text-zinc-200 uppercase font-bold">{result.type}</span>
          </div>
          <div className="flex justify-between">
            <span>Winner:</span>
            <span className="text-emerald-400 font-bold uppercase">
              {result.winner === 'draw' ? 'Draw (1/2-1/2)' : result.winner === 'w' ? 'White (1-0)' : 'Black (0-1)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Moves:</span>
            <span className="text-zinc-200">{moveCount}</span>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="relative z-10 space-y-2 pt-1">
          <Button
            variant="primary"
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={onSaveMatch}
              className="flex items-center justify-center gap-1.5 py-2 text-xs text-emerald-400 border-emerald-500/30"
            >
              <Save className="w-3.5 h-3.5" />
              Save Match
            </Button>

            <Button
              variant="outline"
              onClick={onAnalyze}
              className="flex items-center justify-center gap-1.5 py-2 text-xs text-zinc-300"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Analyze
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={onReturnHome}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-zinc-400 hover:text-white"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Dashboard
          </Button>
        </div>

        <button
          onClick={onClose}
          className="relative z-10 text-[11px] text-zinc-600 hover:text-zinc-400 underline font-medium"
        >
          Dismiss Summary
        </button>
      </Card>
    </div>
  );
};
