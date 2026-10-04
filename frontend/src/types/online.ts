import type { PlayerColor } from './chess';

export type OnlineRole = 'HOST' | 'GUEST';

export type OnlineConnectionStatus =
  | 'IDLE'
  | 'SEARCHING' // Matchmaking in progress
  | 'WAITING_FOR_OPPONENT' // Room created, waiting for guest
  | 'CONNECTING' // Establishing peer link
  | 'CONNECTED' // Active game session
  | 'DISCONNECTED'
  | 'ERROR';

export type OnlineMessageType =
  | 'ROOM_JOIN'
  | 'ROOM_JOIN_ACK'
  | 'MOVE'
  | 'RESIGN'
  | 'DRAW_OFFER'
  | 'DRAW_ACCEPT'
  | 'DRAW_DECLINE'
  | 'CHAT'
  | 'REMATCH_OFFER'
  | 'REMATCH_ACCEPT'
  | 'PING'
  | 'PONG';

export interface OnlinePlayerProfile {
  id: string;
  name: string;
  rating: number;
  avatarUrl?: string;
  color: PlayerColor;
  isReady: boolean;
}

export interface OnlineRoomConfig {
  roomCode: string;
  timeControl: string; // e.g. 'rapid_10_0', 'blitz_5_0', 'blitz_3_0', 'bullet_1_0'
  baseMinutes: number;
  incrementSeconds: number;
  hostColor: 'white' | 'black' | 'random';
  isPrivate: boolean;
}

export interface OnlineMessage<T = any> {
  id: string;
  type: OnlineMessageType;
  senderId: string;
  senderName: string;
  payload: T;
  timestamp: number;
}

export interface MovePayload {
  from: string;
  to: string;
  promotion?: string;
  fen: string;
  whiteTime: number;
  blackTime: number;
}

export interface ChatPayload {
  message: string;
  isEmoji?: boolean;
}
