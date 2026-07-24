import { useState, useCallback } from 'react';

export const useBoardOrientation = (initialOrientation: 'white' | 'black' = 'white', initialAutoFlip: boolean = false) => {
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>(initialOrientation);
  const [autoFlip, setAutoFlip] = useState<boolean>(initialAutoFlip);

  const flipBoard = useCallback(() => {
    setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  const resetOrientation = useCallback(() => {
    setBoardOrientation('white');
  }, []);

  const handleTurnChangeAutoFlip = useCallback((currentTurn: 'w' | 'b') => {
    if (autoFlip) {
      setBoardOrientation(currentTurn === 'w' ? 'white' : 'black');
    }
  }, [autoFlip]);

  return {
    boardOrientation,
    setBoardOrientation,
    autoFlip,
    setAutoFlip,
    flipBoard,
    resetOrientation,
    handleTurnChangeAutoFlip,
  };
};
