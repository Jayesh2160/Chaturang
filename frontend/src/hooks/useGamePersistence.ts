import { useCallback } from 'react';
import { gamePersistenceService } from '../services/gamePersistence';
import type { GameSetupOptions, SavedGameState, UserPreferences } from '../types/chess';

export const useGamePersistence = () => {
  const saveGameState = useCallback(
    (
      fen: string,
      history: string[],
      whiteTime: number,
      blackTime: number,
      activeColor: 'w' | 'b',
      turnCount: number,
      gameSetup: GameSetupOptions
    ) => {
      const state: SavedGameState = {
        fen,
        history,
        whiteTime,
        blackTime,
        activeColor,
        turnCount,
        gameSetup,
        timestamp: Date.now(),
      };
      gamePersistenceService.saveGame(state);
    },
    []
  );

  const loadSavedGame = useCallback(() => {
    return gamePersistenceService.loadGame();
  }, []);

  const clearSavedGame = useCallback(() => {
    gamePersistenceService.clearGame();
  }, []);

  const saveUserPreferences = useCallback((prefs: UserPreferences) => {
    gamePersistenceService.savePreferences(prefs);
  }, []);

  const loadUserPreferences = useCallback(() => {
    return gamePersistenceService.loadPreferences();
  }, []);

  return {
    saveGameState,
    loadSavedGame,
    clearSavedGame,
    saveUserPreferences,
    loadUserPreferences,
  };
};
