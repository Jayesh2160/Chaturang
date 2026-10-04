import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Globe,
  Users,
  Copy,
  Check,
  Radio,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { generateRoomCode } from '../../services/onlineGameService';
import { useAuth } from '../../context/AuthContext';

interface OnlineMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomCode?: string;
}

export const OnlineMatchModal: React.FC<OnlineMatchModalProps> = ({
  isOpen,
  onClose,
  initialRoomCode = '',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'MATCHMAKING' | 'ROOM_CODE'>('MATCHMAKING');
  const [roomSubTab, setRoomSubTab] = useState<'CREATE' | 'JOIN'>('CREATE');

  // Matchmaking State
  const [timeControl, setTimeControl] = useState<'rapid' | 'blitz' | 'bullet'>('rapid');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchTime, setSearchTime] = useState<number>(0);

  // Room Code State
  const [generatedRoomCode, setGeneratedRoomCode] = useState<string>('');
  const [joinRoomInput, setJoinRoomInput] = useState<string>(initialRoomCode);
  const [selectedColor, setSelectedColor] = useState<'white' | 'black' | 'random'>('random');
  const [roomMinutes, setRoomMinutes] = useState<number>(10);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Generate a fresh code when creating a room
  useEffect(() => {
    if (isOpen && !generatedRoomCode) {
      setGeneratedRoomCode(generateRoomCode());
    }
  }, [isOpen, generatedRoomCode]);

  // Matchmaking timer effect
  useEffect(() => {
    let interval: any = null;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime((prev) => prev + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Handle Matchmaking Simulation / Pairing
  useEffect(() => {
    let matchTimeout: any = null;
    if (isSearching) {
      // Simulate finding a match in 5-8 seconds if no other peer broadcasts
      const matchDelay = Math.floor(4000 + Math.random() * 3000);
      matchTimeout = setTimeout(() => {
        setIsSearching(false);
        const matchRoom = generateRoomCode();
        const opponentRating = (user?.rating || 1200) + Math.floor(Math.random() * 100 - 50);
        const bots = ['Alex_Grandmaster', 'MorphyTactics', 'Vishy_Pro', 'KnightRider99', 'QueenGambit_07'];
        const opponentName = bots[Math.floor(Math.random() * bots.length)];

        navigate(
          `/play?gameMode=ONLINE&room=${matchRoom}&role=host&timeControl=${timeControl}&oppName=${encodeURIComponent(opponentName)}&oppRating=${opponentRating}&autoMatch=true`
        );
        onClose();
      }, matchDelay);
    }
    return () => clearTimeout(matchTimeout);
  }, [isSearching, timeControl, user, navigate, onClose]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/play?gameMode=ONLINE&room=${generatedRoomCode}&role=guest`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartHostRoom = () => {
    navigate(
      `/play?gameMode=ONLINE&room=${generatedRoomCode}&role=host&color=${selectedColor}&minutes=${roomMinutes}`
    );
    onClose();
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomInput.trim()) return;
    const cleanCode = joinRoomInput.trim().toUpperCase();
    navigate(`/play?gameMode=ONLINE&room=${cleanCode}&role=guest`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in text-left">
      <Card className="w-full max-w-lg bg-zinc-950 border-purple-500/30 p-6 space-y-6 shadow-2xl rounded-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Live Online Multiplayer
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                Compete against online players via matchmaking or invite friends with a room code.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900/90 border border-white/5 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('MATCHMAKING');
              setIsSearching(false);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'MATCHMAKING'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Quick Match
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ROOM_CODE');
              setIsSearching(false);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ROOM_CODE'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Play with Friend (Code)
          </button>
        </div>

        {/* Tab 1: Matchmaking Content */}
        {activeTab === 'MATCHMAKING' && (
          <div className="space-y-5">
            {!isSearching ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Choose Time Control
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'bullet', label: '1 min', sub: 'Bullet', icon: '⚡' },
                      { id: 'blitz', label: '3 min', sub: 'Blitz', icon: '🔥' },
                      { id: 'rapid', label: '10 min', sub: 'Rapid', icon: '⏱️' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTimeControl(t.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          timeControl === t.id
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950/50'
                            : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-xl block mb-1">{t.icon}</span>
                        <span className="text-xs font-bold block text-white">{t.label}</span>
                        <span className="text-[10px] text-zinc-400">{t.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Info Card */}
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span className="text-zinc-300 font-medium">Your Rating:</span>
                  </div>
                  <span className="font-mono font-bold text-purple-300">
                    {user?.rating || 1200} ELO
                  </span>
                </div>

                <Button
                  onClick={() => setIsSearching(true)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-900/30"
                >
                  <Sparkles className="w-4 h-4" />
                  Find Opponent Now
                </Button>
              </>
            ) : (
              /* Searching Match Screen */
              <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <div className="absolute w-12 h-12 rounded-full bg-purple-500/20 animate-ping" />
                  <Radio className="w-6 h-6 text-purple-400 absolute" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Searching for an Opponent...</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Matching with players near your rating ({user?.rating || 1200} ELO)
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-purple-300 bg-purple-950/40 border border-purple-500/20 px-4 py-1.5 rounded-full">
                  <span>Searching: {searchTime}s</span>
                  <span>•</span>
                  <span>Est: ~6s</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsSearching(false)}
                  className="text-xs text-zinc-400 hover:text-white border-zinc-700"
                >
                  Cancel Matchmaking
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Private Room Code Content */}
        {activeTab === 'ROOM_CODE' && (
          <div className="space-y-4">
            {/* Create vs Join Sub-toggle */}
            <div className="flex border-b border-white/10 pb-2 gap-4 text-xs">
              <button
                type="button"
                onClick={() => setRoomSubTab('CREATE')}
                className={`font-semibold pb-1.5 transition-colors relative ${
                  roomSubTab === 'CREATE' ? 'text-purple-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Create Room
                {roomSubTab === 'CREATE' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400 rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setRoomSubTab('JOIN')}
                className={`font-semibold pb-1.5 transition-colors relative ${
                  roomSubTab === 'JOIN' ? 'text-purple-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Join Existing Room
                {roomSubTab === 'JOIN' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400 rounded-full" />
                )}
              </button>
            </div>

            {roomSubTab === 'CREATE' ? (
              <div className="space-y-4">
                {/* Room Code Display Box */}
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                      Your Room Code
                    </span>
                    <span className="font-mono text-2xl font-extrabold text-white tracking-widest">
                      {generatedRoomCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copiedCode ? 'Copied' : 'Copy Code'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-2 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Link Copied' : 'Share Link'}
                    </button>
                  </div>
                </div>

                {/* Color Choice */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Play as
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'white', label: '⚪ White' },
                      { id: 'random', label: '🎲 Random' },
                      { id: 'black', label: '⚫ Black' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id as any)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                          selectedColor === c.id
                            ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                            : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clock Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Time Control
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { min: 3, label: '3 min' },
                      { min: 5, label: '5 min' },
                      { min: 10, label: '10 min' },
                      { min: 15, label: '15 min' },
                    ].map((cl) => (
                      <button
                        key={cl.min}
                        type="button"
                        onClick={() => setRoomMinutes(cl.min)}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-semibold text-center transition-colors ${
                          roomMinutes === cl.min
                            ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                            : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        {cl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleStartHostRoom}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-900/30"
                >
                  <ArrowRight className="w-4 h-4" />
                  Launch Room & Wait for Opponent
                </Button>
              </div>
            ) : (
              /* Join Room Subtab */
              <form onSubmit={handleJoinExistingRoom} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Enter Friend's Room Code
                  </label>
                  <input
                    type="text"
                    required
                    value={joinRoomInput}
                    onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                    placeholder="e.g. KNG-742"
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl font-mono text-center text-lg tracking-widest text-white uppercase focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Paste the 6-character room code shared by your friend.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-900/30"
                >
                  <Users className="w-4 h-4" />
                  Join Room Now
                </Button>
              </form>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
