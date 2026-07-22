// services/index.ts — Canonical service exports for the application.
// UI components always import from here or directly from gameServiceFactory.

export { gameService } from './gameServiceFactory';
export type { IGameService } from './IGameService';
export type { GameSaveRequest, GameResponse } from './gameService';
