import { CHESS_UI } from '../constants/chessUI';
import type { SavedGameState, UserPreferences } from '../types/chess';

export const gamePersistenceService = {
  // --- Game State Persistence ---
  saveGame(state: SavedGameState): boolean {
    try {
      localStorage.setItem(CHESS_UI.STORAGE_GAME_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Failed to save game state:', e);
      return false;
    }
  },

  loadGame(): SavedGameState | null {
    try {
      const data = localStorage.getItem(CHESS_UI.STORAGE_GAME_KEY);
      if (!data) return null;
      return JSON.parse(data) as SavedGameState;
    } catch (e) {
      console.error('Failed to load game state:', e);
      return null;
    }
  },

  clearGame(): void {
    try {
      localStorage.removeItem(CHESS_UI.STORAGE_GAME_KEY);
    } catch (e) {
      console.error('Failed to clear game state:', e);
    }
  },

  // --- User Preferences Persistence ---
  savePreferences(prefs: UserPreferences): boolean {
    try {
      localStorage.setItem(CHESS_UI.STORAGE_PREF_KEY, JSON.stringify(prefs));
      return true;
    } catch (e) {
      console.error('Failed to save preferences:', e);
      return false;
    }
  },

  loadPreferences(): UserPreferences | null {
    try {
      const data = localStorage.getItem(CHESS_UI.STORAGE_PREF_KEY);
      if (!data) return null;
      return JSON.parse(data) as UserPreferences;
    } catch (e) {
      console.error('Failed to load preferences:', e);
      return null;
    }
  },

  clearPreferences(): void {
    try {
      localStorage.removeItem(CHESS_UI.STORAGE_PREF_KEY);
    } catch (e) {
      console.error('Failed to clear preferences:', e);
    }
  },
};
