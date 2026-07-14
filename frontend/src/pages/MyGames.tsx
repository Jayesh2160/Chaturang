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
      return <div className="text-zinc-500 text-sm">No moves recorded in this match.</div>;
    }

    return (
      <div className="overflow-y-auto max-h-[340px] border border-zinc-800/60 rounded-lg bg-zinc-950/40 p-2 text-left font-mono">
        <div className="grid grid-cols-12 gap-1 text-zinc-500 text-xs font-semibold px-2 py-1 uppercase tracking-wider border-b border-zinc-900/60 mb-2">
          <div className="col-span-2 text-center">#</div>
          <div className="col-span-5">White</div>
          <div className="col-span-5">Black</div>
        </div>
        <div className="space-y-1">
          {rows.map((row) => (
            <div key={row.num} className="grid grid-cols-12 gap-1 text-sm py-1.5 px-2 rounded hover:bg-zinc-800/10 transition-colors">
              <div className="col-span-2 text-zinc-600 text-center font-sans font-semibold border-r border-zinc-900/40">
                {row.num}
              </div>
              <div 
                className={`col-span-5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeMoveIndex === row.whiteIndex 
                    ? 'bg-violet-600/30 text-violet-300 font-bold border border-violet-500/20' 
                    : 'text-zinc-300 hover:bg-zinc-850 hover:text-white'
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
                        ? 'bg-violet-600/30 text-violet-300 font-bold border border-violet-500/20' 
                        : 'text-zinc-300 hover:bg-zinc-850 hover:text-white'
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900/80 pb-4 text-left">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedGame(null)}
              className="w-fit flex items-center gap-1.5 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Game History
            </Button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold font-display text-zinc-200">
                Replaying match against <span className="text-gradient">{selectedGame.opponentName}</span>
              </h2>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(selectedGame.createdAt)} • {formatResult(selectedGame.result)}
              </p>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Chessboard (Left) */}
            <div className="lg:col-span-7 flex flex-col gap-4 items-center">
              {/* Opponent tag */}
              <div className="w-full max-w-[480px] flex justify-between items-center bg-zinc-900/40 border border-zinc-800/40 px-3.5 py-2 rounded-lg text-sm">
                <span className="flex items-center gap-2 text-zinc-400 font-medium">
                  <User className="w-4 h-4" />
                  {selectedGame.playerColor === 'WHITE' ? selectedGame.opponentName : 'You'}
                </span>
                <span className="text-xs font-semibold text-zinc-500">{selectedGame.playerColor === 'WHITE' ? 'Black' : 'White'}</span>
              </div>

              {/* Interactive Board container */}
              <div className="w-full max-w-[480px] aspect-square rounded-xl overflow-hidden border-2 border-zinc-800 shadow-2xl">
                <Chessboard
                  options={{
                    position: getActiveFen(),
                    boardOrientation: selectedGame.playerColor.toLowerCase() as 'white' | 'black',
                    allowDragging: false, // Disable dragging in replay
                    darkSquareStyle: { backgroundColor: '#706677' },
                    lightSquareStyle: { backgroundColor: '#ded6e0' },
                  }}
                />
              </div>

              {/* User tag */}
              <div className="w-full max-w-[480px] flex justify-between items-center bg-zinc-900/40 border border-zinc-800/40 px-3.5 py-2 rounded-lg text-sm">
                <span className="flex items-center gap-2 text-zinc-400 font-medium">
                  <User className="w-4 h-4" />
                  {selectedGame.playerColor === 'WHITE' ? 'You' : selectedGame.opponentName}
                </span>
                <span className="text-xs font-semibold text-zinc-500">{selectedGame.playerColor === 'WHITE' ? 'White' : 'Black'}</span>
              </div>

              {/* Slider and Replay Buttons */}
              <div className="w-full max-w-[480px] space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-500">0</span>
                  <input
                    type="range"
                    min="0"
                    max={replayMoves.length}
                    value={activeMoveIndex}
                    onChange={(e) => setActiveMoveIndex(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <span className="text-xs font-mono text-zinc-500">{replayMoves.length}</span>
                </div>

                <div className="flex justify-center items-center gap-1.5">
                  <Button
                    variant="outline"
                    className="p-2 border-zinc-800 hover:bg-zinc-800/40 text-zinc-400 hover:text-white"
                    disabled={activeMoveIndex === 0}
                    onClick={() => setActiveMoveIndex(0)}
                  >
                    <ChevronsLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="p-2 border-zinc-800 hover:bg-zinc-800/40 text-zinc-400 hover:text-white"
                    disabled={activeMoveIndex === 0}
                    onClick={() => setActiveMoveIndex(prev => Math.max(0, prev - 1))}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <span className="px-4 font-mono text-sm text-zinc-300 font-semibold">
                    Move {activeMoveIndex} / {replayMoves.length}
                  </span>

                  <Button
                    variant="outline"
                    className="p-2 border-zinc-800 hover:bg-zinc-800/40 text-zinc-400 hover:text-white"
                    disabled={activeMoveIndex === replayMoves.length}
                    onClick={() => setActiveMoveIndex(prev => Math.min(replayMoves.length, prev + 1))}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="p-2 border-zinc-800 hover:bg-zinc-800/40 text-zinc-400 hover:text-white"
                    disabled={activeMoveIndex === replayMoves.length}
                    onClick={() => setActiveMoveIndex(replayMoves.length)}
                  >
                    <ChevronsRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Replay Details Panel (Right) */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <Card className="bg-zinc-900/40 border-zinc-800 p-5 space-y-4">
                <h3 className="font-display font-bold text-lg text-zinc-100 flex items-center gap-2">
                  <Info className="w-4 h-4 text-violet-400" />
                  Match Details
                </h3>
                
                <div className="bg-zinc-950/60 border border-zinc-800/40 rounded-lg p-4 text-sm divide-y divide-zinc-900/60 font-medium text-zinc-400">
                  <div className="flex justify-between py-2.5">
                    <span>Opponent:</span>
                    <span className="text-zinc-200">{selectedGame.opponentName}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span>Player Color:</span>
                    <span className="text-zinc-200 uppercase">{selectedGame.playerColor}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span>Result:</span>
                    <span className="text-zinc-200">{formatResult(selectedGame.result)}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span>Moves Played:</span>
                    <span className="text-zinc-200">{selectedGame.moveCount} full moves</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span>Recorded:</span>
                    <span className="text-zinc-200">{formatDate(selectedGame.createdAt)}</span>
                  </div>
                </div>
              </Card>

              {/* Move history list */}
              <Card className="bg-zinc-900/40 border-zinc-800 p-5 flex flex-col gap-4">
                <h3 className="font-display font-bold text-lg text-zinc-100">Moves List</h3>
                {renderReplayMoveList()}
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== LIST VIEW ==================== */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-extrabold font-display text-zinc-100 tracking-tight">
                My Games
              </h1>
              <p className="text-zinc-400 text-sm">
                View your complete saved game history, review moves, or delete records.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg font-semibold text-left">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            /* Loading skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="h-44 rounded-xl border border-zinc-850 bg-zinc-900/20 animate-pulse" />
              ))}
            </div>
          ) : games.length === 0 ? (
            /* Empty state */
            <Card className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 border-dashed border-zinc-800 text-center space-y-4">
              <div className="p-4 bg-zinc-900/80 rounded-full border border-zinc-800 text-zinc-500">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-bold text-zinc-200 text-lg">No Saved Games</h3>
                <p className="text-zinc-400 text-sm">
                  You haven't saved any chess matches yet. Play a match and record it to your profile.
                </p>
              </div>
            </Card>
          ) : (
            /* Games Grid List */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {games.map((game) => (
                <Card 
                  key={game.id} 
                  className="flex flex-col justify-between p-5 bg-zinc-900/40 border-zinc-800 hover:scale-[1.01] hover:bg-zinc-900/50 cursor-pointer text-left"
                  onClick={() => setSelectedGame(game)}
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] bg-zinc-800 border border-zinc-700/60 text-zinc-400 font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                          As {game.playerColor}
                        </span>
                        <h4 className="font-bold text-lg text-zinc-100 font-display mt-1.5 flex items-center gap-1.5">
                          vs {game.opponentName}
                        </h4>
                      </div>
                      
                      {/* Delete icon */}
                      <button 
                        onClick={(e) => handleDeleteGame(game.id, e)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {/* Result badge */}
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${
                        game.result.includes('WHITE_WIN') && game.playerColor === 'WHITE' || 
                        game.result.includes('BLACK_WIN') && game.playerColor === 'BLACK' 
                          ? 'bg-emerald-500' 
                          : game.result === 'DRAW' 
                            ? 'bg-sky-500' 
                            : 'bg-zinc-500'
                      }`} />
                      <span className="text-zinc-300">{formatResult(game.result)}</span>
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-900/60 mt-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {game.moveCount} moves
                    </span>
                    <span className="font-medium">
                      {formatDate(game.createdAt).split(',')[0]}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};
