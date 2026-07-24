import { useState, useCallback } from 'react';
import type { Square } from 'chess.js';
import type { Premove } from '../types/chess';

export const usePremove = (enabled: boolean = true) => {
  const [premove, setPremove] = useState<Premove | null>(null);

  const queuePremove = useCallback((from: Square, to: Square, promotion?: string) => {
    if (!enabled) return;
    setPremove({ from, to, promotion });
  }, [enabled]);

  const clearPremove = useCallback(() => {
    setPremove(null);
  }, []);

  return {
    premove,
    queuePremove,
    clearPremove,
  };
};
