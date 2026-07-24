// In-memory + localStorage mock game repository
// Used exclusively by mockGameService.ts — never imported by production code.

import type { GameSaveRequest, GameResponse } from '../services/gameService';

const STORAGE_KEY = 'chaturang_mock_games_v1';

let nextId = 1;
let inMemoryGames: GameResponse[] = [];

function persistToStorage(games: GameResponse[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

function loadFromStorage(): GameResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: GameResponse[] = JSON.parse(raw);
    if (parsed.length > 0) {
      // Restore id counter
      nextId = Math.max(...parsed.map((g) => g.id)) + 1;
    }
    return parsed;
  } catch {
    return [];
  }
}

// Initialize from storage on module load
inMemoryGames = loadFromStorage();

export const mockChessGameRepository = {
  save(data: GameSaveRequest): GameResponse {
    const record: GameResponse = {
      id: nextId++,
      playerColor: data.playerColor,
      opponentName: data.opponentName,
      result: data.result,
      moveCount: data.moveCount,
      pgn: data.pgn,
      fen: data.fen ?? '',
      createdAt: new Date().toISOString(),
    };
    inMemoryGames = [record, ...inMemoryGames];
    persistToStorage(inMemoryGames);
    return record;
  },

  findAll(): GameResponse[] {
    return [...inMemoryGames];
  },

  findById(id: number): GameResponse | undefined {
    return inMemoryGames.find((g) => g.id === id);
  },

  deleteById(id: number): void {
    inMemoryGames = inMemoryGames.filter((g) => g.id !== id);
    persistToStorage(inMemoryGames);
  },

  clear(): void {
    inMemoryGames = [];
    nextId = 1;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
