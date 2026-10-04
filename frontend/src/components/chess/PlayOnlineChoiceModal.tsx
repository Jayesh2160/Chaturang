import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Globe,
  Users,
  KeyRound,
  Zap,
  ArrowRight,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlayOnlineChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChoice: (choice: 'FRIEND_CODE' | 'GLOBAL_MATCHMAKING') => void;
}

export const PlayOnlineChoiceModal: React.FC<PlayOnlineChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectChoice,
}) => {
  const navigate = useNavigate();
  const [quickCode, setQuickCode] = useState('');
  const [quickCodeError, setQuickCodeError] = useState('');

  if (!isOpen) return null;

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickCode.trim().toUpperCase();
    if (!clean) {
      setQuickCodeError('Please enter a room code');
      return;
    }
    if (clean.length < 4) {
      setQuickCodeError('Code must be at least 4 characters');
      return;
    }
    setQuickCodeError('');
    navigate(`/play?gameMode=ONLINE&room=${encodeURIComponent(clean)}&role=guest`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in text-left">
      <Card className="w-full max-w-md bg-zinc-950/95 border border-purple-500/30 p-6 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] rounded-3xl relative ring-1 ring-white/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/30 text-purple-300 shadow-md">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-lg text-white">
                Play Online
              </h3>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-zinc-400 text-xs mt-0.5 font-light">
              Choose your match type to get started
            </p>
          </div>
        </div>

        {/* Two Main Choice Cards */}
        <div className="space-y-3">
          {/* Choice 1: Play with Friend via Code */}
          <button
            type="button"
            onClick={() => onSelectChoice('FRIEND_CODE')}
            className="w-full group text-left p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-zinc-900/70 to-indigo-950/30 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/50 transition-all shadow-md hover:shadow-purple-950/40 relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm group-hover:text-purple-200 transition-colors">
                    Play with Friend via Code
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Private
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mt-0.5 font-light line-clamp-1">
                  Create a custom room or enter your friend's code
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Choice 2: Global Matchmaking */}
          <button
            type="button"
            onClick={() => onSelectChoice('GLOBAL_MATCHMAKING')}
            className="w-full group text-left p-4 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-zinc-900/70 to-blue-950/30 border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-950/50 transition-all shadow-md hover:shadow-indigo-950/40 relative overflow-hidden flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm group-hover:text-indigo-200 transition-colors">
                    Global Matchmaking
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Instant
                  </span>
                </div>
                <p className="text-zinc-400 text-xs mt-0.5 font-light line-clamp-1">
                  Queue and pair with online players near your rating
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Quick Join With Friend's Code Form */}
        <div className="pt-2 border-t border-white/5">
          <form onSubmit={handleQuickJoin} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                Have a code ready?
              </label>
              {quickCodeError && (
                <span className="text-[10px] text-red-400 font-medium">
                  {quickCodeError}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickCode}
                onChange={(e) => {
                  setQuickCode(e.target.value.toUpperCase());
                  setQuickCodeError('');
                }}
                placeholder="e.g. KNG-742 or ABC123"
                maxLength={10}
                className="flex-1 bg-zinc-900 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white text-xs rounded-xl px-3 py-2 font-mono tracking-wider outline-none placeholder:text-zinc-600 uppercase"
              />
              <Button
                type="submit"
                variant="primary"
                className="text-xs py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
              >
                Join
              </Button>
            </div>
          </form>
        </div>

        {/* Rating Safety Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Fair-play certified • Real-time WebRTC synchronization</span>
        </div>
      </Card>
    </div>
  );
};
