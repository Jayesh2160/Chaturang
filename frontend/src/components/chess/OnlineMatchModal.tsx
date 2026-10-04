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
import { roomApiService } from '../../services/roomApiService';
import { useAuth } from '../../context/AuthContext';

interface OnlineMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomCode?: string;
  initialTab?: 'MATCHMAKING' | 'ROOM_CODE';
  initialRoomSubTab?: 'CREATE' | 'JOIN';
}

export const OnlineMatchModal: React.FC<OnlineMatchModalProps> = ({
  isOpen,
  onClose,
  initialRoomCode = '',
  initialTab = 'MATCHMAKING',
  initialRoomSubTab = 'CREATE',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'MATCHMAKING' | 'ROOM_CODE'>(initialTab);
  const [roomSubTab, setRoomSubTab] = useState<'CREATE' | 'JOIN'>(initialRoomSubTab);

  // Sync props if changed
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && initialRoomSubTab) {
      setRoomSubTab(initialRoomSubTab);
    }
  }, [isOpen, initialRoomSubTab]);

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
    // Notify backend room service
    roomApiService.createRoom({
      timeControl: roomMinutes <= 1 ? 'bullet' : roomMinutes <= 3 ? 'blitz' : 'rapid',
      minutes: roomMinutes,
      preferredColor: selectedColor,
      playerName: user?.username,
      rating: user?.rating,
    }).catch(() => {});

    navigate(
      `/play?gameMode=ONLINE&room=${generatedRoomCode}&role=host&color=${selectedColor}&minutes=${roomMinutes}`
    );
    onClose();
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomInput.trim()) return;
    const cleanCode = joinRoomInput.trim().toUpperCase();

    // Notify backend room service
    roomApiService.joinRoom({
      roomCode: cleanCode,
      playerName: user?.username,
      rating: user?.rating,
    }).catch(() => {});

    navigate(`/play?gameMode=ONLINE&room=${cleanCode}&role=guest`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in text-left">
      <Card className="w-full max-w-lg bg-zinc-950/95 border border-purple-500/30 p-7 space-y-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] rounded-3xl relative max-h-[90vh] overflow-y-auto ring-1 ring-white/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/30 text-purple-300 shadow-md">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-xl text-white">
                  Live Online Arena
                </h3>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-zinc-400 text-xs mt-0.5 font-light">
                Match with global players or play friends with a private room code.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-zinc-900/90 border border-white/10 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('MATCHMAKING');
              setIsSearching(false);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'MATCHMAKING'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/30'
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
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ROOM_CODE'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/30'
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
                        className={`p-3.5 rounded-2xl border text-center transition-all ${
                          timeControl === t.id
                            ? 'bg-purple-600/25 border-purple-500 text-white shadow-lg shadow-purple-950/60 ring-1 ring-purple-500/40 -translate-y-0.5'
                            : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200 hover:bg-zinc-900'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{t.icon}</span>
                        <span className="text-xs font-bold block text-white">{t.label}</span>
                        <span className="text-[10px] text-zinc-400">{t.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Info Card */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span className="text-zinc-300 font-medium">Your Rating:</span>
                  </div>
                  <span className="font-mono font-bold text-purple-300 bg-purple-950/40 border border-purple-500/20 px-2.5 py-0.5 rounded-lg">
                    {user?.rating || 1200} ELO
                  </span>
                </div>

                <Button
                  onClick={() => setIsSearching(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-purple-900/40 transition-all hover:scale-[1.01]"
                >
                  <Sparkles className="w-4 h-4" />
                  Find Opponent Now
                </Button>
              </>
            ) : (
              /* Searching Match Screen */
              <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <div className="absolute w-16 h-16 rounded-full bg-purple-500/10 animate-ping" />
                  <Radio className="w-7 h-7 text-purple-400 absolute" />
                </div>
                <div>
                  <h4 className="text-lg font-bold font-display text-white">Searching for an Opponent...</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Matching with players near your rating ({user?.rating || 1200} ELO)
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-purple-300 bg-purple-950/40 border border-purple-500/20 px-4 py-1.5 rounded-full">
                  <span>Searching: {searchTime}s</span>
                  <span>•</span>
                  <span>Est: ~5s</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsSearching(false)}
                  className="text-xs text-zinc-400 hover:text-white border-zinc-700 rounded-xl"
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
                <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/20 to-zinc-900/60 border border-purple-500/30 flex flex-col items-center gap-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Share this 6-Character Room Code
                  </span>
                  {/* Segmented character tiles */}
                  <div className="flex items-center gap-2 justify-center py-1">
                    {generatedRoomCode.split('').map((char, i) => (
                      <div
                        key={i}
                        className="w-10 h-12 rounded-xl bg-purple-950/60 border border-purple-500/40 text-white font-mono font-extrabold text-xl flex items-center justify-center shadow-lg shadow-purple-950/50"
                      >
                        {char}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? 'Code Copied' : 'Copy Code'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLink ? 'Link Copied' : 'Copy Direct Link'}
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
