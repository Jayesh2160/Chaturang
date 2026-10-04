import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { engineService } from '../services/engineService';
import { onlineGameService, generateRoomCode } from '../services/onlineGameService';
import type { OnlineConnectionStatus, OnlinePlayerProfile, MovePayload } from '../types/online';
import { useAuth } from './AuthContext';

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
  customResult: GameResult | null;
  resignGame: (resigningColor?: PlayerColor) => void;

  // Computer Engine Addition
  isComputerThinking: boolean;
  evaluation: string;

  // Online Multiplayer additions
  onlineStatus: OnlineConnectionStatus;
  onlineOpponent: OnlinePlayerProfile | null;
  roomCode: string;
  incomingDrawOffer: boolean;
  lastChatMessage: { sender: string; text: string } | null;
  sendOnlineChat: (message: string, isEmoji?: boolean) => void;
  sendOnlineDrawOffer: () => void;
  acceptOnlineDraw: () => void;
  declineOnlineDraw: () => void;
  sendOnlineRematch: () => void;
}

const ChessGameContext = createContext<ChessGameContextType | undefined>(undefined);

export const ChessGameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { saveGameState, loadUserPreferences, saveUserPreferences } =
    useGamePersistence();

  const [searchParams] = useSearchParams();
  const gameModeParam = (searchParams.get('gameMode') || 'SELF').toUpperCase() as 'SELF' | 'COMPUTER' | 'ONLINE' | 'ANALYSIS';
  const difficultyParam = (searchParams.get('difficulty') || 'MEDIUM').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
  const colorParam = (searchParams.get('color') || 'white') as 'white' | 'black' | 'random';
  const timeControlParam = (searchParams.get('timeControl') || 'rapid') as 'classic' | 'blitz' | 'rapid' | 'bullet';
  const roomCodeParam = searchParams.get('room') || '';
  const roleParam = (searchParams.get('role') || 'host').toUpperCase() as 'HOST' | 'GUEST';
  const oppNameParam = searchParams.get('oppName') || '';
  const oppRatingParam = Number(searchParams.get('oppRating') || 1200);
  const autoMatchParam = searchParams.get('autoMatch') === 'true';

  const getDifficultyRating = (diff: string) => {
    switch (diff) {
      case 'EASY': return 600;
      case 'MEDIUM': return 1200;
      case 'HARD': return 1800;
      default: return 1200;
    }
  };
  const getDifficultyName = (diff: string) => {
    switch (diff) {
      case 'EASY': return 'Stockfish (600)';
      case 'MEDIUM': return 'Stockfish (1200)';
      case 'HARD': return 'Stockfish (1800)';
      default: return 'Stockfish (1200)';
    }
  };

  const getInitialSeconds = (mode: string) => {
    switch (mode) {
      case 'classic': return 240; // 4 hours
      case 'blitz': return 3;
      case 'bullet': return 1;
      case 'rapid':
      default:
        return 10;
    }
  };

  // Load saved preferences
  const savedPrefs = loadUserPreferences();
  const [themeId, setThemeIdState] = useState<string>(savedPrefs?.themeId || 'green');
  const [premovesEnabled, setPremovesEnabled] = useState<boolean>(
    savedPrefs?.premovesEnabled ?? true
  );

  // Setup options
  const [gameSetupOptions, setGameSetupOptions] = useState<GameSetupOptions>(() => {
    const defaultPreset = DEFAULT_CLOCK_PRESETS.find((p) => p.id === `${timeControlParam}_${getInitialSeconds(timeControlParam)}_0`) || DEFAULT_CLOCK_PRESETS[3];
    return {
      presetId: defaultPreset.id,
      baseMinutes: defaultPreset.baseMinutes,
      incrementSeconds: defaultPreset.incrementSeconds,
      rated: true,
      userColor: colorParam,
      themeId: themeId,
      autoFlip: savedPrefs?.autoFlip || false,
      premovesEnabled: premovesEnabled,
      soundEnabled: savedPrefs?.soundEnabled ?? true,
      opponentName: gameModeParam === 'COMPUTER' ? getDifficultyName(difficultyParam) : 'Grandmaster Bot',
      opponentRating: gameModeParam === 'COMPUTER' ? getDifficultyRating(difficultyParam) : CHESS_UI.DEFAULT_OPPONENT_RATING,
      gameMode: gameModeParam,
      difficulty: difficultyParam,
    };
  });

  const [activePreset, setActivePreset] = useState<ClockPreset>(
    DEFAULT_CLOCK_PRESETS.find((p) => p.id === gameSetupOptions.presetId) ||
      DEFAULT_CLOCK_PRESETS[3]
  );

  const activeTheme = getBoardTheme(themeId);

  // Modals state
  const [isPreGameModalOpen, setIsPreGameModalOpen] = useState<boolean>(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);
  const [customResult, setCustomResult] = useState<GameResult | null>(null);

  // Resolved user starting color state
  const [resolvedUserColor, setResolvedUserColor] = useState<'w' | 'b'>(() => {
    if (colorParam === 'black') return 'b';
    if (colorParam === 'random') return Math.random() < 0.5 ? 'w' : 'b';
    return 'w';
  });

  // Computer States
  const [isComputerThinking, setIsComputerThinking] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<string>('0.00');

  // Online Multiplayer States
  const [onlineStatus, setOnlineStatus] = useState<OnlineConnectionStatus>(
    gameModeParam === 'ONLINE' ? 'CONNECTING' : 'IDLE'
  );
  const [onlineOpponent, setOnlineOpponent] = useState<OnlinePlayerProfile | null>(() => {
    if (oppNameParam) {
      return {
        id: 'matched-opp',
        name: oppNameParam,
        rating: oppRatingParam,
        color: colorParam === 'white' ? 'b' : 'w',
        isReady: true,
      };
    }
    return null;
  });
  const [incomingDrawOffer, setIncomingDrawOffer] = useState<boolean>(false);
  const [lastChatMessage, setLastChatMessage] = useState<{ sender: string; text: string } | null>(null);
  const [roomCode] = useState<string>(roomCodeParam || '');

  // Sync resolved user color with game setup options
  useEffect(() => {
    if (gameSetupOptions.userColor === 'black') {
      setResolvedUserColor('b');
    } else if (gameSetupOptions.userColor === 'random') {
      setResolvedUserColor(Math.random() < 0.5 ? 'w' : 'b');
    } else {
      setResolvedUserColor('w');
    }
  }, [gameSetupOptions.userColor]);

  // Board shake on illegal move
  const [shakeSquare, setShakeSquare] = useState<boolean>(false);
  const triggerShake = useCallback(() => {
    setShakeSquare(true);
    setTimeout(() => setShakeSquare(false), CHESS_UI.SHAKE_ANIMATION_MS);
  }, []);

  // Player metadata
  const userPlayer: PlayerInfo = {
    name: user?.username || 'You',
    rating: user?.rating || CHESS_UI.DEFAULT_USER_RATING,
    color: resolvedUserColor,
    isHuman: true,
  };

  const opponentPlayer: PlayerInfo = {
    name: gameSetupOptions.gameMode === 'ONLINE'
      ? (onlineOpponent?.name || 'Waiting for Opponent...')
      : gameSetupOptions.gameMode === 'COMPUTER'
      ? getDifficultyName(difficultyParam)
      : 'Grandmaster Bot',
    rating: gameSetupOptions.gameMode === 'ONLINE'
      ? (onlineOpponent?.rating || 1200)
      : gameSetupOptions.gameMode === 'COMPUTER'
      ? getDifficultyRating(difficultyParam)
      : CHESS_UI.DEFAULT_OPPONENT_RATING,
    color: userPlayer.color === 'w' ? 'b' : 'w',
    isHuman: gameSetupOptions.gameMode !== 'COMPUTER',
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
      setCustomResult(res);
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

  // Resign Callback
  const resignGame = useCallback(
    (resigningColor?: PlayerColor) => {
      const colorToResign = resigningColor || (gameSetupOptions.gameMode === 'COMPUTER' ? resolvedUserColor : engine.turn);
      const winnerColor = colorToResign === 'w' ? 'b' : 'w';

      const res: GameResult = {
        type: GameResultType.RESIGNATION,
        winner: winnerColor,
        title: `${winnerColor === 'w' ? 'White' : 'Black'} Wins!`,
        subtitle: `By Resignation (${colorToResign === 'w' ? 'White' : 'Black'} Resigned)`,
      };

      setCustomResult(res);
      clock.pauseClock();
      sounds.playEndSound();
      setIsResultModalOpen(true);

      if (gameSetupOptions.gameMode === 'ONLINE') {
        onlineGameService.sendResign(colorToResign);
      }
    },
    [gameSetupOptions.gameMode, resolvedUserColor, engine.turn, clock, sounds]
  );

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

  // Internal execute move logic
  const executeMoveInternal = useCallback(
    (from: Square, to: Square, promotionPiece?: any) => {
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
    [engine, sounds, clock, orientation, triggerShake, premoveHook]
  );

  // Execute Move wrapper with sounds, clock switch, auto-flip, and premove handling
  const handleMakeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: any, isComputerCall = false) => {
      if (engine.isGameOver || customResult) {
        return null;
      }
      if (!isComputerCall) {
        // Check if it's user's turn
        const currentTurn = engine.turn;
        const isUserTurn =
          gameSetupOptions.gameMode === 'SELF' || // local match allows all turns
          (resolvedUserColor === 'w' && currentTurn === 'w') ||
          (resolvedUserColor === 'b' && currentTurn === 'b');

        if (!isUserTurn) {
          // Queue premove if opponent turn
          premoveHook.queuePremove(from, to, promotionPiece);
          return null;
        }
      }

      const move = executeMoveInternal(from, to, promotionPiece);
      if (move && !isComputerCall && gameSetupOptions.gameMode === 'ONLINE') {
        onlineGameService.sendMove({
          from,
          to,
          promotion: promotionPiece,
          fen: engine.chess.fen(),
          whiteTime: clock.whiteTime,
          blackTime: clock.blackTime,
        });
      }
      return move;
    },
    [engine.isGameOver, customResult, engine.turn, engine.chess, gameSetupOptions.gameMode, resolvedUserColor, executeMoveInternal, premoveHook, clock.whiteTime, clock.blackTime]
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

  // Maintain a stable ref of handleMakeMove to prevent useEffect from re-triggering and clearing the timer on every render
  const handleMakeMoveRef = React.useRef(handleMakeMove);
  useEffect(() => {
    handleMakeMoveRef.current = handleMakeMove;
  }, [handleMakeMove]);

  // Trigger evaluation on every move when gameMode is COMPUTER
  useEffect(() => {
    if (gameSetupOptions.gameMode !== 'COMPUTER' || engine.isGameOver || customResult) return;

    const getEval = async () => {
      try {
        console.log(`[Engine State] Requesting evaluation for FEN: ${engine.fen}`);
        const res = await engineService.evaluate({ fen: engine.fen });
        console.log(`[Engine State] Evaluation result received:`, res);
        setEvaluation(res.evaluation);
      } catch (err) {
        console.error(`[Engine State] Evaluation request failed:`, err);
      }
    };
    getEval();
  }, [engine.fen, gameSetupOptions.gameMode, engine.isGameOver, customResult]);

  // Trigger Computer/Stockfish move when it's computer's turn or simulated online match
  useEffect(() => {
    const isAiPlaying =
      gameSetupOptions.gameMode === 'COMPUTER' ||
      (gameSetupOptions.gameMode === 'ONLINE' && autoMatchParam);

    if (!isAiPlaying || engine.isGameOver || customResult || isComputerThinking) return;

    const currentTurn = engine.turn; // 'w' or 'b'
    const computerColor = resolvedUserColor === 'w' ? 'b' : 'w';

    if (currentTurn === computerColor) {
      const makeComputerMove = async () => {
        console.log(`[Thinking State] Setting isComputerThinking = true. Computer Color: ${computerColor}`);
        setIsComputerThinking(true);
        const startTime = Date.now();
        try {
          console.log(`[Engine State] Requesting best move from Stockfish for FEN: ${engine.fen} (Difficulty: ${gameSetupOptions.difficulty || 'MEDIUM'})`);
          const res = await engineService.getBestMove({
            fen: engine.fen,
            difficulty: gameSetupOptions.difficulty || 'MEDIUM',
          });
          console.log(`[Engine State] Stockfish returned bestmove: ${res.bestMove}`);

          const bestMove = res.bestMove;
          const moveFrom = bestMove.slice(0, 2) as Square;
          const moveTo = bestMove.slice(2, 4) as Square;
          const movePromotion = bestMove.length > 4 ? bestMove.charAt(4) : undefined;

          // Natural thinking delay (at least 800ms)
          const elapsedTime = Date.now() - startTime;
          const delay = Math.max(800 - elapsedTime, 0);

          setTimeout(() => {
            console.log(`[Applied Move] Executing computer move: ${moveFrom} -> ${moveTo} (Promotion: ${movePromotion})`);
            handleMakeMoveRef.current(moveFrom, moveTo, movePromotion, true);
            console.log(`[Thinking State] Setting isComputerThinking = false`);
            setIsComputerThinking(false);
          }, delay);
        } catch (err) {
          console.error('[Engine State] Computer move calculation failed:', err);
          setIsComputerThinking(false);
        }
      };

      // Slight delay before start thinking to feel natural
      const startTimer = setTimeout(makeComputerMove, 300);
      return () => clearTimeout(startTimer);
    }
  }, [
    engine.fen,
    engine.turn,
    gameSetupOptions.gameMode,
    gameSetupOptions.difficulty,
    resolvedUserColor,
    engine.isGameOver,
    customResult,
    isComputerThinking,
    autoMatchParam,
  ]);

  // Online Multiplayer Action Handlers
  const sendOnlineChat = useCallback((message: string, isEmoji = false) => {
    onlineGameService.sendChat(message, isEmoji);
    setLastChatMessage({ sender: 'You', text: message });
    setTimeout(() => setLastChatMessage(null), 5000);
  }, []);

  const sendOnlineDrawOffer = useCallback(() => {
    onlineGameService.sendDrawOffer();
    setLastChatMessage({ sender: 'System', text: 'Draw offer sent to opponent.' });
    setTimeout(() => setLastChatMessage(null), 4000);
  }, []);

  const acceptOnlineDraw = useCallback(() => {
    setIncomingDrawOffer(false);
    onlineGameService.sendDrawResponse(true);
    setCustomResult({
      type: GameResultType.DRAW_AGREEMENT,
      winner: 'draw',
      title: 'Draw Agreed',
      subtitle: 'Mutual Agreement',
    });
    setIsResultModalOpen(true);
  }, []);

  const declineOnlineDraw = useCallback(() => {
    setIncomingDrawOffer(false);
    onlineGameService.sendDrawResponse(false);
  }, []);

  const sendOnlineRematch = useCallback(() => {
    onlineGameService.sendRematchOffer();
    setLastChatMessage({ sender: 'System', text: 'Rematch offer sent to opponent.' });
    setTimeout(() => setLastChatMessage(null), 4000);
  }, []);

  const handleResetGame = useCallback(
    (newFen?: string) => {
      engine.resetGame(newFen);
      clock.resetClock(activePreset.baseMinutes, activePreset.incrementSeconds);
      setCustomResult(null);
      setIsResultModalOpen(false);
      premoveHook.clearPremove();
      setEvaluation('0.00');
      setIsComputerThinking(false);
    },
    [engine, clock, activePreset, premoveHook]
  );

  // Online Multiplayer Connection Lifecycle
  useEffect(() => {
    if (gameSetupOptions.gameMode !== 'ONLINE') return;

    const currentRoom = roomCodeParam || generateRoomCode();
    const myName = user?.username || 'You';
    const myRating = user?.rating || 1200;

    if (roleParam === 'HOST') {
      onlineGameService.createRoom(
        currentRoom,
        {
          timeControl: timeControlParam,
          baseMinutes: activePreset.baseMinutes,
          incrementSeconds: activePreset.incrementSeconds,
          hostColor: colorParam,
          isPrivate: true,
        },
        {
          id: `${myName}-${Date.now()}`,
          name: myName,
          rating: myRating,
        }
      );
    } else {
      onlineGameService.joinRoom(currentRoom, {
        id: `${myName}-${Date.now()}`,
        name: myName,
        rating: myRating,
      });
    }

    const unsubStatus = onlineGameService.on('status', ({ status }: { status: OnlineConnectionStatus }) => {
      setOnlineStatus(status);
    });

    const unsubOpponent = onlineGameService.on('opponentJoined', (opp: OnlinePlayerProfile) => {
      setOnlineOpponent(opp);
      setOnlineStatus('CONNECTED');
      if (opp.color) {
        setResolvedUserColor(opp.color === 'w' ? 'b' : 'w');
      }
      sounds.playStartSound();
    });

    const unsubConfig = onlineGameService.on('configSynced', ({ localColor }: { localColor: PlayerColor }) => {
      if (localColor) {
        setResolvedUserColor(localColor);
      }
    });

    const unsubMove = onlineGameService.on('move', (payload: MovePayload) => {
      console.log('[Online Move] Received move from remote opponent:', payload);
      handleMakeMoveRef.current(payload.from as Square, payload.to as Square, payload.promotion as any, true);
      if (typeof payload.whiteTime === 'number' && typeof payload.blackTime === 'number') {
        clock.setWhiteTime(payload.whiteTime);
        clock.setBlackTime(payload.blackTime);
      }
    });

    const unsubResign = onlineGameService.on('resign', (color: PlayerColor) => {
      resignGame(color);
    });

    const unsubDrawOffer = onlineGameService.on('drawOffer', () => {
      setIncomingDrawOffer(true);
    });

    const unsubDrawAccept = onlineGameService.on('drawAccept', () => {
      setCustomResult({
        type: GameResultType.DRAW_AGREEMENT,
        winner: 'draw',
        title: 'Draw Agreed',
        subtitle: 'Mutual Agreement',
      });
      setIsResultModalOpen(true);
    });

    const unsubDrawDecline = onlineGameService.on('drawDecline', () => {
      setLastChatMessage({ sender: 'System', text: 'Opponent declined the draw offer.' });
      setTimeout(() => setLastChatMessage(null), 4000);
    });

    const unsubChat = onlineGameService.on('chat', (data: { chat: any; senderName: string }) => {
      setLastChatMessage({ sender: data.senderName, text: data.chat.message });
      setTimeout(() => setLastChatMessage(null), 5000);
    });

    const unsubRematch = onlineGameService.on('rematchOffer', () => {
      if (window.confirm('Opponent offered a rematch! Accept?')) {
        onlineGameService.sendRematchAccept();
        handleResetGame();
      }
    });

    const unsubRematchAccept = onlineGameService.on('rematchAccept', () => {
      handleResetGame();
    });

    return () => {
      unsubStatus();
      unsubOpponent();
      unsubConfig();
      unsubMove();
      unsubResign();
      unsubDrawOffer();
      unsubDrawAccept();
      unsubDrawDecline();
      unsubChat();
      unsubRematch();
      unsubRematchAccept();
      onlineGameService.cleanup();
    };
  }, [gameSetupOptions.gameMode, roomCodeParam, roleParam, user]);

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
    resetGame: handleResetGame,
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
