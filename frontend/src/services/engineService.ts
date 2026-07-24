import api from './api';

export type EngineDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type GameMode = 'SELF' | 'COMPUTER' | 'ONLINE' | 'ANALYSIS';

export interface BestMoveRequest {
  fen: string;
  difficulty: EngineDifficulty;
}

export interface BestMoveResponse {
  bestMove: string;
}

export interface EvaluateRequest {
  fen: string;
}

export interface EvaluateResponse {
  evaluation: string;
  principalVariation: string;
}

export const engineService = {
  getBestMove: async (data: BestMoveRequest): Promise<BestMoveResponse> => {
    const response = await api.post<BestMoveResponse>('/api/engine/best-move', data);
    return response.data;
  },

  evaluate: async (data: EvaluateRequest): Promise<EvaluateResponse> => {
    const response = await api.post<EvaluateResponse>('/api/engine/evaluate', data);
    return response.data;
  },
};
