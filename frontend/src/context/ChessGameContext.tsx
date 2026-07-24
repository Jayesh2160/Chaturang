import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Square } from 'chess.js';
import type {
  BoardThemeConfig,
  ClockPreset,
  GameResult,
  GameSetupOptions,
  PlayerColor,
  PlayerInfo,
  Premove,
} from '../types/chess';
import { GameResultType } from '../types/chess';
import { DEFAULT_CLOCK_PRESETS, CHESS_UI } from '../constants/chessUI';
import { getBoardTheme } from '../utils/boardThemes';
import { useChessGame } from '../hooks/useChessGame';
import { useChessClock } from '../hooks/useChessClock';
import { useBoardOrientation } from '../hooks/useBoardOrientation';
import { useMoveHighlights } from '../hooks/useMoveHighlights';
import { usePremove } from '../hooks/usePremove';
import { useGameSounds } from '../hooks/useGameSounds';
import { useGamePersistence } from '../hooks/useGamePersistence';

interface ChessGameContextType {
  // Engine
  chess: ReturnType<typeof useChessGame>['chess'];
  fen: string;
  turn: PlayerColor;
  isCheck: boolean;
  isGameOver: boolean;
  gameResult: GameResult | null;
  selectedSquare: Square | null;
  setSelectedSquare: (sq: Square | null) => void;
  legalMovesForSelected: ReturnType<typeof useChessGame>['legalMovesForSelected'];
  lastMove: ReturnType<typeof useChessGame>['lastMove'];
  history: ReturnType<typeof useChessGame>['history'];
  capturedState: ReturnType<typeof useChessGame>['capturedState'];
  promotionPending: ReturnType<typeof useChessGame>['promotionPending'];
  makeMove: ReturnType<typeof useChessGame>['makeMove'];
  confirmPromotion: ReturnType<typeof useChessGame>['confirmPromotion'];
  cancelPromotion: ReturnType<typeof useChessGame>['cancelPromotion'];
  resetGame: (newFen?: string) => void;
  loadFen: (fen: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  jumpToPly: (index: number) => void;
  currentPlyIndex: number;
  shakeSquare: boolean;
  triggerShake: () => void;

  // Clock
  whiteTime: number;
  blackTime: number;
  clockActiveColor: PlayerColor;
  clockIsRunning: boolean;
  formatTime: (sec: number) => string;
  activePreset: ClockPreset;
  changeClockPreset: (preset: ClockPreset) => void;

  // Orientation & AutoFlip
  boardOrientation: 'white' | 'black';
  autoFlip: boolean;
  setAutoFlip: (v: boolean) => void;
  flipBoard: () => void;
  resetOrientation: () => void;

  // Theme & Highlights
  activeTheme: BoardThemeConfig;
  setThemeId: (id: string) => void;
  squareStyles: Record<string, React.CSSProperties>;
  setHoveredSquare: (sq: Square | null) => void;

  // Premoves
  premove: Premove | null;
  premovesEnabled: boolean;
  setPremovesEnabled: (v: boolean) => void;

  // Sounds
  soundEnabled: boolean;
  toggleSound: () => void;

  // Players
  userPlayer: PlayerInfo;
  opponentPlayer: PlayerInfo;

  // Setup Options & Modals
  gameSetupOptions: GameSetupOptions;
  updateGameSetup: (opts: Partial<GameSetupOptions>) => void;
  isPreGameModalOpen: boolean;
  setIsPreGameModalOpen: (v: boolean) => void;
  isResultModalOpen: boolean;
  setIsResultModalOpen: (v: boolean) => void;
  timeoutResult: GameResult | null;
}

const ChessGameContext = createContext<ChessGameContextType | undefined>(undefined);

export const ChessGameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { saveGameState, loadUserPreferences, saveUserPreferences } =
    useGamePersistence();

  // Load saved preferences
  const savedPrefs = loadUserPreferences();
  const [themeId, setThemeIdState] = useState<string>(savedPrefs?.themeId || 'green');
  const [premovesEnabled, setPremovesEnabled] = useState<boolean>(
    savedPrefs?.premovesEnabled ?? true
  );

  // Setup options
  const [gameSetupOptions, setGameSetupOptions] = useState<GameSetupOptions>({
    presetId: savedPrefs?.lastPresetId || 'rapid_10_0',
    baseMinutes: 10,
    incrementSeconds: 0,
    rated: true,
    userColor: 'white',
    themeId: themeId,
    autoFlip: savedPrefs?.autoFlip || false,
    premovesEnabled: premovesEnabled,
    soundEnabled: savedPrefs?.soundEnabled ?? true,
    opponentName: 'Grandmaster Bot',
    opponentRating: CHESS_UI.DEFAULT_OPPONENT_RATING,
  });

  const [activePreset, setActivePreset] = useState<ClockPreset>(
    DEFAULT_CLOCK_PRESETS.find((p) => p.id === gameSetupOptions.presetId) ||
      DEFAULT_CLOCK_PRESETS[3]
  );

  const activeTheme = getBoardTheme(themeId);

  // Modals state
  const [isPreGameModalOpen, setIsPreGameModalOpen] = useState<boolean>(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);
  const [timeoutResult, setTimeoutResult] = useState<GameResult | null>(null);

  // Board shake on illegal move
  const [shakeSquare, setShakeSquare] = useState<boolean>(false);
  const triggerShake = useCallback(() => {
    setShakeSquare(true);
    setTimeout(() => setShakeSquare(false), CHESS_UI.SHAKE_ANIMATION_MS);
  }, []);

  // Player metadata
  const userPlayer: PlayerInfo = {
    name: 'You',
    rating: CHESS_UI.DEFAULT_USER_RATING,
    color: gameSetupOptions.userColor === 'black' ? 'b' : 'w',
    isHuman: true,
  };

  const opponentPlayer: PlayerInfo = {
    name: gameSetupOptions.opponentName,
    rating: gameSetupOptions.opponentRating,
    color: userPlayer.color === 'w' ? 'b' : 'w',
    isHuman: false,
  };

  // Engine Hook
  const engine = useChessGame();

  // Audio Hook
  const sounds = useGameSounds(savedPrefs?.soundEnabled ?? true);

  // Timeout Callback
  const handleTimeout = useCallback(
    (winnerColor: PlayerColor) => {
      const res: GameResult = {
        type: GameResultType.TIMEOUT,
        winner: winnerColor,
        title: `${winnerColor === 'w' ? 'White' : 'Black'} Wins!`,
        subtitle: 'On Time (Timeout)',
      };
      setTimeoutResult(res);
      setIsResultModalOpen(true);
      sounds.playEndSound();
    },
    [sounds]
  );

  // Clock Hook
  const clock = useChessClock({
    baseMinutes: activePreset.baseMinutes,
    incrementSeconds: activePreset.incrementSeconds,
    onTimeout: handleTimeout,
    onLowTimeTick: sounds.playLowTimeTick,
  });

  // Board Orientation Hook
  const orientation = useBoardOrientation(
    userPlayer.color === 'b' ? 'black' : 'white',
    savedPrefs?.autoFlip || false
  );

  // Premove Hook
  const premoveHook = usePremove(premovesEnabled);

  // Highlights Hook
  const highlights = useMoveHighlights({
    theme: activeTheme,
    selectedSquare: engine.selectedSquare,
    legalMoves: engine.legalMovesForSelected,
    lastMove: engine.lastMove,
    kingCheckSquare: engine.kingCheckSquare,
    premove: premoveHook.premove,
  });

  // Handle Game Result Trigger (Checkmate/Stalemate/Draw)
  useEffect(() => {
    if (engine.gameResult) {
      clock.pauseClock();
      setIsResultModalOpen(true);
      if (engine.gameResult.type === GameResultType.CHECKMATE) {
        sounds.playMoveSound(false, false, true);
      } else {
        sounds.playEndSound();
      }
    }
  }, [engine.gameResult]);

  // Execute Move wrapper with sounds, clock switch, auto-flip, and premove handling
  const handleMakeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: any) => {
      // Check if it's user's turn
      const currentTurn = engine.turn;
      const isUserTurn =
        (gameSetupOptions.userColor === 'white' && currentTurn === 'w') ||
        (gameSetupOptions.userColor === 'black' && currentTurn === 'b') ||
        gameSetupOptions.userColor === 'random'; // default allows both in local mode

      if (!isUserTurn) {
        // Queue premove if opponent turn
        premoveHook.queuePremove(from, to, promotionPiece);
        return null;
      }

      // Execute move on engine
      const moveResult = engine.makeMove(from, to, promotionPiece);
      if (moveResult) {
        const isCapture = Boolean(moveResult.captured);
        const nextTurn = engine.chess.turn();
        const isCheck = engine.chess.isCheck();
        const isCheckmate = engine.chess.isCheckmate();

        // Audio
        sounds.playMoveSound(isCapture, isCheck, isCheckmate);

        // Clock turn switch
        clock.switchTurn(nextTurn);

        // Auto flip if enabled
        orientation.handleTurnChangeAutoFlip(nextTurn);

        // Check if there is a queued premove to execute for next turn
        if (premoveHook.premove) {
          const pm = premoveHook.premove;
          premoveHook.clearPremove();
          setTimeout(() => {
            handleMakeMove(pm.from as Square, pm.to as Square, pm.promotion as any);
          }, 100);
        }
        return moveResult;
      } else {
        // Invalid move attempted
        sounds.playInvalidSound();
        triggerShake();
        premoveHook.clearPremove();
        return null;
      }
    },
    [engine, gameSetupOptions, premoveHook, sounds, clock, orientation, triggerShake]
  );

  // Change Clock Preset
  const changeClockPreset = useCallback(
    (preset: ClockPreset) => {
      setActivePreset(preset);
      clock.resetClock(preset.baseMinutes, preset.incrementSeconds);
      setGameSetupOptions((prev) => ({
        ...prev,
        presetId: preset.id,
        baseMinutes: preset.baseMinutes,
        incrementSeconds: preset.incrementSeconds,
      }));
    },
    [clock]
  );

  // Theme Setter
  const setThemeId = useCallback(
    (id: string) => {
      setThemeIdState(id);
      saveUserPreferences({
        themeId: id,
        soundEnabled: sounds.soundEnabled,
        autoFlip: orientation.autoFlip,
        premovesEnabled,
        lastPresetId: activePreset.id,
      });
    },
    [sounds.soundEnabled, orientation.autoFlip, premovesEnabled, activePreset.id, saveUserPreferences]
  );

  // Update Game Setup
  const updateGameSetup = useCallback((opts: Partial<GameSetupOptions>) => {
    setGameSetupOptions((prev) => ({ ...prev, ...opts }));
  }, []);

  // Save state to local persistence on history changes
  useEffect(() => {
    if (engine.history.length > 0) {
      saveGameState(
        engine.fen,
        engine.history.map((m) => m.san),
        clock.whiteTime,
        clock.blackTime,
        engine.turn,
        Math.ceil(engine.history.length / 2),
        gameSetupOptions
      );
    }
  }, [engine.fen, engine.history, clock.whiteTime, clock.blackTime, engine.turn, gameSetupOptions, saveGameState]);

  const value: ChessGameContextType = {
    // Engine
    chess: engine.chess,
    fen: engine.fen,
    turn: engine.turn,
    isCheck: engine.isCheck,
    isGameOver: engine.isGameOver,
    gameResult: engine.gameResult,
    selectedSquare: engine.selectedSquare,
    setSelectedSquare: engine.setSelectedSquare,
    legalMovesForSelected: engine.legalMovesForSelected,
    lastMove: engine.lastMove,
    history: engine.history,
    capturedState: engine.capturedState,
    promotionPending: engine.promotionPending,
    makeMove: handleMakeMove,
    confirmPromotion: engine.confirmPromotion,
    cancelPromotion: engine.cancelPromotion,
    resetGame: (newFen?: string) => {
      engine.resetGame(newFen);
      clock.resetClock(activePreset.baseMinutes, activePreset.incrementSeconds);
      setTimeoutResult(null);
      setIsResultModalOpen(false);
      premoveHook.clearPremove();
    },
    loadFen: engine.loadFen,
    canUndo: engine.canUndo,
    canRedo: engine.canRedo,
    undo: engine.undo,
    redo: engine.redo,
    jumpToPly: engine.jumpToPly,
    currentPlyIndex: engine.currentPlyIndex,
    shakeSquare,
    triggerShake,

    // Clock
    whiteTime: clock.whiteTime,
    blackTime: clock.blackTime,
    clockActiveColor: clock.activeColor,
    clockIsRunning: clock.isRunning,
    formatTime: clock.formatTime,
    activePreset,
    changeClockPreset,

    // Orientation
    boardOrientation: orientation.boardOrientation,
    autoFlip: orientation.autoFlip,
    setAutoFlip: orientation.setAutoFlip,
    flipBoard: orientation.flipBoard,
    resetOrientation: orientation.resetOrientation,

    // Theme & Highlights
    activeTheme,
    setThemeId,
    squareStyles: highlights.squareStyles,
    setHoveredSquare: highlights.setHoveredSquare,

    // Premoves
    premove: premoveHook.premove,
    premovesEnabled,
    setPremovesEnabled,

    // Sounds
    soundEnabled: sounds.soundEnabled,
    toggleSound: sounds.toggleSound,

    // Metadata
    userPlayer,
    opponentPlayer,
    gameSetupOptions,
    updateGameSetup,
    isPreGameModalOpen,
    setIsPreGameModalOpen,
    isResultModalOpen,
    setIsResultModalOpen,
    timeoutResult,
  };

  return <ChessGameContext.Provider value={value}>{children}</ChessGameContext.Provider>;
};

export const useChessGameContext = () => {
  const context = useContext(ChessGameContext);
  if (!context) {
    throw new Error('useChessGameContext must be used within a ChessGameProvider');
  }
  return context;
};
