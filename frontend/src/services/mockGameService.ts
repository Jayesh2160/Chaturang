// mockGameService.ts — IGameService implementation backed by in-memory + localStorage store.
// Zero network calls. Zero authentication. For development use only.
// Never imported directly by UI — always accessed via gameServiceFactory.

import type { IGameService } from './IGameService';
import type { GameSaveRequest, GameResponse, GameAnalysisResponse, MoveAnalysis } from './gameService';
import { mockChessGameRepository } from '../mocks/mockChessGame';

// Simulates async network latency for realistic dev experience
const fakeDelay = (ms = 80) => new Promise<void>((r) => setTimeout(r, ms));

const LOCAL_STORAGE_KEY = 'chaturang_mock_analyses';

const getMockAnalyses = (): Record<number, GameAnalysisResponse> => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveMockAnalysis = (id: number, analysis: GameAnalysisResponse) => {
  try {
    const data = getMockAnalyses();
    data[id] = analysis;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save mock analysis', e);
  }
};

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

  async analyzeGame(id: number, _fens: string[], moves: any[]): Promise<GameAnalysisResponse> {
    await fakeDelay(1500); // simulate Stockfish processing latency

    // Check if already analyzed
    const cached = getMockAnalyses()[id];
    if (cached) return cached;

    // Generate mock evaluations
    const moveAnalyses: MoveAnalysis[] = moves.map((m, idx) => {
      // Every 12th move is a mistake, every 20th move is a blunder
      let classification: MoveAnalysis['classification'] = 'BEST';
      let comment = 'Best move.';
      let evaluation = '+0.35';

      if ((idx + 1) % 20 === 0) {
        classification = 'BLUNDER';
        comment = `Blunder. Better was ${m.from === 'e2' ? 'd4' : 'Nf3'}.`;
        evaluation = m.color === 'w' ? '-2.50' : '+2.50';
      } else if ((idx + 1) % 12 === 0) {
        classification = 'MISTAKE';
        comment = `Mistake. Better was ${m.from === 'e2' ? 'd4' : 'O-O'}.`;
        evaluation = m.color === 'w' ? '-1.20' : '+1.20';
      } else if ((idx + 1) % 7 === 0) {
        classification = 'INACCURACY';
        comment = `Inaccuracy. Better was ${m.from === 'e2' ? 'd4' : 'c4'}.`;
        evaluation = m.color === 'w' ? '-0.40' : '+0.40';
      } else if ((idx + 1) % 3 === 0) {
        classification = 'GOOD';
        comment = 'A solid move.';
        evaluation = '+0.15';
      } else if ((idx + 1) % 2 === 0) {
        classification = 'EXCELLENT';
        comment = 'An excellent move.';
        evaluation = '+0.40';
      }

      if (classification === 'BEST' || classification === 'EXCELLENT') {
        const base = idx % 2 === 0 ? 0.35 : -0.20;
        evaluation = base > 0 ? `+${base.toFixed(2)}` : base.toFixed(2);
      }

      return {
        moveIndex: idx,
        san: m.san,
        uci: m.from + m.to + (m.promotion || ''),
        color: m.color,
        evaluation,
        bestMove: m.from === 'e2' ? 'd2d4' : 'g1f3',
        classification,
        comment,
      };
    });

    const blunderCount = moveAnalyses.filter(m => m.classification === 'BLUNDER').length;
    const mistakeCount = moveAnalyses.filter(m => m.classification === 'MISTAKE').length;
    const inaccuracyCount = moveAnalyses.filter(m => m.classification === 'INACCURACY').length;
    const bestMoveCount = moveAnalyses.filter(m => m.classification === 'BEST').length;
    const excellentMoveCount = moveAnalyses.filter(m => m.classification === 'EXCELLENT').length;
    const goodMoveCount = moveAnalyses.filter(m => m.classification === 'GOOD').length;

    // Accuracy computation
    const playerMoves = moveAnalyses.filter(m => m.color === 'w'); // assume white for mock simplicity
    let accuracySum = 0;
    playerMoves.forEach(m => {
      if (m.classification === 'BEST') accuracySum += 100;
      else if (m.classification === 'EXCELLENT') accuracySum += 95;
      else if (m.classification === 'GOOD') accuracySum += 85;
      else if (m.classification === 'INACCURACY') accuracySum += 70;
      else if (m.classification === 'MISTAKE') accuracySum += 45;
      else if (m.classification === 'BLUNDER') accuracySum += 10;
    });
    const accuracy = playerMoves.length > 0 ? (accuracySum / playerMoves.length) : 78.0;

    const mockAnalysis: GameAnalysisResponse = {
      id: Math.floor(Math.random() * 1000) + 1,
      gameId: id,
      accuracy,
      blunderCount,
      mistakeCount,
      inaccuracyCount,
      bestMoveCount,
      excellentMoveCount,
      goodMoveCount,
      summary: `[MOCK ANALYSIS] Review complete! You achieved an accuracy of ${Math.round(accuracy)}%. You had ${blunderCount} blunders and ${mistakeCount} mistakes. Focus on avoiding tactical errors in the midgame.`,
      moveAnalyses,
      createdAt: new Date().toISOString(),
    };

    saveMockAnalysis(id, mockAnalysis);
    console.info('[MockGameService] analyzeGame completed →', mockAnalysis);
    return mockAnalysis;
  },

  async getGameAnalysis(id: number): Promise<GameAnalysisResponse> {
    await fakeDelay();
    const data = getMockAnalyses();
    if (!data[id]) {
      throw new Error(`[MockGameService] Analysis not found for game ${id}`);
    }
    console.info('[MockGameService] getGameAnalysis →', data[id]);
    return data[id];
  },
};
