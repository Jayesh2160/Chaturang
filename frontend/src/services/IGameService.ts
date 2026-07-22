// IGameService — shared interface for real and mock game service implementations.
// Components import only this interface and the factory — never a concrete implementation directly.

import type { GameSaveRequest, GameResponse } from './gameService';

export interface IGameService {
  saveGame(data: GameSaveRequest): Promise<GameResponse>;
  getGames(): Promise<GameResponse[]>;
  getGame(id: number): Promise<GameResponse>;
  deleteGame(id: number): Promise<void>;
}
