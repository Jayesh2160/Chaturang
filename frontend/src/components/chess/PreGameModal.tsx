import React, { useState } from 'react';
import type { GameSetupOptions, ClockPreset } from '../../types/chess';
import { DEFAULT_CLOCK_PRESETS } from '../../constants/chessUI';
import { BOARD_THEMES } from '../../utils/boardThemes';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Settings, Check } from 'lucide-react';

interface PreGameModalProps {
  currentOptions: GameSetupOptions;
  onStartGame: (options: GameSetupOptions) => void;
  onClose: () => void;
}

export const PreGameModal: React.FC<PreGameModalProps> = ({
  currentOptions,
  onStartGame,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ClockPreset>(
    DEFAULT_CLOCK_PRESETS.find((p) => p.id === currentOptions.presetId) || DEFAULT_CLOCK_PRESETS[3]
  );
  const [rated, setRated] = useState<boolean>(currentOptions.rated);
  const [userColor, setUserColor] = useState<'white' | 'black' | 'random'>(currentOptions.userColor);
  const [themeId, setThemeId] = useState<string>(currentOptions.themeId);
  const [autoFlip] = useState<boolean>(currentOptions.autoFlip);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      ...currentOptions,
      presetId: selectedPreset.id,
      baseMinutes: selectedPreset.baseMinutes,
      incrementSeconds: selectedPreset.incrementSeconds,
      rated,
      userColor,
      themeId,
      autoFlip,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-zinc-950 border-purple-500/30 p-6 space-y-5 text-left shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            New Match Configuration
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            Configure your tournament parameters before starting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Time Control */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
              Time Control
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_CLOCK_PRESETS.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPreset(p)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                    selectedPreset.id === p.id
                      ? 'bg-purple-500/20 border-purple-500/50 text-white font-bold'
                      : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div>{p.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {p.baseMinutes} min + {p.incrementSeconds}s
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Side / Color Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
              Play As
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'white', label: '♔ White' },
                { id: 'random', label: '🎲 Random' },
                { id: 'black', label: '♚ Black' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setUserColor(c.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                    userColor === c.id
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rated / Casual */}
          <div className="flex items-center justify-between bg-zinc-900 border border-white/5 p-3 rounded-xl">
            <div>
              <p className="text-xs font-semibold text-zinc-200">Rated Game</p>
              <p className="text-[10px] text-zinc-500">Affects ELO ratings in profile log</p>
            </div>
            <button
              type="button"
              onClick={() => setRated(!rated)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                rated ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Board Theme */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
              Board Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(BOARD_THEMES).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                    themeId === t.id
                      ? 'bg-purple-500/20 border-purple-500/50 text-white font-bold'
                      : 'bg-zinc-900 border-white/5 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: t.darkSquare }}
                    />
                    <span>{t.name}</span>
                  </div>
                  {themeId === t.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-2"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              Start Match
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
