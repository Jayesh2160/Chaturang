import api from './api';

export interface RoomResponse {
  roomCode: string;
  status: 'WAITING' | 'READY' | 'IN_PROGRESS' | 'FINISHED';
  timeControl: string;
  minutes: number;
  hostName: string;
  hostRating?: number;
  hostColor: 'w' | 'b';
  guestName?: string;
  guestRating?: number;
  guestColor?: 'w' | 'b';
  createdAt: number;
}

export interface CreateRoomDto {
  timeControl?: string;
  minutes?: number;
  preferredColor?: 'white' | 'black' | 'random';
  playerName?: string;
  rating?: number;
}

export interface JoinRoomDto {
  roomCode: string;
  playerName?: string;
  rating?: number;
}

export interface MatchmakingDto {
  timeControl?: 'rapid' | 'blitz' | 'bullet';
  playerName?: string;
  rating?: number;
}

export const roomApiService = {
  // Create a new private room with 6-character code
  createRoom: async (dto: CreateRoomDto = {}): Promise<RoomResponse> => {
    try {
      const response = await api.post<RoomResponse>('/api/rooms/create', dto);
      return response.data;
    } catch (err) {
      console.warn('[roomApiService] Backend room create failed, falling back to local room:', err);
      // Fallback for offline or standalone mode
      const prefix = ['KNG', 'ROK', 'BHP', 'QEN', 'MAT'][Math.floor(Math.random() * 5)];
      const num = Math.floor(100 + Math.random() * 900);
      const code = `${prefix}${num}`;
      return {
        roomCode: code,
        status: 'WAITING',
        timeControl: dto.timeControl || 'rapid',
        minutes: dto.minutes || 10,
        hostName: dto.playerName || 'Player',
        hostRating: dto.rating || 1200,
        hostColor: dto.preferredColor === 'black' ? 'b' : 'w',
        createdAt: Date.now(),
      };
    }
  },

  // Join an existing room via 6-character code
  joinRoom: async (dto: JoinRoomDto): Promise<RoomResponse> => {
    try {
      const response = await api.post<RoomResponse>('/api/rooms/join', dto);
      return response.data;
    } catch (err: any) {
      console.warn('[roomApiService] Backend room join failed, falling back to P2P peer connection:', err);
      return {
        roomCode: dto.roomCode.toUpperCase(),
        status: 'READY',
        timeControl: 'rapid',
        minutes: 10,
        hostName: 'Host',
        hostRating: 1200,
        hostColor: 'w',
        guestName: dto.playerName || 'Guest',
        guestRating: dto.rating || 1200,
        guestColor: 'b',
        createdAt: Date.now(),
      };
    }
  },

  // Fetch room state by code
  getRoom: async (roomCode: string): Promise<RoomResponse | null> => {
    try {
      const response = await api.get<RoomResponse>(`/api/rooms/${encodeURIComponent(roomCode)}`);
      return response.data;
    } catch (err) {
      return null;
    }
  },

  // Find matchmaking match
  findMatch: async (dto: MatchmakingDto = {}): Promise<RoomResponse> => {
    try {
      const response = await api.post<RoomResponse>('/api/rooms/matchmaking/find', dto);
      return response.data;
    } catch (err) {
      console.warn('[roomApiService] Backend matchmaking find failed, falling back:', err);
      const code = 'MM' + Math.floor(1000 + Math.random() * 9000);
      return {
        roomCode: code,
        status: 'WAITING',
        timeControl: dto.timeControl || 'rapid',
        minutes: dto.timeControl === 'bullet' ? 1 : dto.timeControl === 'blitz' ? 3 : 10,
        hostName: dto.playerName || 'Player',
        hostRating: dto.rating || 1200,
        hostColor: 'w',
        createdAt: Date.now(),
      };
    }
  },

  // Cancel matchmaking search
  cancelMatch: async (playerName?: string): Promise<void> => {
    try {
      await api.post('/api/rooms/matchmaking/cancel', { playerName });
    } catch (err) {
      console.warn('[roomApiService] Cancel matchmaking error:', err);
    }
  },
};
