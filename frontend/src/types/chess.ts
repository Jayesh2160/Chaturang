export const GameResultType = {
  CHECKMATE: 'CHECKMATE',
  STALEMATE: 'STALEMATE',
  TIMEOUT: 'TIMEOUT',
  RESIGNATION: 'RESIGNATION',
  DRAW_AGREEMENT: 'DRAW_AGREEMENT',
  THREEFOLD_REPETITION: 'THREEFOLD_REPETITION',
  FIFTY_MOVE_RULE: 'FIFTY_MOVE_RULE',
  INSUFFICIENT_MATERIAL: 'INSUFFICIENT_MATERIAL',
  ABANDONED: 'ABANDONED',
  DISCONNECTED: 'DISCONNECTED',
} as const;

export type GameResultType = (typeof GameResultType)[keyof typeof GameResultType];

export type PlayerColor = 'w' | 'b';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Premove {
  from: string;
  to: string;
  promotion?: string;
}

export interface ClockPreset {
  id: string;
  name: string;
  category: 'Classic' | 'Rapid' | 'Blitz' | 'Bullet' | 'Custom';
  baseMinutes: number;
  incrementSeconds: number;
}

export interface ClockState {
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  activeColor: PlayerColor;
  isRunning: boolean;
  baseTime: number;
  increment: number;
  presetName: string;
}

export interface BoardThemeConfig {
  id: string;
  name: string;
  lightSquare: string;
  darkSquare: string;
  selectedSquare: string;
  legalDot: string;
  captureRing: string;
  lastMoveSquare: string;
  checkSquare: string;
  hoverSquare: string;
  premoveSquare: string;
  accent: string;
}

export interface PlayerInfo {
  name: string;
  rating: number;
  avatarUrl?: string;
  color: PlayerColor;
  isHuman: boolean;
}

export interface GameSetupOptions {
  presetId: string;
  baseMinutes: number;
  incrementSeconds: number;
  rated: boolean;
  userColor: 'white' | 'black' | 'random';
  themeId: string;
  autoFlip: boolean;
  premovesEnabled: boolean;
  soundEnabled: boolean;
  opponentName: string;
  opponentRating: number;
}

export interface GameResult {
  type: GameResultType;
  winner: PlayerColor | 'draw' | null;
  title: string;
  subtitle: string;
}

export interface SavedGameState {
  fen: string;
  history: string[];
  whiteTime: number;
  blackTime: number;
  activeColor: PlayerColor;
  turnCount: number;
  gameSetup: GameSetupOptions;
  timestamp: number;
}

export interface UserPreferences {
  themeId: string;
  soundEnabled: boolean;
  autoFlip: boolean;
  premovesEnabled: boolean;
  lastPresetId: string;
}
