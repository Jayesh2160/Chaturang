import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { gameService } from '../services/gameService';
import type { GameResponse } from '../services/gameService';
import { 
  Calendar, 
  Trash2, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Clock,
  User,
  Info
} from 'lucide-react';

export const MyGames: React.FC = () => {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Replay state
  const [selectedGame, setSelectedGame] = useState<GameResponse | null>(null);
  const [replayMoves, setReplayMoves] = useState<any[]>([]);
  const [activeMoveIndex, setActiveMoveIndex] = useState(0);

  // Fetch games on load
  const fetchGames = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await gameService.getGames();
      setGames(data);
    } catch (err: any) {
      setErrorMsg('Failed to load your games. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Set up moves when a game is selected for replay
  useEffect(() => {
    if (selectedGame) {
      const tempGame = new Chess();
      try {
        tempGame.loadPgn(selectedGame.pgn);
        setReplayMoves(tempGame.history({ verbose: true }));
        setActiveMoveIndex(0); // Start at initial layout
      } catch (err) {
        console.error('Error loading PGN:', err);
        setReplayMoves([]);
      }
    } else {
      setReplayMoves([]);
      setActiveMoveIndex(0);
    }
  }, [selectedGame]);

  // Compute FEN for active position
  const getActiveFen = () => {
    const tempGame = new Chess();
    for (let i = 0; i < activeMoveIndex; i++) {
      try {
        tempGame.move(replayMoves[i]);
      } catch (err) {
        break;
      }
    }
    return tempGame.fen();
  };

  // Delete a game
  const handleDeleteGame = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this game permanently?')) {
      try {
        await gameService.deleteGame(id);
        setGames(prev => prev.filter(g => g.id !== id));
        if (selectedGame?.id === id) {
          setSelectedGame(null);
        }
      } catch (err) {
        alert('Failed to delete game.');
      }
    }
  };

  // Format Result helper
  const formatResult = (res: string) => {
    switch (res) {
      case 'WHITE_WIN': return 'White Wins (1-0)';
      case 'BLACK_WIN': return 'Black Wins (0-1)';
      case 'DRAW': return 'Draw (1/2-1/2)';
      case 'ABANDONED': return 'Resigned / Abandoned';
      default: return res;
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render move log for Replay View
  const renderReplayMoveList = () => {
    const rows = [];
    for (let i = 0; i < replayMoves.length; i += 2) {
      rows.push({
        num: Math.floor(i / 2) + 1,
        white: replayMoves[i],
        whiteIndex: i + 1,
        black: replayMoves[i + 1] || null,
        blackIndex: i + 2,
      });
    }

    if (rows.length === 0) {
      return <div className="text-zinc-550 text-xs font-light text-center py-6">No moves recorded.</div>;
    }

    return (
      <div className="overflow-y-auto max-h-[340px] border border-white/5 rounded-xl bg-zinc-950/40 p-2 text-left font-mono">
        <div className="grid grid-cols-12 gap-1 text-zinc-500 text-[10px] font-bold px-2 py-1 uppercase tracking-wider border-b border-white/5 mb-2">
          <div className="col-span-2 text-center">#</div>
          <div className="col-span-5">White</div>
          <div className="col-span-5">Black</div>
        </div>
        <div className="space-y-0.5">
          {rows.map((row) => (
            <div key={row.num} className="grid grid-cols-12 gap-1 text-xs py-1 px-2 rounded hover:bg-white/[0.01] transition-colors">
              <div className="col-span-2 text-zinc-600 text-center font-sans font-semibold border-r border-white/5">
                {row.num}
              </div>
              <div 
                className={`col-span-5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeMoveIndex === row.whiteIndex 
                    ? 'bg-white/10 text-white font-bold' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveMoveIndex(row.whiteIndex)}
              >
                {row.white.san}
              </div>
              <div className="col-span-5">
                {row.black && (
                  <div 
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      activeMoveIndex === row.blackIndex 
                        ? 'bg-white/10 text-white font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setActiveMoveIndex(row.blackIndex)}
                  >
                    {row.black.san}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      {selectedGame ? (
        /* ==================== REPLAY VIEW ==================== */
        <div className="space-y-12 animate-fade-in text-left">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/5 pb-6">
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGame(null)}
                className="w-fit flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors px-0"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                Back to Game History
              </Button>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display text-white tracking-tight">
                  Replaying vs {selectedGame.opponentName}
                </h2>
                <p className="text-xs text-zinc-500 flex items-center gap-1 font-light">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {formatDate(selectedGame.createdAt)} • {formatResult(selectedGame.result)}
                </p>
              </div>
            </div>
          </div>

          {/* Grid Layout - Video Analyzer Feel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Chessboard & Sliders (Left - Col Span 7) */}
            <div className="lg:col-span-7 flex flex-col gap-6 items-center">
              {/* Opponent tag */}
              <div className="w-full max-w-[480px] flex justify-between items-center bg-zinc-950/40 border border-white/5 px-4 py-2 rounded-xl text-xs">
                <span className="flex items-center gap-2 text-zinc-400 font-medium">
                  <User className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                  {selectedGame.playerColor === 'WHITE' ? selectedGame.opponentName : 'You'}
                </span>
                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest">{selectedGame.playerColor === 'WHITE' ? 'Black' : 'White'}</span>
              </div>

              {/* Interactive Board container */}
              <div className="w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 p-2">
                <Chessboard
                  options={{
                    position: getActiveFen(),
                    boardOrientation: selectedGame.playerColor.toLowerCase() as 'white' | 'black',
                    allowDragging: false, // Disable dragging in replay
                    darkSquareStyle: { backgroundColor: '#2e2e33' },
                    lightSquareStyle: { backgroundColor: '#e4e4e7' }
                  }}
                />
              </div>

              {/* User tag */}
              <div className="w-full max-w-[480px] flex justify-between items-center bg-zinc-950/40 border border-white/5 px-4 py-2 rounded-xl text-xs">
                <span className="flex items-center gap-2 text-zinc-400 font-medium">
                  <User className="w-3.5 h-3.5 text-zinc-300" strokeWidth={1.5} />
                  {selectedGame.playerColor === 'WHITE' ? 'You' : selectedGame.opponentName}
                </span>
                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest">{selectedGame.playerColor === 'WHITE' ? 'White' : 'Black'}</span>
              </div>

              {/* Slider and Replay Buttons - Apple style slider */}
              <div className="w-full max-w-[480px] space-y-6 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold font-mono text-zinc-600">0</span>
                  <input
                    type="range"
                    min="0"
                    max={replayMoves.length}
                    value={activeMoveIndex}
                    onChange={(e) => setActiveMoveIndex(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-zinc-900 border border-white/5 rounded-full appearance-none cursor-pointer accent-white"
                  />
                  <span className="text-[10px] font-bold font-mono text-zinc-650">{replayMoves.length}</span>
                </div>

                <div className="flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    className="p-2 h-9 w-9 rounded-full border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center"
                    disabled={activeMoveIndex === 0}
                    onClick={() => setActiveMoveIndex(0)}
                  >
                    <ChevronsLeft className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                  <Button
                    variant="outline"
                    className="p-2 h-9 w-9 rounded-full border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center"
                    disabled={activeMoveIndex === 0}
                    onClick={() => setActiveMoveIndex(prev => Math.max(0, prev - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                  
                  <span className="px-4 font-mono text-xs text-zinc-400 font-semibold">
                    Ply {activeMoveIndex} / {replayMoves.length}
                  </span>

                  <Button
                    variant="outline"
                    className="p-2 h-9 w-9 rounded-full border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center"
                    disabled={activeMoveIndex === replayMoves.length}
                    onClick={() => setActiveMoveIndex(prev => Math.min(replayMoves.length, prev + 1))}
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                  <Button
                    variant="outline"
                    className="p-2 h-9 w-9 rounded-full border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center"
                    disabled={activeMoveIndex === replayMoves.length}
                    onClick={() => setActiveMoveIndex(replayMoves.length)}
                  >
                    <ChevronsRight className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Replay Details & Move Logs (Right - Col Span 5) */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-zinc-950/20 border-white/5 p-5 space-y-4 rounded-2xl shadow-lg">
                <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-2">
                  <Info className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                  Match Details
                </h3>
                
                <div className="space-y-3 text-xs font-semibold text-zinc-500">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Opponent:</span>
                    <span className="text-zinc-200">{selectedGame.opponentName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Color:</span>
                    <span className="text-zinc-200 uppercase">{selectedGame.playerColor}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Result:</span>
                    <span className="text-zinc-200">{formatResult(selectedGame.result)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Moves Count:</span>
                    <span className="text-zinc-200">{selectedGame.moveCount} moves</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Recorded:</span>
                    <span className="text-zinc-200">{formatDate(selectedGame.createdAt)}</span>
                  </div>
                </div>
              </Card>

              {/* Move history list */}
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-sm text-zinc-200">Move Sequence</h3>
                {renderReplayMoveList()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== LIST VIEW ==================== */
        <div className="space-y-8 animate-fade-in text-left">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">
                Match History
              </h1>
              <p className="text-zinc-400 text-xs font-light">
                Study and audit your complete chess logs, play coordinate replays, or delete obsolete records.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/5 border border-red-500/10 text-red-400 text-xs px-4 py-3 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            /* Loading skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="h-36 rounded-2xl border border-white/5 bg-zinc-900/10 animate-pulse" />
              ))}
            </div>
          ) : games.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-2xl text-center space-y-4">
              <div className="p-3 bg-zinc-950/80 rounded-full border border-white/5 text-zinc-650">
                <Calendar className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-semibold text-zinc-300 text-sm">No recorded games</h3>
                <p className="text-zinc-500 text-xs font-light leading-relaxed">
                  You haven't logged any matches yet. Click "Play Chess" in the actions menu to save your first game.
                </p>
              </div>
            </div>
          ) : (
            /* Games Grid List */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {games.map((game) => (
                <div 
                  key={game.id} 
                  className="flex flex-col justify-between p-6 border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 rounded-2xl cursor-pointer transition-all duration-300 group"
                  onClick={() => setSelectedGame(game)}
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] border border-white/5 text-zinc-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                          As {game.playerColor}
                        </span>
                        <h4 className="font-bold text-base text-zinc-200 font-display mt-2 flex items-center gap-1.5 group-hover:text-white transition-colors">
                          vs {game.opponentName}
                        </h4>
                      </div>
                      
                      {/* Delete icon */}
                      <button 
                        onClick={(e) => handleDeleteGame(game.id, e)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Result badge */}
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        game.result.includes('WHITE_WIN') && game.playerColor === 'WHITE' || 
                        game.result.includes('BLACK_WIN') && game.playerColor === 'BLACK' 
                          ? 'bg-emerald-500' 
                          : game.result === 'DRAW' 
                            ? 'bg-zinc-500' 
                            : 'bg-zinc-700'
                      }`} />
                      <span className="text-zinc-400 font-light">{formatResult(game.result)}</span>
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-6 text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {game.moveCount} moves
                    </span>
                    <span className="font-semibold text-zinc-500">
                      {formatDate(game.createdAt).split(',')[0]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};
