import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { gameService } from '../services/gameService';
import type { GameResponse } from '../services/gameService';
import { lessonService } from '../services/lessonService';
import { ArrowRight, User, X } from 'lucide-react';
import { Card } from '../components/ui/Card';


export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameResponse[]>([]);
  const [completedLessonsCount, setCompletedLessonsCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Play vs Computer Modal states
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [gameMode, setGameMode] = useState<'classic' | 'blitz' | 'rapid' | 'bullet'>('rapid');



  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [gamesData, progressData] = await Promise.all([
          gameService.getGames(),
          lessonService.getProgress()
        ]);
        setGames(gamesData);
        setCompletedLessonsCount(progressData.completedCount);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = user ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Chess Learner';

  const formatResult = (res: string, playerColor: string) => {
    if (res === 'DRAW') return 'Draw';
    if (res === 'ABANDONED') return 'Abandoned';
    const isWhiteWin = res === 'WHITE_WIN';
    const playedWhite = playerColor === 'WHITE';
    return (isWhiteWin && playedWhite) || (!isWhiteWin && !playedWhite) ? 'Won' : 'Lost';
  };

  return (
    <Layout>
      <div className="space-y-16 animate-fade-in text-left">
        {/* Greetings Section */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-zinc-400 text-sm font-light">
            Welcome back to Chaturang. Study your blunder history and study coordinated tactics.
          </p>
        </div>

        {/* Overview Dashboard - Apple Style (Not Card Heavy) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Games Saved */}
          <div 
            onClick={() => navigate('/my-games')}
            className="flex flex-col justify-between py-6 border-b border-white/5 md:border-b-0 md:border-r border-white/5 pr-8 cursor-pointer group hover:opacity-80 transition-opacity"
          >
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Games Saved</span>
              <span className="text-5xl font-extrabold font-display text-white">
                {isLoading ? '...' : games.length}
              </span>
            </div>
            <span className="text-[10px] text-brand-accent font-semibold tracking-wider flex items-center gap-1 mt-4">
              View History <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
            </span>
          </div>

          {/* Lessons Completed */}
          <div 
            onClick={() => navigate('/progress')}
            className="flex flex-col justify-between py-6 border-b border-white/5 md:border-b-0 md:border-r border-white/5 pr-8 md:pl-8 cursor-pointer group hover:opacity-80 transition-opacity"
          >
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Lessons Completed</span>
              <span className="text-5xl font-extrabold font-display text-white">
                {completedLessonsCount !== null ? completedLessonsCount : '...'}
              </span>
            </div>
            <span className="text-[10px] text-brand-accent font-semibold tracking-wider flex items-center gap-1 mt-4">
              Check Progress <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
            </span>
          </div>

          {/* Play Chess CTA */}
          <div className="flex flex-col justify-between py-6 border-b border-white/5 md:border-b-0 md:border-r border-white/5 pr-8 md:pl-8">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-widest block">Quick Action</span>
              <h4 className="text-sm font-semibold text-zinc-200">Local Chess Board</h4>
              <p className="text-zinc-400 text-xs font-light max-w-xs">Practice tactical maneuvers and coordinates locally.</p>
            </div>
            <Button 
              onClick={() => navigate('/play?gameMode=SELF')}
              variant="outline"
              size="sm"
              className="mt-6 w-full sm:w-fit font-bold border-white/10 hover:border-white/20"
            >
              Play Chess
            </Button>
          </div>

          {/* Play vs Computer CTA */}
          <div className="flex flex-col justify-between py-6 md:pl-8">
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-widest block">Engine Mode</span>
              <h4 className="text-sm font-semibold text-zinc-200">Play vs Computer</h4>
              <p className="text-zinc-400 text-xs font-light max-w-xs">Challenge Stockfish with custom difficulties.</p>
            </div>
            <Button 
              onClick={() => setIsSetupModalOpen(true)}
              variant="primary"
              size="sm"
              className="mt-6 w-full sm:w-fit font-bold"
            >
              Play Engine
            </Button>
          </div>
        </div>

        {/* Separator Line */}
        <div className="h-[1px] bg-white/5 w-full" />

        {/* Recent Activity */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold font-display text-white tracking-wide">
            Recent Matches
          </h2>
          
          {isLoading ? (
            <div className="py-12 text-zinc-500 text-xs font-light">
              Loading recent matches...
            </div>
          ) : games.length === 0 ? (
            <div className="py-12 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-zinc-500 text-xs font-light">
              No games saved yet. Start by playing a match to log history.
            </div>
          ) : (
            <div className="space-y-4">
              {games.slice(0, 3).map((game) => (
                <div 
                  key={game.id} 
                  onClick={() => navigate('/my-games')}
                  className="flex items-center justify-between py-4 border-b border-white/5 cursor-pointer group hover:bg-white/[0.01] px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400">
                      <User className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-200 group-hover:text-white transition-colors">
                        vs {game.opponentName}
                      </h4>
                      <p className="text-xs text-zinc-500 font-light mt-0.5">
                        Played as {game.playerColor} • {game.moveCount} moves
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      formatResult(game.result, game.playerColor) === 'Won'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : formatResult(game.result, game.playerColor) === 'Lost'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-zinc-800 text-zinc-400 border border-white/5'
                    }`}>
                      {formatResult(game.result, game.playerColor)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-650 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Play vs Computer Setup Modal */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-sm bg-zinc-950 border-white/5 p-6 space-y-6 text-left shadow-2xl relative rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-white">vs Computer Setup</h3>
                <p className="text-zinc-500 text-xs mt-1">Configure your match settings below.</p>
              </div>
              <button 
                onClick={() => setIsSetupModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Game Mode / Time Control Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Time Control / Section</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['classic', 'blitz', 'rapid', 'bullet'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGameMode(mode)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border capitalize transition-all ${
                        gameMode === mode
                          ? 'bg-violet-500/10 border-violet-500 text-violet-400 font-bold'
                          : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200'
                      }`}
                    >
                      {mode} {mode === 'classic' ? '(4h)' : mode === 'blitz' ? '(3m)' : mode === 'rapid' ? '(10m)' : '(1m)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border capitalize transition-all ${
                        difficulty === level
                          ? 'bg-violet-500/10 border-violet-500 text-violet-400 font-bold'
                          : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200'
                      }`}
                    >
                      {level === 'EASY' ? '600' : level === 'MEDIUM' ? '1200' : '1800'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-555 font-light italic">
                  {difficulty === 'EASY' && 'Easy: Stockfish level 0. Perfect for beginners (~600 ELO).'}
                  {difficulty === 'MEDIUM' && 'Medium: Stockfish level 10. A balanced challenge (~1200 ELO).'}
                  {difficulty === 'HARD' && 'Hard: Stockfish level 20. Extremely strong engine (~1800 ELO).'}
                </p>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Play As</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['white', 'black'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPlayerColor(color)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border capitalize transition-all ${
                        playerColor === color
                          ? 'bg-violet-500/10 border-violet-500 text-violet-400 font-bold'
                          : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsSetupModalOpen(false)}
                className="flex-1 py-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsSetupModalOpen(false);
                  navigate(`/play?gameMode=COMPUTER&difficulty=${difficulty}&color=${playerColor}&timeControl=${gameMode}`);
                }}
                className="flex-1 py-2 bg-white text-zinc-950 hover:bg-zinc-200"
              >
                Start Match
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
};
