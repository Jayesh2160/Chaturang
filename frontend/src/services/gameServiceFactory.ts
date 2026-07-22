// gameServiceFactory.ts — Service factory for chess game API operations.
//
// All UI components, hooks, and pages must import `gameService` from THIS file only.
// They never need to know whether the app is running in mock mode or production.
//
// Switching modes:
//   VITE_USE_MOCK_GAME=true   → mockGameService (local, no auth, no backend)
//   VITE_USE_MOCK_GAME=false  → realGameService (production backend)
//
// Vite statically evaluates import.meta.env.VITE_USE_MOCK_GAME at build time,
// so the un-used branch is tree-shaken from the production bundle entirely.

import type { IGameService } from './IGameService';
import { isMockModeEnabled } from '../mocks/config';

// Static imports — Vite tree-shakes the unused branch based on compile-time env evaluation.
import { mockGameService } from './mockGameService';
import { gameService as realGameService } from './gameService';

export const gameService: IGameService = isMockModeEnabled()
  ? mockGameService
  : realGameService;
