import type { BoardThemeConfig } from '../types/chess';

export const BOARD_THEMES: Record<string, BoardThemeConfig> = {
  green: {
    id: 'green',
    name: 'Tournament Green',
    lightSquare: '#E8EDF9',
    darkSquare: '#769656',
    selectedSquare: 'rgba(59, 130, 246, 0.5)',
    legalDot: 'rgba(34, 197, 94, 0.75)',
    captureRing: 'rgba(239, 68, 68, 0.85)',
    lastMoveSquare: 'rgba(250, 204, 21, 0.4)',
    checkSquare: 'rgba(239, 68, 68, 0.65)',
    hoverSquare: 'rgba(124, 58, 237, 0.35)',
    premoveSquare: 'rgba(168, 85, 247, 0.45)',
    accent: '#22C55E',
  },
  wood: {
    id: 'wood',
    name: 'Classic Wood',
    lightSquare: '#F0D9B5',
    darkSquare: '#B58863',
    selectedSquare: 'rgba(59, 130, 246, 0.5)',
    legalDot: 'rgba(34, 197, 94, 0.75)',
    captureRing: 'rgba(239, 68, 68, 0.85)',
    lastMoveSquare: 'rgba(250, 204, 21, 0.45)',
    checkSquare: 'rgba(239, 68, 68, 0.65)',
    hoverSquare: 'rgba(124, 58, 237, 0.35)',
    premoveSquare: 'rgba(168, 85, 247, 0.45)',
    accent: '#B58863',
  },
  slate: {
    id: 'slate',
    name: 'Dark Slate',
    lightSquare: '#E2E8F0',
    darkSquare: '#334155',
    selectedSquare: 'rgba(59, 130, 246, 0.5)',
    legalDot: 'rgba(34, 197, 94, 0.75)',
    captureRing: 'rgba(239, 68, 68, 0.85)',
    lastMoveSquare: 'rgba(250, 204, 21, 0.4)',
    checkSquare: 'rgba(239, 68, 68, 0.65)',
    hoverSquare: 'rgba(124, 58, 237, 0.35)',
    premoveSquare: 'rgba(168, 85, 247, 0.45)',
    accent: '#38BDF8',
  },
  purple: {
    id: 'purple',
    name: 'Cyber Purple',
    lightSquare: '#F3E8FF',
    darkSquare: '#6B21A8',
    selectedSquare: 'rgba(59, 130, 246, 0.5)',
    legalDot: 'rgba(34, 197, 94, 0.75)',
    captureRing: 'rgba(239, 68, 68, 0.85)',
    lastMoveSquare: 'rgba(250, 204, 21, 0.4)',
    checkSquare: 'rgba(239, 68, 68, 0.65)',
    hoverSquare: 'rgba(168, 85, 247, 0.4)',
    premoveSquare: 'rgba(236, 72, 153, 0.45)',
    accent: '#A855F7',
  },
};

export const DEFAULT_BOARD_THEME = BOARD_THEMES.green;

export const getBoardTheme = (themeId: string): BoardThemeConfig => {
  return BOARD_THEMES[themeId] || DEFAULT_BOARD_THEME;
};
