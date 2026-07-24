import type { ClockPreset } from '../types/chess';

export const CHESS_UI = {
  ANIMATION_DURATION_MS: 200,
  SHAKE_ANIMATION_MS: 400,
  
  // Timer Warning Thresholds (in seconds)
  TIMER_WARNING_SEC: 30,
  TIMER_CRITICAL_SEC: 10,
  
  // Storage Keys
  STORAGE_GAME_KEY: 'chaturang_saved_game_v1',
  STORAGE_PREF_KEY: 'chaturang_user_prefs_v1',
  
  // Default ELOs
  DEFAULT_USER_RATING: 1500,
  DEFAULT_OPPONENT_RATING: 1600,
  
  // ARIA announcements
  ANNOUNCEMENT_CHECK: 'Check! Your King is under attack.',
  ANNOUNCEMENT_CHECKMATE: 'Checkmate! Game over.',
  ANNOUNCEMENT_STALEMATE: 'Stalemate! Game ended in a draw.',
  ANNOUNCEMENT_YOUR_TURN: 'It is your turn to move.',
};

export const DEFAULT_CLOCK_PRESETS: ClockPreset[] = [
  { id: 'bullet_1_0', name: 'Bullet 1|0', category: 'Bullet', baseMinutes: 1, incrementSeconds: 0 },
  { id: 'blitz_3_0', name: 'Blitz 3|0', category: 'Blitz', baseMinutes: 3, incrementSeconds: 0 },
  { id: 'blitz_3_2', name: 'Blitz 3|2', category: 'Blitz', baseMinutes: 3, incrementSeconds: 2 },
  { id: 'rapid_10_0', name: 'Rapid 10|0', category: 'Rapid', baseMinutes: 10, incrementSeconds: 0 },
  { id: 'rapid_10_5', name: 'Rapid 10|5', category: 'Rapid', baseMinutes: 10, incrementSeconds: 5 },
  { id: 'classic_30_0', name: 'Classic 30|0', category: 'Classic', baseMinutes: 30, incrementSeconds: 0 },
  { id: 'classic_120_0', name: 'Classic 2h', category: 'Classic', baseMinutes: 120, incrementSeconds: 0 },
];
