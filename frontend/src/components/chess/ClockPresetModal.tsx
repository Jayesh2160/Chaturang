import React, { useState } from 'react';
import type { ClockPreset } from '../../types/chess';
import { DEFAULT_CLOCK_PRESETS } from '../../constants/chessUI';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ClockPresetModalProps {
  activePreset: ClockPreset;
  onSelectPreset: (preset: ClockPreset) => void;
  onClose: () => void;
}

export const ClockPresetModal: React.FC<ClockPresetModalProps> = ({
  activePreset,
  onSelectPreset,
  onClose,
}) => {
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [customIncrement, setCustomIncrement] = useState<number>(0);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customPreset: ClockPreset = {
      id: `custom_${customMinutes}_${customIncrement}`,
      name: `Custom ${customMinutes}|${customIncrement}`,
      category: 'Custom',
      baseMinutes: Math.max(1, customMinutes),
      incrementSeconds: Math.max(0, customIncrement),
    };
    onSelectPreset(customPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <Card className="w-full max-w-md bg-zinc-950 border-amber-500/30 p-6 space-y-6 text-left shadow-2xl rounded-2xl">
        <div>
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            Select Time Control
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            Choose a standard tournament preset or configure a custom clock.
          </p>
        </div>

        {/* Standard Presets Grid */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Standard Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_CLOCK_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectPreset(p);
                  onClose();
                }}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                  activePreset.id === p.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                    : 'bg-zinc-900/60 border-white/5 text-zinc-300 hover:border-white/20 hover:bg-zinc-900'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs">{p.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{p.category}</span>
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 font-mono">
                  {p.baseMinutes} min + {p.incrementSeconds}s inc
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Presets Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2 border-t border-white/5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Custom Time Control
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400 font-medium">Base Time (Minutes)</span>
              <input
                type="number"
                min="1"
                max="300"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 1)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400 font-medium">Increment (Seconds)</span>
              <input
                type="number"
                min="0"
                max="60"
                value={customIncrement}
                onChange={(e) => setCustomIncrement(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

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
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none"
            >
              Apply Custom Clock
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
