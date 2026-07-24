import React, { useState } from 'react';
import {
  RotateCcw,
  Save,
  ArrowLeftRight,
  Volume2,
  VolumeX,
  Palette,
  Clock,
  Settings2,
  MousePointerClick,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { BOARD_THEMES } from '../../utils/boardThemes';

interface BoardControlsProps {
  onFlipBoard: () => void;
  autoFlip: boolean;
  onToggleAutoFlip: (val: boolean) => void;
  activeThemeId: string;
  onSelectTheme: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  premovesEnabled: boolean;
  onTogglePremoves: (val: boolean) => void;
  onOpenPresetModal: () => void;
  onResetGame: () => void;
  onSaveGame: () => void;
  activePresetName: string;
  moveCount: number;
}

export const BoardControls: React.FC<BoardControlsProps> = React.memo(
  ({
    onFlipBoard,
    autoFlip,
    onToggleAutoFlip,
    activeThemeId,
    onSelectTheme,
    soundEnabled,
    onToggleSound,
    premovesEnabled,
    onTogglePremoves,
    onOpenPresetModal,
    onResetGame,
    onSaveGame,
    activePresetName,
    moveCount,
  }) => {
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

    return (
      <div className="w-full flex flex-col gap-3 bg-zinc-950/60 border border-white/5 p-4 rounded-2xl text-left shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <h3 className="font-display font-semibold text-sm text-zinc-200 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-purple-400" />
            Board Toolbar
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono">Chaturang Engine v2.0</span>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Flip Board */}
          <Button
            variant="outline"
            onClick={onFlipBoard}
            className="flex items-center gap-2 justify-center py-2 h-9 text-xs"
            title="Flip perspective"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Flip Board
          </Button>

          {/* Sound Toggle */}
          <Button
            variant="outline"
            onClick={onToggleSound}
            className={`flex items-center gap-2 justify-center py-2 h-9 text-xs transition-colors ${
              soundEnabled ? 'text-emerald-400 border-emerald-500/30' : 'text-zinc-500'
            }`}
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundEnabled ? 'Sound ON' : 'Sound OFF'}
          </Button>

          {/* Timer Preset Launcher */}
          <Button
            variant="outline"
            onClick={onOpenPresetModal}
            className="flex items-center gap-2 justify-center py-2 h-9 text-xs text-amber-300 border-amber-500/20"
          >
            <Clock className="w-3.5 h-3.5" />
            {activePresetName}
          </Button>

          {/* Theme Dropdown Toggle */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="w-full flex items-center gap-2 justify-center py-2 h-9 text-xs"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              Theme
            </Button>

            {/* Theme Dropdown Menu */}
            {isThemeMenuOpen && (
              <div className="absolute right-0 top-11 z-30 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-1">
                {Object.values(BOARD_THEMES).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTheme(t.id);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                      activeThemeId === t.id ? 'bg-purple-600/20 text-purple-300 font-semibold' : 'text-zinc-400 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: t.darkSquare }}
                      />
                      <span>{t.name}</span>
                    </div>
                    {activeThemeId === t.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preferences Toggle Section */}
        <div className="bg-zinc-900/50 border border-white/5 p-2.5 rounded-xl space-y-2 text-xs">
          {/* Auto Flip Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-[11px] font-medium">Auto Flip Turn:</span>
            <button
              onClick={() => onToggleAutoFlip(!autoFlip)}
              className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase transition-colors ${
                autoFlip ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {autoFlip ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Premoves Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-[11px] font-medium flex items-center gap-1">
              <MousePointerClick className="w-3 h-3 text-purple-400" />
              Enable Premoves:
            </span>
            <button
              onClick={() => onTogglePremoves(!premovesEnabled)}
              className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase transition-colors ${
                premovesEnabled ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {premovesEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            onClick={onResetGame}
            className="flex-1 py-2 h-9 text-xs text-zinc-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Match
          </Button>

          <Button
            variant="primary"
            onClick={onSaveGame}
            disabled={moveCount === 0}
            className="flex-1 py-2 h-9 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Save Match
          </Button>
        </div>
      </div>
    );
  }
);

BoardControls.displayName = 'BoardControls';
