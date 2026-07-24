import React, { useState } from 'react';
import type { Square, PieceSymbol } from 'chess.js';
import { gameService } from '../services/gameServiceFactory';
import { CHESS_UI } from '../constants/chessUI';
import { ChessGameProvider, useChessGameContext } from '../context/ChessGameContext';
import { ChessBoard } from '../components/chess/ChessBoard';
import { PlayerPanel } from '../components/chess/PlayerPanel';
import { BoardControls } from '../components/chess/BoardControls';
import { MoveHistory } from '../components/chess/MoveHistory';
import { GameStatusBar } from '../components/chess/GameStatusBar';
import { PromotionModal } from '../components/chess/PromotionModal';
import { ClockPresetModal } from '../components/chess/ClockPresetModal';
import { PreGameModal } from '../components/chess/PreGameModal';
import { GameResultModal } from '../components/chess/GameResultModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// ─── Quick FEN Test Positions ────────────────────────────────────────────────

const TEST_POSITIONS: { label: string; emoji: string; fen: string; description: string }[] = [
  {
    label: "Scholar's Mate",
    emoji: '♟',
    description: 'Black is 1 move from checkmate',
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
  },
  {
    label: 'King & Pawn Endgame',
    emoji: '♔',
    description: 'White pawn ready to promote',
    fen: '8/3P4/8/8/8/8/8/4K1k1 w - - 0 1',
  },
  {
    label: 'Castling Test',
    emoji: '🏰',
    description: 'Both sides can castle',
    fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
  },
  {
    label: 'Check & Defense',
    emoji: '🛡',
    description: 'White king in check, must defend',
    fen: '4k3/8/8/8/8/8/4r3/4K3 w - - 0 1',
  },
  {
    label: 'En Passant',
    emoji: '⚡',
    description: 'En passant available for White',
    fen: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3',
  },
  {
    label: 'Promotion Test',
    emoji: '👑',
    description: 'Two pawns ready to promote',
    fen: '8/P1k5/8/8/8/8/5Kp1/8 w - - 0 1',
  },
];

// ─── Developer Banner ────────────────────────────────────────────────────────

const DevBanner: React.FC<{ onLoadPosition: (fen: string) => void }> = ({ onLoadPosition }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full bg-amber-950/40 border border-amber-500/40 rounded-2xl overflow-hidden shadow-xl shadow-amber-500/5">
      {/* Banner Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-amber-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-sm font-bold text-amber-300 font-mono tracking-wide">
            ⚡ DEV MOCK MODE ACTIVE
          </span>
          <span className="text-[10px] text-amber-500 font-mono border border-amber-500/30 px-2 py-0.5 rounded">
            VITE_USE_MOCK_GAME=true
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-amber-500">
          <span className="font-mono">No backend · No auth · Local only</span>
          <span className="text-amber-400 font-bold">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expandable Test Controls */}
      {isExpanded && (
        <div className="px-5 pb-4 pt-1 border-t border-amber-500/20">
          <p className="text-[11px] text-amber-500/80 mb-3 font-medium">
            Quick-load a test position to verify game rules, UI states, and edge cases:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {TEST_POSITIONS.map((pos) => (
              <button
                key={pos.label}
                onClick={() => onLoadPosition(pos.fen)}
                title={pos.description}
                className="flex flex-col items-center gap-1.5 p-2.5 bg-amber-950/60 border border-amber-500/20 hover:border-amber-400/50 hover:bg-amber-500/10 rounded-xl text-center transition-all group"
              >
                <span className="text-xl">{pos.emoji}</span>
                <span className="text-[10px] font-bold text-amber-300 group-hover:text-white leading-tight">
                  {pos.label}
                </span>
                <span className="text-[9px] text-amber-500/70 leading-tight">{pos.description}</span>
              </button>
            ))}
          </div>

          {/* Reset to Start */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => onLoadPosition('start')}
              className="text-[10px] text-amber-400 hover:text-white font-mono border border-amber-500/20 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              ↩ Reset to Starting Position
            </button>
            <span className="text-[10px] text-amber-600 font-mono">
              Games save to localStorage · No server required
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Chess Content (mirrors PlayGame internals) ───────────────────────────────

const DevChessContent: React.FC = () => {
  const {
    chess,
    fen,
    turn,
    isCheck,
    gameResult,
    selectedSquare,
    setSelectedSquare,
    makeMove,
    confirmPromotion,
    cancelPromotion,
    promotionPending,
    resetGame,
    loadFen,
    canUndo,
    canRedo,
    undo,
    redo,
    jumpToPly,
    currentPlyIndex,
    history,
    capturedState,
    shakeSquare,
    whiteTime,
    blackTime,
    clockActiveColor,
    formatTime,
    activePreset,
    changeClockPreset,
    boardOrientation,
    autoFlip,
    setAutoFlip,
    flipBoard,
    activeTheme,
    setThemeId,
    squareStyles,
    setHoveredSquare,
    soundEnabled,
    toggleSound,
    premovesEnabled,
    setPremovesEnabled,
    userPlayer,
    opponentPlayer,
    gameSetupOptions,
    updateGameSetup,
    isPreGameModalOpen,
    setIsPreGameModalOpen,
    isResultModalOpen,
    setIsResultModalOpen,
    timeoutResult,
  } = useChessGameContext();

  const [isClockModalOpen, setIsClockModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [opponentNameInput, setOpponentNameInput] = useState(opponentPlayer.name);
  const [customResultInput, setCustomResultInput] = useState('IN_PROGRESS');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load a FEN test position
  const handleLoadFen = (fen: string) => {
    if (fen === 'start') {
      resetGame();
    } else {
      resetGame(); // reset clocks/history first
      loadFen(fen);
    }
  };

  const handleSquareClick = (square: Square) => {
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      const move = makeMove(selectedSquare, square);
      if (!move && !promotionPending) {
        const clickedPiece = chess.get(square);
        if (clickedPiece && clickedPiece.color === turn) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = chess.get(square);
      if (piece && piece.color === turn) {
        setSelectedSquare(square);
      }
    }
  };

  const handlePieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    const move = makeMove(sourceSquare, targetSquare);
    return !!move;
  };

  const handleOpenSaveModal = () => {
    if (gameResult) {
      setCustomResultInput(
        gameResult.winner === 'w' ? 'WHITE_WIN' : gameResult.winner === 'b' ? 'BLACK_WIN' : 'DRAW'
      );
    } else {
      setCustomResultInput('IN_PROGRESS');
    }
    setOpponentNameInput(opponentPlayer.name);
    setSaveSuccess(false);
    setSaveError('');
    setIsSaveModalOpen(true);
  };

  const handleSaveGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponentNameInput.trim()) {
      setSaveError('Opponent name is required');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    try {
      const finalResult = customResultInput === 'IN_PROGRESS' ? 'ABANDONED' : customResultInput;
      const moveCount = Math.ceil(history.length / 2);
      await gameService.saveGame({
        playerColor: boardOrientation.toUpperCase(),
        opponentName: opponentNameInput,
        result: finalResult,
        moveCount,
        pgn: chess.pgn(),
        fen,
      });
      setSaveSuccess(true);
      setTimeout(() => setIsSaveModalOpen(false), 1500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save game.');
    } finally {
      setIsSaving(false);
    }
  };

  const topPlayer = boardOrientation === 'white' ? opponentPlayer : userPlayer;
  const bottomPlayer = boardOrientation === 'white' ? userPlayer : opponentPlayer;
  const topTime = topPlayer.color === 'w' ? whiteTime : blackTime;
  const bottomTime = bottomPlayer.color === 'w' ? whiteTime : blackTime;
  const topCaptured = topPlayer.color === 'w' ? capturedState.whiteCaptured : capturedState.blackCaptured;
  const bottomCaptured = bottomPlayer.color === 'w' ? capturedState.whiteCaptured : capturedState.blackCaptured;
  const topScore = topPlayer.color === 'w' ? capturedState.whiteScore : capturedState.blackScore;
  const bottomScore = bottomPlayer.color === 'w' ? capturedState.whiteScore : capturedState.blackScore;
  const activeResult = gameResult || timeoutResult;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-5">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold font-display text-white tracking-tight">
                Chess Dev Playground
              </h1>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono uppercase tracking-wider">
                Development Only
              </span>
            </div>
            <p className="text-zinc-400 text-xs">
              Full production Chess UI · No backend · No authentication · Mock mode active
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsPreGameModalOpen(true)}
            className="self-start text-xs py-2 px-3 text-purple-300 border-purple-500/30"
          >
            ⚙️ Configure Match
          </Button>
        </div>

        {/* Dev Banner with FEN quick-loaders */}
        <DevBanner onLoadPosition={handleLoadFen} />

        {/* ARIA Live Region */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isCheck && CHESS_UI.ANNOUNCEMENT_CHECK}
          {gameResult && gameResult.title}
          {turn === userPlayer.color && CHESS_UI.ANNOUNCEMENT_YOUR_TURN}
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* Left: Board Toolbar */}
          <div className="lg:col-span-3 order-3 lg:order-1 flex flex-col gap-4">
            <BoardControls
              onFlipBoard={flipBoard}
              autoFlip={autoFlip}
              onToggleAutoFlip={setAutoFlip}
              activeThemeId={activeTheme.id}
              onSelectTheme={setThemeId}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              premovesEnabled={premovesEnabled}
              onTogglePremoves={setPremovesEnabled}
              onOpenPresetModal={() => setIsClockModalOpen(true)}
              onResetGame={() => {
                if (window.confirm('Reset to starting position?')) resetGame();
              }}
              onSaveGame={handleOpenSaveModal}
              activePresetName={activePreset.name}
              moveCount={history.length}
            />
          </div>

          {/* Center: Board + Player Panels */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center gap-4">
            <PlayerPanel
              player={topPlayer}
              timeInSeconds={topTime}
              formatTime={formatTime}
              isActiveTurn={clockActiveColor === topPlayer.color}
              isUser={topPlayer.isHuman}
              capturedPieces={topCaptured}
              capturedScore={topScore}
            />

            <ChessBoard
              fen={fen}
              boardOrientation={boardOrientation}
              theme={activeTheme}
              squareStyles={squareStyles}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              onSquareMouseOver={(sq) => setHoveredSquare(sq)}
              onSquareMouseOut={() => setHoveredSquare(null)}
              shakeSquare={shakeSquare}
            />

            <PlayerPanel
              player={bottomPlayer}
              timeInSeconds={bottomTime}
              formatTime={formatTime}
              isActiveTurn={clockActiveColor === bottomPlayer.color}
              isUser={bottomPlayer.isHuman}
              capturedPieces={bottomCaptured}
              capturedScore={bottomScore}
            />
          </div>

          {/* Right: Status & Move History */}
          <div className="lg:col-span-3 order-2 lg:order-3 flex flex-col gap-4">
            <GameStatusBar
              presetName={activePreset.name}
              isRated={gameSetupOptions.rated}
              activeTurnColor={turn}
              isCheck={isCheck}
              gameResult={activeResult}
            />

            <MoveHistory
              history={history}
              currentPlyIndex={currentPlyIndex}
              onJumpToPly={jumpToPly}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              pgn={chess.pgn()}
            />
          </div>
        </div>

        {/* ── Modals ── */}

        {promotionPending && (
          <PromotionModal
            color={turn}
            onSelectPiece={(piece: PieceSymbol) => confirmPromotion(piece as any)}
            onCancel={cancelPromotion}
          />
        )}

        {isClockModalOpen && (
          <ClockPresetModal
            activePreset={activePreset}
            onSelectPreset={changeClockPreset}
            onClose={() => setIsClockModalOpen(false)}
          />
        )}

        {isPreGameModalOpen && (
          <PreGameModal
            currentOptions={gameSetupOptions}
            onStartGame={(newOpts) => {
              updateGameSetup(newOpts);
              setThemeId(newOpts.themeId);
              setAutoFlip(newOpts.autoFlip);
              setPremovesEnabled(newOpts.premovesEnabled);
              resetGame();
            }}
            onClose={() => setIsPreGameModalOpen(false)}
          />
        )}

        {isResultModalOpen && activeResult && (
          <GameResultModal
            result={activeResult}
            moveCount={Math.ceil(history.length / 2)}
            onPlayAgain={() => resetGame()}
            onSaveMatch={handleOpenSaveModal}
            onAnalyze={() => {}}
            onReturnHome={() => window.location.href = '/'}
            onClose={() => setIsResultModalOpen(false)}
          />
        )}

        {/* Save Match Modal */}
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-sm bg-zinc-950 border-white/10 p-6 space-y-5 text-left shadow-2xl rounded-2xl">
              <div>
                <h3 className="font-display font-bold text-lg text-white">Save Mock Match</h3>
                <p className="text-amber-400 text-[10px] mt-0.5 font-mono">
                  ⚡ Saved to localStorage (mock mode)
                </p>
              </div>

              {saveError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-lg">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2.5 rounded-lg font-semibold">
                  ✓ Match saved to localStorage!
                </div>
              )}

              <form onSubmit={handleSaveGameSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                    Opponent Name
                  </label>
                  <input
                    type="text"
                    value={opponentNameInput}
                    onChange={(e) => setOpponentNameInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 focus:border-purple-500/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                    Match Outcome
                  </label>
                  <select
                    value={customResultInput}
                    onChange={(e) => setCustomResultInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 focus:border-purple-500/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                  >
                    <option value="WHITE_WIN">White Wins (1-0)</option>
                    <option value="BLACK_WIN">Black Wins (0-1)</option>
                    <option value="DRAW">Draw (1/2-1/2)</option>
                    <option value="IN_PROGRESS">Abandoned / In Progress</option>
                  </select>
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
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border-none"
                    isLoading={isSaving}
                  >
                    Save Mock Record
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Public Export ────────────────────────────────────────────────────────────

export const DevChessPlayground: React.FC = () => {
  return (
    <ChessGameProvider>
      <DevChessContent />
    </ChessGameProvider>
  );
};
