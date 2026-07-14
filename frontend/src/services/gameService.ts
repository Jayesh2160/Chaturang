import api from './api';

export interface GameSaveRequest {
  playerColor: string;
  opponentName: string;
  result: string;
  moveCount: number;
  pgn: string;
  fen?: string;
}

export interface GameResponse {
  id: number;
  playerColor: string;
  opponentName: string;
  result: string;
  moveCount: number;
  pgn: string;
  fen: string;
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
};
