import React, { useState, useEffect } from 'react';
import type { Square, PieceSymbol } from 'chess.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { gameService } from '../services/gameServiceFactory';
import { CHESS_UI } from '../constants/chessUI';
import { useAuth } from '../context/AuthContext';

// Context & Modular Components
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
import { OnlineGameBanner } from '../components/chess/OnlineGameBanner';
import { OnlineMatchModal } from '../components/chess/OnlineMatchModal';
import { Globe, Users, Bot } from 'lucide-react';

const PlayGameContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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
    canUndo,
    canRedo,
    undo,
    redo,
    jumpToPly,
    currentPlyIndex,
    history,
    capturedState,
    shakeSquare,

    // Clock
    whiteTime,
    blackTime,
    clockActiveColor,
    formatTime,
    activePreset,
    changeClockPreset,

    // Orientation & Theme
    boardOrientation,
    autoFlip,
    setAutoFlip,
    flipBoard,
    activeTheme,
    setThemeId,
    squareStyles,
    setHoveredSquare,

    // Settings & Premoves
    soundEnabled,
    toggleSound,
    premovesEnabled,
    setPremovesEnabled,

    // Players
    userPlayer,
    opponentPlayer,

    // Setup & Modals
    gameSetupOptions,
    updateGameSetup,
    isPreGameModalOpen,
    setIsPreGameModalOpen,
    isResultModalOpen,
    setIsResultModalOpen,
    customResult,
    resignGame,

    // Computer states
    isComputerThinking,
    evaluation,

    // Online Multiplayer additions
    onlineStatus,
    onlineOpponent,
    roomCode,
    incomingDrawOffer,
    lastChatMessage,
    sendOnlineChat,
    sendOnlineDrawOffer,
    acceptOnlineDraw,
    declineOnlineDraw,
    sendOnlineRematch,
  } = useChessGameContext();

  // Modals state
  const [isClockModalOpen, setIsClockModalOpen] = useState<boolean>(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState<boolean>(false);

  // Auto-open Online Match Modal if navigated via ?gameMode=ONLINE or ?mode=online
  useEffect(() => {
    const isOnlineRequested =
      searchParams.get('gameMode')?.toUpperCase() === 'ONLINE' ||
      searchParams.get('mode')?.toLowerCase() === 'online' ||
      searchParams.get('online') === 'true';
    const hasRoomParam = Boolean(searchParams.get('room'));

    if (isOnlineRequested && !hasRoomParam && onlineStatus === 'IDLE') {
      setIsOnlineModalOpen(true);
    }
  }, [searchParams, onlineStatus]);

  // Save game modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [opponentNameInput, setOpponentNameInput] = useState<string>(opponentPlayer.name);
  const [customResultInput, setCustomResultInput] = useState<string>('IN_PROGRESS');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');

  // Square Click Handler (Click-to-Move)
  const handleSquareClick = (square: Square) => {
    if (activeResult || isComputerThinking || (gameSetupOptions.gameMode !== 'SELF' && turn !== userPlayer.color)) {
      return;
    }
    // If piece selected, attempt move
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      const move = makeMove(selectedSquare, square);
      if (!move && !promotionPending) {
        // If clicking another piece of active turn color, re-select
        const clickedPiece = chess.get(square);
        if (clickedPiece && clickedPiece.color === turn) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      // Select square if piece belongs to active turn
      const piece = chess.get(square);
      if (piece && piece.color === turn) {
        setSelectedSquare(square);
      }
    }
  };

  // Piece Drop Handler (Drag-and-Drop)
  const handlePieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (activeResult || isComputerThinking || (gameSetupOptions.gameMode !== 'SELF' && turn !== userPlayer.color)) {
      return false;
    }
    const move = makeMove(sourceSquare, targetSquare);
    if (move) {
      return true;
    }
    return false;
  };

  // Open Save Modal
  const handleOpenSaveModal = () => {
    const activeResult = gameResult || customResult;
    if (activeResult) {
      setCustomResultInput(
        activeResult.winner === 'w'
          ? 'WHITE_WIN'
          : activeResult.winner === 'b'
          ? 'BLACK_WIN'
          : activeResult.winner === 'draw'
          ? 'DRAW'
          : 'IN_PROGRESS'
      );
    } else {
      setCustomResultInput('IN_PROGRESS');
    }
    setOpponentNameInput(opponentPlayer.name);
    setIsSaveModalOpen(true);
  };

  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign the match?')) {
      resignGame();
    }
  };

  // Submit Save Game
  const handleSaveGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setSaveError('Please sign in or register to save match records to your history.');
      return;
    }
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
        moveCount: moveCount,
        pgn: chess.pgn(),
        fen: fen,
      });

      setIsSaveModalOpen(false);
      navigate('/my-games');
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to save game. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine top/bottom player panels based on board orientation
  const topPlayer = boardOrientation === 'white' ? opponentPlayer : userPlayer;
  const bottomPlayer = boardOrientation === 'white' ? userPlayer : opponentPlayer;

  const topTime = topPlayer.color === 'w' ? whiteTime : blackTime;
  const bottomTime = bottomPlayer.color === 'w' ? whiteTime : blackTime;

  const topCaptured = topPlayer.color === 'w' ? capturedState.whiteCaptured : capturedState.blackCaptured;
  const bottomCaptured = bottomPlayer.color === 'w' ? capturedState.whiteCaptured : capturedState.blackCaptured;

  const topScore = topPlayer.color === 'w' ? capturedState.whiteScore : capturedState.blackScore;
  const bottomScore = bottomPlayer.color === 'w' ? capturedState.whiteScore : capturedState.blackScore;

  const activeResult = gameResult || customResult;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* ARIA Live Region for Accessibility */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isCheck && CHESS_UI.ANNOUNCEMENT_CHECK}
        {gameResult && gameResult.title}
        {turn === userPlayer.color && CHESS_UI.ANNOUNCEMENT_YOUR_TURN}
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">
            Interactive Chess Arena
          </h1>
          <p className="text-zinc-400 text-xs font-light mt-0.5">
            Tournament-grade interface with premoves, move assistance, clocks, and live analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOnlineModalOpen(true)}
            className="self-start md:self-auto text-xs py-2 px-3.5 text-purple-200 border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/40 flex items-center gap-2 shadow-lg shadow-purple-950/30 transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold">Play Online</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsPreGameModalOpen(true)}
            className="self-start md:self-auto text-xs py-2 px-3 text-zinc-300 border-white/10 hover:border-white/20"
          >
            ⚙️ Configure Match
          </Button>
        </div>
      </div>

      {/* Main 3-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Column 1: Board Controls & Toolbar (Left Column - 3 cols) */}
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
              if (window.confirm('Reset match position? All move history will be cleared.')) {
                resetGame();
              }
            }}
            onSaveGame={handleOpenSaveModal}
            onResign={handleResign}
            activePresetName={activePreset.name}
            moveCount={history.length}
            isGameOver={!!activeResult}
          />
        </div>

        {/* Column 2: Chessboard & Player Cards (Center Column - 6 cols) */}
        <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center gap-3">
          
          {/* Tournament Mode Selector Bar */}
          <div className="w-full grid grid-cols-3 gap-1.5 bg-zinc-900/80 border border-white/5 p-1 rounded-xl shadow-lg">
            <button
              onClick={() => updateGameSetup({ ...gameSetupOptions, gameMode: 'SELF' })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                gameSetupOptions.gameMode === 'SELF'
                  ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Local Board</span>
              <span className="sm:hidden">Local</span>
            </button>

            <button
              onClick={() => updateGameSetup({ ...gameSetupOptions, gameMode: 'COMPUTER' })}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                gameSetupOptions.gameMode === 'COMPUTER'
                  ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">vs Stockfish</span>
              <span className="sm:hidden">Stockfish</span>
            </button>

            <button
              onClick={() => {
                updateGameSetup({ ...gameSetupOptions, gameMode: 'ONLINE' });
                setIsOnlineModalOpen(true);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                gameSetupOptions.gameMode === 'ONLINE'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                  : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">Play Online</span>
              <span className="sm:hidden">Online</span>
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          </div>

          {/* Online Match Live HUD Banner */}
          {gameSetupOptions.gameMode === 'ONLINE' && onlineStatus !== 'IDLE' && (
            <OnlineGameBanner
              status={onlineStatus}
              roomCode={roomCode}
              opponent={onlineOpponent}
              onSendChat={sendOnlineChat}
              onOfferDraw={sendOnlineDrawOffer}
              onResign={handleResign}
              onRematch={sendOnlineRematch}
              isGameOver={!!activeResult}
              incomingDrawOffer={incomingDrawOffer}
              onAcceptDraw={acceptOnlineDraw}
              onDeclineDraw={declineOnlineDraw}
              lastChatMessage={lastChatMessage}
            />
          )}

          {/* Online Match Quick CTA when online mode is active but IDLE */}
          {gameSetupOptions.gameMode === 'ONLINE' && onlineStatus === 'IDLE' && (
            <div className="w-full p-3.5 bg-gradient-to-r from-purple-950/40 via-zinc-900/70 to-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-white">Online Mode Active</p>
                  <p className="text-[11px] text-zinc-400">Match with a player or invite a friend via Room Code</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setIsOnlineModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 shadow-md shadow-purple-600/30"
              >
                Match / Create Room
              </Button>
            </div>
          )}

          {/* Top Player (Opponent) Panel */}
          <PlayerPanel
            player={topPlayer}
            timeInSeconds={topTime}
            formatTime={formatTime}
            isActiveTurn={clockActiveColor === topPlayer.color}
            isUser={topPlayer.isHuman}
            capturedPieces={topCaptured}
            capturedScore={topScore}
          />

          {/* Center Chessboard Component */}
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

          {/* Computer engine status banner */}
          {(isComputerThinking || (gameSetupOptions.gameMode === 'COMPUTER' && !activeResult)) && (
            <div className="w-full space-y-2 text-left animate-fade-in">
              {isComputerThinking && (
                <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs px-4 py-2.5 rounded-xl font-medium animate-pulse">
                  <span className="text-sm">♟️</span>
                  <span>Stockfish is Thinking</span>
                  <span className="flex gap-1 items-center ml-1">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              )}
              {gameSetupOptions.gameMode === 'COMPUTER' && !isComputerThinking && !activeResult && (
                <div className="flex items-center justify-between bg-zinc-900/60 border border-white/5 text-zinc-400 text-xs px-4 py-2 rounded-xl font-medium">
                  <span>Engine Evaluation:</span>
                  <span className={`font-mono font-bold ${
                    evaluation.startsWith('+') ? 'text-emerald-400' : evaluation.startsWith('-') ? 'text-red-400' : 'text-zinc-300'
                  }`}>
                    {evaluation}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Bottom Player (You) Panel */}
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

        {/* Column 3: Game Status & Move History (Right Column - 3 cols) */}
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

      {/* --- Modals --- */}

      {/* 1. Pawn Promotion Modal */}
      {promotionPending && (
        <PromotionModal
          color={turn}
          onSelectPiece={(piece: PieceSymbol) => confirmPromotion(piece as any)}
          onCancel={cancelPromotion}
        />
      )}

      {/* 2. Clock Preset Selector Modal */}
      {isClockModalOpen && (
        <ClockPresetModal
          activePreset={activePreset}
          onSelectPreset={changeClockPreset}
          onClose={() => setIsClockModalOpen(false)}
        />
      )}

      {/* 3. Pre-Game Match Setup Modal */}
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

      {/* 4. Game Result Summary Modal */}
      {isResultModalOpen && activeResult && (
        <GameResultModal
          result={activeResult}
          moveCount={Math.ceil(history.length / 2)}
          onPlayAgain={() => resetGame()}
          onSaveMatch={handleOpenSaveModal}
          onAnalyze={() => navigate('/my-games')}
          onReturnHome={() => navigate('/dashboard')}
          onClose={() => setIsResultModalOpen(false)}
        />
      )}

      {/* 5. Save Match Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-sm bg-zinc-950 border-white/10 p-6 space-y-6 text-left shadow-2xl rounded-2xl">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Save Match Record</h3>
              <p className="text-zinc-400 text-xs mt-1">
                Persist match outcome and PGN coordinates to profile log.
              </p>
            </div>

            {saveError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3.5 py-2.5 rounded-lg font-semibold">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveGameSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Opponent Name
                </label>
                <input
                  type="text"
                  value={opponentNameInput}
                  onChange={(e) => setOpponentNameInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 focus:border-purple-500/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none"
                  placeholder="e.g. Grandmaster Bot, Friend"
                />
              </div>

              <div className="space-y-1.5">
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

              <div className="bg-zinc-900 border border-white/5 rounded-lg p-3 text-xs space-y-1 font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span>Perspective:</span>
                  <span className="text-zinc-200 uppercase font-bold">{boardOrientation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Moves:</span>
                  <span className="text-zinc-200">{Math.ceil(history.length / 2)}</span>
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
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  isLoading={isSaving}
                >
                  Save Record
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Online Matchmaking & Room Code Modal */}
      {isOnlineModalOpen && (
        <OnlineMatchModal
          isOpen={isOnlineModalOpen}
          onClose={() => setIsOnlineModalOpen(false)}
        />
      )}
    </div>
  );
};

export const PlayGame: React.FC = () => {
  return (
    <Layout>
      <ChessGameProvider>
        <PlayGameContent />
      </ChessGameProvider>
    </Layout>
  );
};
