import type { UserPreferences } from '../types/chess';

export const MOCK_DEFAULT_PREFERENCES: UserPreferences = {
  themeId: 'green',
  soundEnabled: true,
  autoFlip: false,
  premovesEnabled: true,
  lastPresetId: 'rapid_10_0',
};

export const getMockPreferences = (): UserPreferences => {
  return { ...MOCK_DEFAULT_PREFERENCES };
};
