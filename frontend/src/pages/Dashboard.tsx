import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Layout } from '../components/Layout';
import { gameService } from '../services/gameService';
import type { GameResponse } from '../services/gameService';
import { BarChart2, BookOpen, Target, Play, Calendar, User, ArrowRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const data = await gameService.getGames();
        setGames(data);
      } catch (err) {
        console.error('Failed to load games', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGames();
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
      <div className="space-y-8">
        {/* Greetings Section */}
        <div className="space-y-1.5 text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-zinc-100 flex items-center gap-2">
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">
            Welcome back to Chaturang.
          </p>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800" />

        {/* Overview Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Games Analysed */}
          <Card 
            className="flex flex-col justify-between p-5 bg-zinc-900/40 border-zinc-800 hover:scale-[1.01] cursor-pointer"
            onClick={() => navigate('/my-games')}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 text-left">
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Games Saved</span>
                <span className="text-4xl font-extrabold font-display text-gradient">
                  {isLoading ? '...' : games.length}
                </span>
              </div>
              <div className="p-3 bg-violet-500/10 rounded-lg text-violet-400">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Card 2: Lessons Completed */}
          <Card className="flex flex-col justify-between p-5 bg-zinc-900/40 border-zinc-800">
            <div className="flex items-start justify-between">
              <div className="space-y-1 text-left">
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Lessons Completed</span>
                <span className="text-4xl font-extrabold font-display text-gradient">0</span>
              </div>
              <div className="p-3 bg-sky-500/10 rounded-lg text-sky-400">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Card 3: Play Now */}
          <Card className="flex flex-col justify-between p-5 bg-zinc-900/40 border-zinc-800 md:col-span-1">
            <div className="flex flex-col h-full justify-between gap-4 text-left">
              <div className="space-y-1">
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Active Match</span>
                <span className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-500 shrink-0" />
                  Play a local chess game
                </span>
              </div>
              <Button 
                onClick={() => navigate('/play')}
                size="sm" 
                className="w-full flex items-center gap-1.5 justify-center py-2 bg-gradient-to-tr from-violet-600 to-violet-500"
              >
                <Play className="w-4 h-4" />
                Play Chess
              </Button>
            </div>
          </Card>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800" />

        {/* Recent Activity */}
        <div className="space-y-4 text-left">
          <h2 className="text-lg font-bold font-display text-zinc-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            Recent Matches
          </h2>
          
          {isLoading ? (
            <Card className="p-8 bg-zinc-900/20 border-zinc-800/60 animate-pulse text-zinc-500 text-sm">
              Loading recent matches...
            </Card>
          ) : games.length === 0 ? (
            <Card className="flex items-center justify-center p-8 bg-zinc-900/20 border-zinc-800/60 border-dashed text-zinc-500 text-sm">
              No games saved yet. Click "Play Chess" to start your first game!
            </Card>
          ) : (
            <div className="space-y-3">
              {games.slice(0, 3).map((game) => (
                <Card 
                  key={game.id} 
                  onClick={() => navigate('/my-games')}
                  className="flex items-center justify-between p-4 bg-zinc-900/30 hover:bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700/80 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700/40 flex items-center justify-center text-zinc-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-200">
                        vs {game.opponentName}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Played as {game.playerColor} • {game.moveCount} moves
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      formatResult(game.result, game.playerColor) === 'Won'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : formatResult(game.result, game.playerColor) === 'Lost'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {formatResult(game.result, game.playerColor)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800" />
      </div>
    </Layout>
  );
};
