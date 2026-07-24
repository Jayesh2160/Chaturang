import React from 'react';
import { ShieldAlert, Award, Radio } from 'lucide-react';
import type { GameResult } from '../../types/chess';

interface GameStatusBarProps {
  presetName: string;
  isRated: boolean;
  activeTurnColor: 'w' | 'b';
  isCheck: boolean;
  gameResult: GameResult | null;
}

export const GameStatusBar: React.FC<GameStatusBarProps> = React.memo(
  ({ presetName, isRated, activeTurnColor, isCheck, gameResult }) => {
    return (
      <div className="w-full flex flex-col gap-2">
        {/* Main Status Bar */}
        <div className="w-full flex items-center justify-between bg-zinc-950/60 border border-white/5 px-4 py-2 rounded-xl text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-medium">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{presetName}</span>
            <span>•</span>
            <span>{isRated ? 'Rated Match' : 'Casual Practice'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Status:</span>
            <span className="font-mono font-semibold text-zinc-200">
              {gameResult
                ? gameResult.title
                : `${activeTurnColor === 'w' ? 'White' : 'Black'} to Move`}
            </span>
          </div>
        </div>

        {/* Check & Result Alert Banners */}
        {isCheck && !gameResult && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-4 py-2.5 rounded-xl font-semibold animate-pulse text-left">
            <ShieldAlert className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span>Check! {activeTurnColor === 'w' ? 'White' : 'Black'} King is under attack!</span>
          </div>
        )}

        {gameResult && (
          <div className="flex items-center justify-between bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs px-4 py-3 rounded-xl font-semibold text-left shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 shrink-0" strokeWidth={2} />
              <div>
                <p className="font-bold">{gameResult.title}</p>
                <p className="text-[11px] text-emerald-300/80 font-normal">{gameResult.subtitle}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

GameStatusBar.displayName = 'GameStatusBar';
