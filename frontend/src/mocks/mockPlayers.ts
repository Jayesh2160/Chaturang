import type { PlayerInfo } from '../types/chess';

export const MOCK_USER_PLAYER: PlayerInfo = {
  name: 'You',
  rating: 1600,
  color: 'w',
  isHuman: true,
};

export const MOCK_OPPONENT_PLAYER: PlayerInfo = {
  name: 'Opponent',
  rating: 1550,
  color: 'b',
  isHuman: false,
};

export const getMockPlayers = (): { user: PlayerInfo; opponent: PlayerInfo } => {
  return {
    user: MOCK_USER_PLAYER,
    opponent: MOCK_OPPONENT_PLAYER,
  };
};
