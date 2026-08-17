import api from './api';

export interface GameSaveRequest {
  playerColor: string;
  opponentName: string;
  result: string;
  moveCount: number;
  pgn: string;
  fen?: string;
  gameMode?: string;
  difficulty?: string;
}

export interface GameResponse {
  id: number;
  playerColor: string;
  opponentName: string;
  result: string;
  moveCount: number;
  pgn: string;
  fen: string;
  gameMode?: string;
  difficulty?: string;
  createdAt: string;
}


export interface MoveAnalysis {
  moveIndex: number;
  san: string;
  uci: string;
  color: string;
  evaluation: string;
  bestMove: string;
  classification: 'BEST' | 'EXCELLENT' | 'GOOD' | 'INACCURACY' | 'MISTAKE' | 'BLUNDER';
  comment: string;
}

export interface GameAnalysisResponse {
  id: number;
  gameId: number;
  accuracy: number; // Game Accuracy
  blunderCount: number;
  mistakeCount: number;
  inaccuracyCount: number;
  bestMoveCount: number;
  excellentMoveCount: number;
  goodMoveCount: number;
  summary: string;
  moveAnalyses: MoveAnalysis[];
  createdAt: string;
}

export const gameService = {
  saveGame: async (data: GameSaveRequest): Promise<GameResponse> => {
    const response = await api.post<GameResponse>('/api/games', data);
    return response.data;
  },

  getGames: async (): Promise<GameResponse[]> => {
    const response = await api.get<GameResponse[]>('/api/games');
    return response.data;
  },

  getGame: async (id: number): Promise<GameResponse> => {
    const response = await api.get<GameResponse>(`/api/games/${id}`);
    return response.data;
  },

  deleteGame: async (id: number): Promise<void> => {
    await api.delete(`/api/games/${id}`);
  },

  analyzeGame: async (id: number, fens: string[], moves: any[]): Promise<GameAnalysisResponse> => {
    const response = await api.post<GameAnalysisResponse>(`/api/games/${id}/analysis`, { fens, moves });
    return response.data;
  },

  getGameAnalysis: async (id: number): Promise<GameAnalysisResponse> => {
    const response = await api.get<GameAnalysisResponse>(`/api/games/${id}/analysis`);
    return response.data;
  },
};
