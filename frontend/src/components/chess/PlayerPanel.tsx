import React from 'react';
import { User } from 'lucide-react';
import type { PlayerInfo, PieceType } from '../../types/chess';
import { CapturedPieces } from './CapturedPieces';
import { CHESS_UI } from '../../constants/chessUI';

interface PlayerPanelProps {
  player: PlayerInfo;
  timeInSeconds: number;
  formatTime: (sec: number) => string;
  isActiveTurn: boolean;
  isUser: boolean;
  capturedPieces: PieceType[];
  capturedScore: number;
}

export const PlayerPanel: React.FC<PlayerPanelProps> = React.memo(
  ({
    player,
    timeInSeconds,
    formatTime,
    isActiveTurn,
    isUser,
    capturedPieces,
    capturedScore,
  }) => {
    // Timer color calculations
    const isWarning = timeInSeconds <= CHESS_UI.TIMER_WARNING_SEC && timeInSeconds > CHESS_UI.TIMER_CRITICAL_SEC;
    const isCritical = timeInSeconds <= CHESS_UI.TIMER_CRITICAL_SEC;

    let timerColorClass = 'text-white bg-zinc-900 border-zinc-800';
    if (isCritical) {
      timerColorClass = 'text-red-400 bg-red-950/80 border-red-500/50 animate-pulse shadow-lg shadow-red-500/20';
    } else if (isWarning) {
      timerColorClass = 'text-amber-400 bg-amber-950/70 border-amber-500/40';
    }

    return (
      <div
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-300 ${
          isActiveTurn
            ? 'bg-zinc-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
            : 'bg-zinc-950/50 border-white/5 opacity-80'
        }`}
      >
        {/* Left Side: Avatar, Name, Rating & Captured Pieces */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform ${
              isActiveTurn ? 'scale-105 border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-zinc-900'
            }`}
          >
            {player.avatarUrl ? (
              <img src={player.avatarUrl} alt={player.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              <User className={`w-5 h-5 ${isActiveTurn ? 'text-emerald-400' : 'text-zinc-400'}`} strokeWidth={1.5} />
            )}
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-100 font-display tracking-tight">
                {player.name}
              </span>
              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded font-mono">
                {player.rating} ELO
              </span>
            </div>

            {/* Captured Pieces Tray */}
            <div className="mt-0.5">
              <CapturedPieces
                captured={capturedPieces}
                score={capturedScore}
                playerColor={player.color}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Turn Indicator Badge & Monospaced Timer */}
        <div className="flex items-center gap-4">
          {/* Active Turn Badge */}
          {isUser ? (
            isActiveTurn ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full animate-pulse shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>● YOUR TURN</span>
              </div>
            ) : (
              <div className="text-[11px] font-medium text-zinc-500 bg-zinc-900/50 border border-white/5 px-2.5 py-1 rounded-full">
                Waiting...
              </div>
            )
          ) : isActiveTurn ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          ) : null}

          {/* Monospaced Clock */}
          <div
            className={`font-mono font-extrabold text-lg md:text-xl px-3.5 py-1.5 rounded-xl border tracking-wider transition-colors min-w-[90px] text-center ${timerColorClass}`}
          >
            {formatTime(timeInSeconds)}
          </div>
        </div>
      </div>
    );
  }
);

PlayerPanel.displayName = 'PlayerPanel';
