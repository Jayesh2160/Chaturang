import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Layout } from '../components/Layout';
import { gameService } from '../services/gameService';
import type { GameResponse } from '../services/gameService';
import { lessonService } from '../services/lessonService';
import type { LessonResponse } from '../services/lessonService';
import { ArrowRight, User, X, Check, Award, Flame, Sparkles, BookOpen, RefreshCw, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { calculateGamificationStats, getDailyGoalsStatus } from '../utils/gamification';

// 3 Daily tactical puzzles definition
const DAILY_PUZZLES = [
  {
    id: 1,
    title: "Back Rank Mate",
    description: "White to play: exploit the weak back rank to deliver checkmate.",
    fen: "6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1",
    solution: "d1d8",
    success: "Checkmate! The Rook dominates the back rank."
  },
  {
    id: 2,
    title: "Royal Fork",
    description: "White to play: jump the Knight to fork the King and Queen.",
    fen: "4k3/8/3q4/8/4N3/8/8/4K3 w - - 0 1",
    solution: "e4f6",
    success: "Brilliant! The royal fork wins the Queen."
  },
  {
    id: 3,
    title: "Pawn Promotion",
    description: "White to play: push the passed pawn to promote it to a Queen.",
    fen: "8/4P3/k7/8/8/8/8/4K3 w - - 0 1",
    solution: "e7e8q",
    success: "Promoted! The pawn reaches the end of the board."
  }
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameResponse[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(1);
  const [remainingLessons, setRemainingLessons] = useState<LessonResponse[]>([]);
  const [nextLesson, setNextLesson] = useState<LessonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Play vs Computer Modal states
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [gameMode, setGameMode] = useState<'classic' | 'blitz' | 'rapid' | 'bullet'>('rapid');

  // Daily puzzle state
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [puzzleGame, setPuzzleGame] = useState(() => new Chess(DAILY_PUZZLES[0].fen));
  const [puzzleBoardFen, setPuzzleBoardFen] = useState(() => puzzleGame.fen());
  const [puzzleStatus, setPuzzleStatus] = useState<string>('Find the winning move.');
  const [puzzleStatusType, setPuzzleStatusType] = useState<'info' | 'success' | 'error'>('info');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [gamesData, progressData] = await Promise.all([
          gameService.getGames(),
          lessonService.getProgress()
        ]);
        setGames(gamesData);
        setCompletedCount(progressData.completedCount);
        setStreak(progressData.streak);
        setRemainingLessons(progressData.remainingLessons);

        if (progressData.remainingLessons.length > 0) {
          setNextLesson(progressData.remainingLessons[0]);
        } else {
          setNextLesson(null);
        }

        // Initialize solved puzzles from localStorage today
        const todayStr = new Date().toDateString();
        const stored = JSON.parse(localStorage.getItem('solved_puzzles_data') || '{}');
        if (stored.date === todayStr) {
          setSolvedCount(stored.count || 0);
          // Advance to the unsolved puzzle index
          const nextIdx = Math.min(stored.count || 0, DAILY_PUZZLES.length - 1);
          setPuzzleIndex(nextIdx);
          const pGame = new Chess(DAILY_PUZZLES[nextIdx].fen);
          setPuzzleGame(pGame);
          setPuzzleBoardFen(pGame.fen());
        } else {
          // Clear daily cache
          localStorage.removeItem('solved_puzzles_data');
          setSolvedCount(0);
          setPuzzleIndex(0);
          const pGame = new Chess(DAILY_PUZZLES[0].fen);
          setPuzzleGame(pGame);
          setPuzzleBoardFen(pGame.fen());
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

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

  // Puzzle Move Checker
  const handlePuzzleMove = (sourceSquare: string, targetSquare: string) => {
    if (solvedCount >= DAILY_PUZZLES.length || puzzleIndex >= DAILY_PUZZLES.length) return false;

    try {
      const activePuzzle = DAILY_PUZZLES[puzzleIndex];
      const uciMove = (sourceSquare + targetSquare).toLowerCase();
      const expectedMove = activePuzzle.solution;
      
      const isPromoMove = expectedMove.length === 5;
      const moveOptions = {
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromoMove ? expectedMove.charAt(4) : 'q'
      };

      const gameCopy = new Chess(puzzleGame.fen());
      const move = gameCopy.move(moveOptions);

      if (move) {
        if (uciMove === expectedMove || uciMove + (isPromoMove ? expectedMove.charAt(4) : '') === expectedMove) {
          puzzleGame.move(moveOptions);
          setPuzzleBoardFen(puzzleGame.fen());
          setPuzzleStatus(activePuzzle.success);
          setPuzzleStatusType('success');

          // Increment solved count & persist in localStorage
          const newSolvedCount = solvedCount + 1;
          setSolvedCount(newSolvedCount);
          
          const todayStr = new Date().toDateString();
          localStorage.setItem('solved_puzzles_data', JSON.stringify({
            date: todayStr,
            count: newSolvedCount
          }));

          // Trigger next puzzle transition after a short delay
          if (newSolvedCount < DAILY_PUZZLES.length) {
            setTimeout(() => {
              const nextIdx = puzzleIndex + 1;
              setPuzzleIndex(nextIdx);
              const pGame = new Chess(DAILY_PUZZLES[nextIdx].fen);
              setPuzzleGame(pGame);
              setPuzzleBoardFen(pGame.fen());
              setPuzzleStatus('Find the winning move.');
              setPuzzleStatusType('info');
            }, 1500);
          } else {
            setPuzzleStatus("Congratulations! All daily coach puzzles solved!");
          }
          return true;
        } else {
          setPuzzleStatus("Incorrect move. Try another tactic!");
          setPuzzleStatusType('error');
          return false;
        }
      }
    } catch (e) {
      setPuzzleStatus("Illegal move. Try again.");
      setPuzzleStatusType('error');
    }
    return false;
  };

  const handleResetPuzzle = () => {
    if (puzzleIndex < DAILY_PUZZLES.length) {
      const pGame = new Chess(DAILY_PUZZLES[puzzleIndex].fen);
      setPuzzleGame(pGame);
      setPuzzleBoardFen(pGame.fen());
      setPuzzleStatus('Find the winning move.');
      setPuzzleStatusType('info');
    }
  };

  // Gamification & Daily Goals calculations
  const stats = calculateGamificationStats(completedCount, games.length, streak);
  const dailyGoals = getDailyGoalsStatus(games, remainingLessons, solvedCount);
  const allGoalsCompleted = dailyGoals.lessonCompleted && dailyGoals.gamesPlayed && dailyGoals.puzzlesSolved;

  return (
    <Layout>
      <div className="space-y-12 animate-fade-in text-left">
        
        {/* Greetings Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
              {getGreeting()}, {displayName}
            </h1>
            <p className="text-zinc-400 text-sm font-light">
              Here is your focus coordinate for today. Let's sharpen your tactical vision.
            </p>
          </div>

          {/* Coach Profile Card (XP / Level) */}
          <div className="w-full md:w-80 bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-16 w-16 bg-brand-accent/5 rounded-full filter blur-xl pointer-events-none" />
            <div className="h-12 w-12 rounded-xl bg-brand-accent/10 border border-brand-accent/15 flex items-center justify-center text-brand-accent shrink-0">
              <Award className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-zinc-350">Level {stats.level}</span>
                <span className="text-brand-accent">{stats.totalXp} XP</span>
              </div>
              <div className="w-full bg-zinc-900 border border-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-accent h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${stats.xpProgressPercentage}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-550 block font-semibold truncate uppercase">
                {stats.xpRequiredForNextLevel - stats.xpInCurrentLevel} XP to Level {stats.level + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Goals Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Goal Progress checklist */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-950/30 border border-white/5 flex flex-col md:flex-row items-center gap-8 shadow-lg relative overflow-hidden">
            {allGoalsCompleted && (
              <div className="absolute inset-0 bg-emerald-500/[0.02] border border-emerald-500/10 rounded-3xl pointer-events-none" />
            )}
            
            {/* Circular Progress Ring */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle 
                  cx="56" 
                  cy="56" 
                  r="45" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  className="text-zinc-900"
                  fill="transparent" 
                />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="45" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  className={`transition-all duration-500 ease-out ${allGoalsCompleted ? 'text-emerald-400' : 'text-brand-accent'}`}
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 * (1 - dailyGoals.progressPercentage / 100)}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-display text-white">
                  {Math.round(dailyGoals.progressPercentage / 33.3)}
                </span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                  of 3 goals
                </span>
              </div>
            </div>

            {/* Goals details */}
            <div className="flex-1 space-y-4 text-left w-full">
              <div>
                <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-brand-accent" strokeWidth={1.5} />
                  Today's Coach Goal
                </h3>
                <p className="text-zinc-500 text-xs font-light mt-0.5">Solve daily exercises and practice to build muscle memory.</p>
              </div>

              <div className="space-y-2.5">
                {/* Goal 1 */}
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    dailyGoals.lessonCompleted 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                      : 'border-white/10 bg-white/[0.01]'
                  }`}>
                    {dailyGoals.lessonCompleted && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  </div>
                  <div>
                    <span className={`text-xs font-semibold block ${dailyGoals.lessonCompleted ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>
                      Complete 1 Chess Lesson
                    </span>
                    <span className="text-[9px] text-zinc-550 block font-light">Visit the Academy and complete a new module.</span>
                  </div>
                </div>

                {/* Goal 2 */}
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    dailyGoals.puzzlesSolved 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                      : 'border-white/10 bg-white/[0.01]'
                  }`}>
                    {dailyGoals.puzzlesSolved && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold block ${dailyGoals.puzzlesSolved ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>
                      Solve 3 Tactical Exercises ({solvedCount}/3)
                    </span>
                    <span className="text-[9px] text-zinc-550 block font-light">Challenge yourself in the daily chess board widget.</span>
                  </div>
                </div>

                {/* Goal 3 */}
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    dailyGoals.gamesPlayed 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                      : 'border-white/10 bg-white/[0.01]'
                  }`}>
                    {dailyGoals.gamesPlayed && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  </div>
                  <div>
                    <span className={`text-xs font-semibold block ${dailyGoals.gamesPlayed ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>
                      Play 1 Practice Match
                    </span>
                    <span className="text-[9px] text-zinc-550 block font-light">Play against the local board or challenge Stockfish.</span>
                  </div>
                </div>
              </div>

              {allGoalsCompleted && (
                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 animate-pulse">
                  <Sparkles className="w-4 h-4 fill-emerald-400" />
                  All Daily Goals Completed! +150 XP
                </div>
              )}
            </div>
          </div>

          {/* Daily Puzzle Widget */}
          <div className="p-6 rounded-3xl bg-zinc-950/30 border border-white/5 flex flex-col justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Daily Tactical Focus</span>
                <span className="text-[8px] font-extrabold text-brand-accent uppercase tracking-widest bg-brand-accent/10 px-2 py-0.5 rounded-full border border-brand-accent/15">
                  Puzzle {Math.min(solvedCount + 1, DAILY_PUZZLES.length)} / {DAILY_PUZZLES.length}
                </span>
              </div>
              <h4 className="text-sm font-bold text-zinc-200 font-display truncate">
                {solvedCount >= DAILY_PUZZLES.length ? "Solved!" : DAILY_PUZZLES[puzzleIndex].title}
              </h4>
              <p className="text-zinc-500 text-[10px] font-light leading-snug h-8 overflow-hidden">
                {solvedCount >= DAILY_PUZZLES.length 
                  ? "You have completed all coach puzzles today. Keep up the streak!" 
                  : DAILY_PUZZLES[puzzleIndex].description}
              </p>
            </div>

            {/* Mini Chessboard */}
            <div className="flex justify-center my-1.5">
              <div className="w-56 h-56 rounded-lg overflow-hidden border border-white/10 bg-zinc-950 p-1">
                <Chessboard 
                  options={{
                    position: puzzleBoardFen,
                    onPieceDrop: ({ sourceSquare, targetSquare }) => {
                      if (targetSquare) {
                        return handlePuzzleMove(sourceSquare, targetSquare);
                      }
                      return false;
                    },
                    darkSquareStyle: { backgroundColor: '#2e2e33' },
                    lightSquareStyle: { backgroundColor: '#e4e4e7' }
                  }}
                />
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between">
              <span className={`text-[10px] font-semibold truncate max-w-[70%] ${
                puzzleStatusType === 'success' 
                  ? 'text-emerald-400' 
                  : puzzleStatusType === 'error' 
                    ? 'text-red-400' 
                    : 'text-zinc-400'
              }`}>
                {puzzleStatus}
              </span>
              {solvedCount < DAILY_PUZZLES.length && (
                <button 
                  onClick={handleResetPuzzle}
                  className="text-zinc-500 hover:text-zinc-350 p-1 rounded hover:bg-white/5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="h-[1px] bg-white/5 w-full" />

        {/* Continue Learning & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Continue Learning card */}
          <div className="space-y-4">
            <h2 className="text-xs uppercase font-bold tracking-widest text-zinc-500">
              Continue Learning
            </h2>
            {isLoading ? (
              <div className="h-44 rounded-2xl bg-zinc-900/10 border border-white/5 animate-pulse" />
            ) : nextLesson ? (
              <div 
                className="p-6 rounded-2xl bg-zinc-950/20 border border-brand-accent/15 hover:border-brand-accent/30 cursor-pointer group flex flex-col justify-between h-44 transition-all duration-300 relative overflow-hidden"
                onClick={() => navigate(`/academy/${nextLesson.slug}`)}
              >
                <div className="absolute right-0 top-0 h-28 w-28 bg-brand-accent/5 rounded-full filter blur-2xl pointer-events-none" />
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                      {nextLesson.category}
                    </span>
                    <span className="flex items-center gap-0.5 text-[9px] text-zinc-500">
                      <Clock className="w-3 h-3" />
                      {nextLesson.estimatedMinutes} min
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-lg text-zinc-200 group-hover:text-white transition-colors">
                    {nextLesson.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-light leading-relaxed line-clamp-2">
                    {nextLesson.shortDescription}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 text-[10px] font-bold uppercase tracking-wider text-brand-accent">
                  <span>Resume Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                </div>
              </div>
            ) : (
              <div className="h-44 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <BookOpen className="w-6 h-6 text-zinc-650 mb-2" strokeWidth={1.5} />
                <p className="text-xs font-semibold">Curriculum Complete!</p>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-xs leading-relaxed">
                  Congratulations, you have completed all lessons. Keep practice-playing or test new variations!
                </p>
              </div>
            )}
          </div>

          {/* Quick Play Actions */}
          <div className="space-y-4">
            <h2 className="text-xs uppercase font-bold tracking-widest text-zinc-500">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4 h-44">
              <div 
                onClick={() => navigate('/play?gameMode=SELF')}
                className="p-5 border border-white/5 bg-zinc-950/20 hover:border-white/10 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between text-left group"
              >
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-550 font-bold uppercase tracking-widest block">Sandbox Board</span>
                  <h4 className="text-sm font-semibold text-zinc-200">Local Match</h4>
                  <p className="text-[10px] text-zinc-500 font-light mt-0.5 leading-snug">Practice opening coordinates and analyze structures locally.</p>
                </div>
                <span className="text-[10px] text-brand-accent font-semibold tracking-wider flex items-center gap-1 group-hover:text-brand-accent/80 transition-colors">
                  Play Chess <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                </span>
              </div>

              <div 
                onClick={() => setIsSetupModalOpen(true)}
                className="p-5 border border-white/5 bg-zinc-950/20 hover:border-white/10 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between text-left group"
              >
                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-550 font-bold uppercase tracking-widest block">AI Challenge</span>
                  <h4 className="text-sm font-semibold text-zinc-200">Play vs Computer</h4>
                  <p className="text-[10px] text-zinc-500 font-light mt-0.5 leading-snug">Challenge Stockfish with customized ELO difficulties.</p>
                </div>
                <span className="text-[10px] text-brand-accent font-semibold tracking-wider flex items-center gap-1 group-hover:text-brand-accent/80 transition-colors">
                  Play Engine <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="h-[1px] bg-white/5 w-full" />

        {/* Recent Matches */}
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
                          ? 'bg-brand-accent/10 border-brand-accent text-brand-accent font-bold'
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
                          ? 'bg-brand-accent/10 border-brand-accent text-brand-accent font-bold'
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
                          ? 'bg-brand-accent/10 border-brand-accent text-brand-accent font-bold'
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
