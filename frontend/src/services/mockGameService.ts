// mockGameService.ts — IGameService implementation backed by in-memory + localStorage store.
// Zero network calls. Zero authentication. For development use only.
// Never imported directly by UI — always accessed via gameServiceFactory.

import type { IGameService } from './IGameService';
import type { GameSaveRequest, GameResponse } from './gameService';
import { mockChessGameRepository } from '../mocks/mockChessGame';

// Simulates async network latency for realistic dev experience
const fakeDelay = (ms = 80) => new Promise<void>((r) => setTimeout(r, ms));

export const mockGameService: IGameService = {
  async saveGame(data: GameSaveRequest): Promise<GameResponse> {
    await fakeDelay();
    const record = mockChessGameRepository.save(data);
    console.info('[MockGameService] saveGame →', record);
    return record;
  },

  async getGames(): Promise<GameResponse[]> {
    await fakeDelay();
    const games = mockChessGameRepository.findAll();
    console.info('[MockGameService] getGames →', games.length, 'records');
    return games;
  },

  async getGame(id: number): Promise<GameResponse> {
    await fakeDelay();
    const game = mockChessGameRepository.findById(id);
    if (!game) {
      throw new Error(`[MockGameService] Game with id ${id} not found`);
    }
    console.info('[MockGameService] getGame →', game);
    return game;
  },

  async deleteGame(id: number): Promise<void> {
    await fakeDelay();
    mockChessGameRepository.deleteById(id);
    console.info('[MockGameService] deleteGame → id', id);
  },
};
