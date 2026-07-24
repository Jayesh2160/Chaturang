import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { gameService } from '../services/gameService';
import { engineService } from '../services/engineService';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw, Save, ShieldAlert, Award, ArrowLeftRight, User } from 'lucide-react';



export const PlayGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameMode = (searchParams.get('gameMode') || 'SELF').toUpperCase() as 'SELF' | 'COMPUTER' | 'ONLINE' | 'ANALYSIS';
  const difficulty = (searchParams.get('difficulty') || 'MEDIUM').toUpperCase();
  const playerColor = (searchParams.get('color') || 'white') as 'white' | 'black';
  const initialMode = (searchParams.get('timeControl') || 'rapid') as 'classic' | 'blitz' | 'rapid' | 'bullet';

  const getInitialSeconds = (mode: string) => {
    switch (mode) {
      case 'classic': return 240 * 60; // 4 hours
      case 'blitz': return 3 * 60;
      case 'bullet': return 1 * 60;
      case 'rapid':
      default:
        return 10 * 60;
    }
  };

  const [game, setGame] = useState(() => new Chess());
  const [gameFen, setGameFen] = useState(game.fen());
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(playerColor);
  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});
  
  // Game state flags
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [isStalemate, setIsStalemate] = useState(false);
  const [turn, setTurn] = useState<'w' | 'b'>('w');

  // Computer states
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [evaluation, setEvaluation] = useState('0.00');

  // Timers/clocks
  const [whiteTime, setWhiteTime] = useState(() => getInitialSeconds(initialMode));
  const [blackTime, setBlackTime] = useState(() => getInitialSeconds(initialMode));
  const [timeoutWinner, setTimeoutWinner] = useState<'w' | 'b' | null>(null);
  
  // Save modal states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const getDifficultyElo = (diff: string) => {
    switch (diff) {
      case 'EASY': return '600';
      case 'MEDIUM': return '1200';
      case 'HARD': return '1800';
      default: return '1200';
    }
  };
  const [opponentName, setOpponentName] = useState(() => {
    if (gameMode === 'COMPUTER') {
      return `Stockfish (${getDifficultyElo(difficulty)})`;
    }
    return 'Computer';
  });
  const [customResult, setCustomResult] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');



  // Update flags on FEN changes
  useEffect(() => {
    setIsCheck(game.isCheck());
    setIsCheckmate(game.isCheckmate());
    setIsDraw(game.isDraw());
    setIsStalemate(game.isStalemate());
    setTurn(game.turn());
  }, [gameFen]);

  // Position evaluation trigger
  useEffect(() => {
    if (game.isGameOver() || timeoutWinner) return;
    
    const getEval = async () => {
      try {
        const res = await engineService.evaluate({ fen: gameFen });
        setEvaluation(res.evaluation);
      } catch (err) {
        // Suppress eval errors silently
      }
    };
    getEval();
  }, [gameFen, timeoutWinner]);

  // Game loop ticking clock effect
  useEffect(() => {
    if (game.isGameOver() || timeoutWinner) return;

    const interval = setInterval(() => {
      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeoutWinner('b');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeoutWinner('w');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [turn, gameFen, timeoutWinner]);

  // Computer Move Effect
  useEffect(() => {
    if (gameMode !== 'COMPUTER' || game.isGameOver() || timeoutWinner || isComputerThinking) return;

    const currentTurn = game.turn();
    const userTurn = playerColor === 'white' ? 'w' : 'b';

    if (currentTurn !== userTurn) {
      const makeComputerMove = async () => {
        setIsComputerThinking(true);
        const startTime = Date.now();
        try {
          const res = await engineService.getBestMove({
            fen: gameFen,
            difficulty: difficulty as any
          });

          const bestMove = res.bestMove;
          const moveFrom = bestMove.slice(0, 2);
          const moveTo = bestMove.slice(2, 4);
          const movePromotion = bestMove.length > 4 ? bestMove.charAt(4) : undefined;

          // Natural thinking delay (at least 800ms)
          const elapsedTime = Date.now() - startTime;
          const delay = Math.max(800 - elapsedTime, 0);

          setTimeout(() => {
            // Highlight squares
            setSquareStyles({
              [moveFrom]: { backgroundColor: 'rgba(139, 92, 246, 0.4)' },
              [moveTo]: { backgroundColor: 'rgba(139, 92, 246, 0.4)' }
            });

            // Execute move
            makeAMove({
              from: moveFrom,
              to: moveTo,
              promotion: movePromotion
            });
            setIsComputerThinking(false);

            // Clear highlights after animation finishes
            setTimeout(() => {
              setSquareStyles({});
            }, 600);
          }, delay);
        } catch (err) {
          console.error('Computer move calculation failed:', err);
          setIsComputerThinking(false);
        }
      };

      makeComputerMove();
    }
  }, [gameFen, gameMode, playerColor, difficulty, timeoutWinner]);



  // Execute a move
  const makeAMove = (move: any) => {
    try {
      const result = game.move(move);
      setGameFen(game.fen());
      return result;
    } catch (error) {
      return null;
    }
  };

  // Drag and drop handler
  const onDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (isComputerThinking) return false;
    if (!targetSquare) return false;

    // In computer mode, ensure user only moves their own piece color
    if (gameMode === 'COMPUTER') {
      if (timeoutWinner) return false;
      const piece = game.get(sourceSquare as any);
      if (!piece) return false;
      const expectedColor = playerColor === 'white' ? 'w' : 'b';
      if (piece.color !== expectedColor) return false;
    }


    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // auto-promote to Queen for simplicity
    });

    // illegal move
    if (move === null) return false;
    return true;
  };


  // Reset board
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the current game? All current moves will be lost.')) {
      const newGame = new Chess();
      setGame(newGame);
      setGameFen(newGame.fen());
      setIsComputerThinking(false);
      setSquareStyles({});
      setEvaluation('0.00');
      setWhiteTime(getInitialSeconds(initialMode));
      setBlackTime(getInitialSeconds(initialMode));
      setTimeoutWinner(null);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };


  // Toggle board orientation
  const handleToggleOrientation = () => {
    setBoardOrientation(prev => (prev === 'white' ? 'black' : 'white'));
  };

  // Determine game result automatically
  const getAutoResult = () => {
    if (timeoutWinner) {
      return timeoutWinner === 'w' ? 'WHITE_WIN' : 'BLACK_WIN';
    }
    if (isCheckmate) {
      return turn === 'w' ? 'BLACK_WIN' : 'WHITE_WIN';
    }
    if (isDraw || isStalemate) {
      return 'DRAW';
    }
    return 'IN_PROGRESS';
  };


  // Open save modal
  const handleOpenSaveModal = () => {
    const autoRes = getAutoResult();
    setCustomResult(autoRes);
    setIsSaveModalOpen(true);
  };

  // Handle Save Game submission
  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponentName.trim()) {
      setErrorMsg('Opponent name is required');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const finalResult = customResult === 'IN_PROGRESS' ? 'ABANDONED' : customResult;
      const history = game.history();
      const moveCount = Math.ceil(history.length / 2);

      await gameService.saveGame({
        playerColor: boardOrientation.toUpperCase(),
        opponentName: opponentName,
        result: finalResult,
        moveCount: moveCount,
        pgn: game.pgn(),
        fen: game.fen(),
        gameMode: gameMode,
        difficulty: gameMode === 'COMPUTER' ? difficulty : undefined
      });


      setIsSaveModalOpen(false);
      navigate('/my-games');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save game. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format move history pairs
  const renderMoveHistory = () => {
    const history = game.history();
    const rows = [];
    for (let i = 0; i < history.length; i += 2) {
      rows.push({
        num: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1] || '',
      });
    }

    if (rows.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-550 text-xs border border-dashed border-white/5 rounded-xl bg-zinc-950/20 px-4">
          <p>No moves played.</p>
          <p className="text-[10px] text-zinc-650 mt-1">Move a piece to begin.</p>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-[380px] border border-white/5 rounded-xl bg-zinc-950/40 divide-y divide-white/5">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] text-zinc-500 bg-zinc-900/10 uppercase font-bold tracking-wider">
            <tr>
              <th className="px-3 py-2.5 w-10 text-center border-r border-white/5">#</th>
              <th className="px-3 py-2.5">White</th>
              <th className="px-3 py-2.5">Black</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-zinc-300">
            {rows.map((row) => (
              <tr key={row.num} className="hover:bg-white/[0.01] transition-colors">
                <td className="px-3 py-2 text-center text-zinc-500 font-sans font-semibold border-r border-white/5">
                  {row.num}
                </td>
                <td className="px-3 py-2 font-medium">{row.white}</td>
                <td className="px-3 py-2 font-medium">{row.black}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-12 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">
              {gameMode === 'COMPUTER' ? 'Play vs Computer' : 'Interactive Board'}
            </h1>
            <p className="text-zinc-400 text-xs font-light">
              {gameMode === 'COMPUTER'
                ? `Challenging Stockfish engine in ${initialMode.charAt(0).toUpperCase() + initialMode.slice(1)} mode (${difficulty === 'EASY' ? '600' : difficulty === 'MEDIUM' ? '1200' : '1800'} ELO). Good luck!`
                 : 'Practice coordinate systems, validate game rules, and record matches to profile logs.'}
            </p>

          </div>
        </div>

        {/* Play layout grid: 3 Columns on desktop (65%, 20%, 15%) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Column 1: Chessboard & Statuses (65%) */}
          <div className="w-full lg:w-[65%] flex flex-col gap-4 items-center">
            
            {/* Player tags - Minimalist */}
            <div className="w-full max-w-[500px] flex justify-between items-center bg-zinc-950/40 border border-white/5 px-4 py-2 rounded-xl text-xs">
              <span className="flex items-center gap-2 text-zinc-400 font-medium">
                {isComputerThinking ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                ) : (
                  <User className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                )}
                {gameMode === 'COMPUTER'
                  ? (boardOrientation === 'white' ? `Stockfish (${difficulty === 'EASY' ? '600' : difficulty === 'MEDIUM' ? '1200' : '1800'})` : 'You')
                  : (boardOrientation === 'white' ? 'Opponent (Black)' : 'You (Black)')}
              </span>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded border transition-all ${
                  boardOrientation === 'white' 
                    ? (turn === 'b' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-900 border-white/5 text-zinc-400')
                    : (turn === 'w' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-900 border-white/5 text-zinc-400')
                } ${
                  (boardOrientation === 'white' ? blackTime : whiteTime) < 30 ? 'animate-pulse text-red-500 border-red-500/30' : ''
                }`}>
                  {formatTime(boardOrientation === 'white' ? blackTime : whiteTime)}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {gameMode === 'COMPUTER'
                    ? (boardOrientation === 'white'
                      ? (difficulty === 'EASY' ? '600 ELO' : difficulty === 'MEDIUM' ? '1200 ELO' : '1800 ELO')
                      : 'Active')
                    : '1600 ELO'}
                </span>
              </div>
            </div>

            {/* Board Container */}
            <div className="w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
              <Chessboard
                options={{
                  position: gameFen,
                  onPieceDrop: onDrop,
                  boardOrientation: boardOrientation,
                  allowDragging: !isComputerThinking && !game.isGameOver() && !timeoutWinner,
                  darkSquareStyle: { backgroundColor: '#2e2e33' },
                  lightSquareStyle: { backgroundColor: '#e4e4e7' },
                  squareStyles: squareStyles,
                }}
              />
            </div>

            {/* User tag - Minimalist */}
            <div className="w-full max-w-[500px] flex justify-between items-center bg-zinc-950/40 border border-white/5 px-4 py-2 rounded-xl text-xs">
              <span className="flex items-center gap-2 text-zinc-400 font-medium">
                <User className="w-3.5 h-3.5 text-zinc-300" strokeWidth={1.5} />
                {gameMode === 'COMPUTER'
                  ? (boardOrientation === 'white' ? 'You' : `Stockfish (${difficulty === 'EASY' ? '600' : difficulty === 'MEDIUM' ? '1200' : '1800'})`)
                  : (boardOrientation === 'white' ? 'You (White)' : 'Opponent (White)')}
              </span>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded border transition-all ${
                  boardOrientation === 'white' 
                    ? (turn === 'w' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-900 border-white/5 text-zinc-400')
                    : (turn === 'b' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-900 border-white/5 text-zinc-400')
                } ${
                  (boardOrientation === 'white' ? whiteTime : blackTime) < 30 ? 'animate-pulse text-red-500 border-red-500/30' : ''
                }`}>
                  {formatTime(boardOrientation === 'white' ? whiteTime : blackTime)}
                </span>
                <span className="text-[10px] text-brand-accent font-bold uppercase tracking-widest">
                  {gameMode === 'COMPUTER'
                    ? (boardOrientation === 'white'
                      ? 'Active'
                      : (difficulty === 'EASY' ? '600 ELO' : difficulty === 'MEDIUM' ? '1200 ELO' : '1800 ELO'))
                    : 'Active'}
                </span>
              </div>
            </div>

            {/* Status alerts */}
            <div className="w-full max-w-[500px] space-y-2 text-left">
              {isComputerThinking && (
                <div className="flex items-center gap-2 bg-violet-500/5 border border-violet-500/10 text-violet-400 text-xs px-4 py-3 rounded-xl font-medium animate-pulse">
                  <span className="text-sm">♟️</span>
                  <span>Stockfish ({difficulty === 'EASY' ? '600' : difficulty === 'MEDIUM' ? '1200' : '1800'}) Thinking</span>
                  <span className="flex gap-1 items-center ml-1">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              )}
              {gameMode === 'COMPUTER' && !isComputerThinking && !game.isGameOver() && !timeoutWinner && (
                <div className="flex items-center justify-between bg-zinc-950/20 border border-white/5 text-zinc-400 text-xs px-4 py-2.5 rounded-xl font-medium">
                  <span>Engine Evaluation:</span>
                  <span className={`font-mono font-bold ${
                    evaluation.startsWith('+') ? 'text-emerald-450' : evaluation.startsWith('-') ? 'text-red-450' : 'text-zinc-300'
                  }`}>
                    {evaluation}
                  </span>
                </div>
              )}
              {timeoutWinner && (
                <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/10 text-red-450 text-xs px-4 py-3 rounded-xl font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>Game Over. {timeoutWinner === 'w' ? 'White' : 'Black'} lost on time.</span>
                </div>
              )}
              {isCheck && !isCheckmate && !timeoutWinner && (
                <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/10 text-amber-500 text-xs px-4 py-3 rounded-xl font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>Check! {turn === 'w' ? 'White' : 'Black'} king is under attack.</span>
                </div>
              )}
              {isCheckmate && !timeoutWinner && (
                <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs px-4 py-3 rounded-xl font-medium">
                  <Award className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>Checkmate. {turn === 'w' ? 'Black' : 'White'} wins the match.</span>
                </div>
              )}
              {isDraw && !timeoutWinner && (
                <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 text-zinc-400 text-xs px-4 py-3 rounded-xl font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>Draw. The match ended in a tie.</span>
                </div>
              )}
              {isStalemate && !timeoutWinner && (
                <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 text-zinc-400 text-xs px-4 py-3 rounded-xl font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>Stalemate. No legal moves remaining.</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Move History (20%) */}
          <div className="w-full lg:w-[20%] flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="font-display font-semibold text-sm text-zinc-200">Move Log</h3>
              <span className="text-[10px] bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-full font-mono text-zinc-500">
                {game.history().length} plies
              </span>
            </div>
            {renderMoveHistory()}
          </div>

          {/* Column 3: Control Panel (15%) */}
          <div className="w-full lg:w-[15%] flex flex-col gap-4 text-left">
            <h3 className="font-display font-semibold text-sm text-zinc-200 border-b border-white/5 pb-2">Controls</h3>
            
            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                onClick={handleToggleOrientation}
                disabled={isComputerThinking}
                className="w-full flex items-center gap-2 justify-center py-2 h-10 text-xs"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                Flip Board
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isComputerThinking}
                className="w-full flex items-center gap-2 justify-center py-2 h-10 text-xs text-zinc-400 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                Reset Board
              </Button>
              
              <Button
                variant="primary"
                onClick={handleOpenSaveModal}
                disabled={game.history().length === 0 || isComputerThinking}
                className="w-full flex items-center justify-center gap-2 py-2 h-10 text-xs"
              >
                <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                Save Match
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Save Game Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-sm bg-zinc-950 border-white/5 p-6 space-y-6 text-left shadow-2xl relative rounded-2xl">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Save Chess Match</h3>
              <p className="text-zinc-500 text-xs mt-1">
                Record your match coordinates and outcomes to history.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-450 text-xs px-3.5 py-2.5 rounded-lg font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveGame} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Opponent Name</label>
                <input
                  type="text"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 focus:border-brand-accent/50 focus:ring-4 focus:ring-brand-accent/10 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-zinc-200 transition-all duration-300"
                  placeholder="e.g. Computer, Friend"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Match Result</label>
                <select
                  value={customResult}
                  onChange={(e) => setCustomResult(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 focus:border-brand-accent/50 focus:ring-4 focus:ring-brand-accent/10 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-zinc-200 transition-all duration-300"
                >
                  <option value="WHITE_WIN">White Wins (1-0)</option>
                  <option value="BLACK_WIN">Black Wins (0-1)</option>
                  <option value="DRAW">Draw (1/2-1/2)</option>
                  <option value="IN_PROGRESS">Abandoned / In Progress</option>
                </select>
              </div>

              <div className="bg-zinc-950 border border-white/5 rounded-lg p-3 text-xs space-y-1.5 font-mono text-zinc-500">
                <div className="flex justify-between">
                  <span>Color:</span>
                  <span className="text-zinc-300 uppercase">{boardOrientation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Moves:</span>
                  <span className="text-zinc-300">{Math.ceil(game.history().length / 2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="flex-1 py-2"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2 bg-white text-zinc-950 hover:bg-zinc-200"
                  isLoading={isSaving}
                >
                  Confirm & Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Layout>
  );
};
