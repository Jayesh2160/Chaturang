import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { gameService } from '../services/gameService';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Save, ShieldAlert, Award, ArrowLeftRight, User } from 'lucide-react';

export const PlayGame: React.FC = () => {
  const navigate = useNavigate();
  const [game, setGame] = useState(() => new Chess());
  const [gameFen, setGameFen] = useState(game.fen());
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  
  // Game state flags
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [isDraw, setIsDraw] = useState(false);
  const [isStalemate, setIsStalemate] = useState(false);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  
  // Save modal states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [opponentName, setOpponentName] = useState('Computer');
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
    if (!targetSquare) return false;
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
    }
  };

  // Toggle board orientation
  const handleToggleOrientation = () => {
    setBoardOrientation(prev => (prev === 'white' ? 'black' : 'white'));
  };

  // Determine game result automatically
  const getAutoResult = () => {
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
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-sm border border-zinc-800/40 border-dashed rounded-lg bg-zinc-950/20 p-4">
          <p>No moves played yet.</p>
          <p className="text-xs text-zinc-600 mt-1">Drag a piece to start the game.</p>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-72 border border-zinc-800/60 rounded-lg bg-zinc-950/40 divide-y divide-zinc-900/60">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-900/40 uppercase font-semibold">
            <tr>
              <th className="px-4 py-2 w-16 text-center">#</th>
              <th className="px-4 py-2">White</th>
              <th className="px-4 py-2">Black</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/40 font-mono text-zinc-300">
            {rows.map((row) => (
              <tr key={row.num} className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-4 py-2 text-center text-zinc-500 font-sans font-semibold border-r border-zinc-900/40 bg-zinc-900/10">
                  {row.num}
                </td>
                <td className="px-4 py-2 font-medium">{row.white}</td>
                <td className="px-4 py-2 font-medium">{row.black}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold font-display text-zinc-100 tracking-tight">
              Interactive Chess Board
            </h1>
            <p className="text-zinc-400 text-sm">
              Practice moves, validate logic, and save your matches to history.
            </p>
          </div>
        </div>

        {/* Play layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Chessboard & Statuses */}
          <div className="lg:col-span-7 flex flex-col gap-4 items-center">
            {/* Player tags */}
            <div className="w-full max-w-[500px] flex justify-between items-center bg-zinc-900/50 border border-zinc-800/60 px-4 py-2.5 rounded-lg text-sm">
              <span className="flex items-center gap-2 text-zinc-300 font-semibold">
                <User className={`w-4 h-4 ${boardOrientation === 'white' ? 'text-zinc-500' : 'text-zinc-300'}`} />
                {boardOrientation === 'white' ? 'Opponent (Black)' : 'You (Black)'}
              </span>
              <span className="text-xs bg-zinc-800 text-zinc-400 font-medium px-2 py-0.5 rounded">1600 ELO</span>
            </div>

            {/* Board Container */}
            <div className="w-full max-w-[500px] aspect-square rounded-xl overflow-hidden border-2 border-zinc-800 shadow-2xl relative">
              <Chessboard
                options={{
                  position: gameFen,
                  onPieceDrop: onDrop,
                  boardOrientation: boardOrientation,
                  darkSquareStyle: { backgroundColor: '#706677' },
                  lightSquareStyle: { backgroundColor: '#ded6e0' },
                }}
              />
            </div>

            {/* User tag */}
            <div className="w-full max-w-[500px] flex justify-between items-center bg-zinc-900/50 border border-zinc-800/60 px-4 py-2.5 rounded-lg text-sm">
              <span className="flex items-center gap-2 text-zinc-300 font-semibold">
                <User className={`w-4 h-4 ${boardOrientation === 'white' ? 'text-zinc-300' : 'text-zinc-500'}`} />
                {boardOrientation === 'white' ? 'You (White)' : 'Opponent (White)'}
              </span>
              <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/20 font-medium px-2 py-0.5 rounded">Active</span>
            </div>

            {/* Status alerts */}
            <div className="w-full max-w-[500px] space-y-2">
              {isCheck && !isCheckmate && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-4 py-3 rounded-lg font-semibold text-left">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>Check! {turn === 'w' ? 'White' : 'Black'} is under attack.</span>
                </div>
              )}
              {isCheckmate && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg font-semibold text-left">
                  <Award className="w-5 h-5 shrink-0" />
                  <span>Checkmate! Game Over. {turn === 'w' ? 'Black' : 'White'} wins the game!</span>
                </div>
              )}
              {isDraw && (
                <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm px-4 py-3 rounded-lg font-semibold text-left">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>Draw! The game has ended in a tie.</span>
                </div>
              )}
              {isStalemate && (
                <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm px-4 py-3 rounded-lg font-semibold text-left">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>Stalemate! No legal moves. Game is drawn.</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Move history & Control Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6 text-left">
            {/* Control Panel Card */}
            <Card className="bg-zinc-900/40 border-zinc-800 p-5 space-y-4">
              <h3 className="font-display font-bold text-lg text-zinc-100">Controls</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleToggleOrientation}
                  className="flex items-center gap-2 justify-center py-2.5"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Flip Board
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="flex items-center gap-2 justify-center py-2.5 text-zinc-400 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Board
                </Button>
              </div>

              <Button
                variant="primary"
                onClick={handleOpenSaveModal}
                disabled={game.history().length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-tr from-violet-600 to-violet-500"
              >
                <Save className="w-4 h-4" />
                Save Match to Profile
              </Button>
            </Card>

            {/* Move History Card */}
            <Card className="bg-zinc-900/40 border-zinc-800 p-5 flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-zinc-100">Move History</h3>
                <span className="text-xs bg-zinc-800 border border-zinc-700/60 px-2 py-0.5 rounded font-mono text-zinc-400">
                  {game.history().length} plies
                </span>
              </div>
              {renderMoveHistory()}
            </Card>
          </div>
        </div>
      </div>

      {/* Save Game Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 p-6 space-y-6 text-left shadow-2xl relative">
            <div>
              <h3 className="font-display font-bold text-xl text-gradient">Save Chess Match</h3>
              <p className="text-zinc-400 text-xs mt-1">
                Record your game metrics and PGN to access later in history.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-lg font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveGame} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Opponent Name</label>
                <input
                  type="text"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-zinc-200"
                  placeholder="e.g. Computer, Local Player, Friend"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Match Result</label>
                <select
                  value={customResult}
                  onChange={(e) => setCustomResult(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-zinc-200"
                >
                  <option value="WHITE_WIN">White Wins (1-0)</option>
                  <option value="BLACK_WIN">Black Wins (0-1)</option>
                  <option value="DRAW">Draw (1/2-1/2)</option>
                  <option value="IN_PROGRESS">Abandoned / In Progress</option>
                </select>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800/40 rounded-lg p-3 text-xs space-y-1.5 font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span>Color:</span>
                  <span className="text-zinc-200 uppercase">{boardOrientation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Moves:</span>
                  <span className="text-zinc-200">{Math.ceil(game.history().length / 2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="flex-1 py-2.5"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2.5 bg-gradient-to-tr from-violet-600 to-violet-500"
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
