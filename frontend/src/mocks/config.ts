export const isMockModeEnabled = (): boolean => {
  const envVal = import.meta.env.VITE_USE_MOCK_GAME;
  return envVal === 'true' || envVal === true || import.meta.env.DEV_MOCK === 'true';
};
