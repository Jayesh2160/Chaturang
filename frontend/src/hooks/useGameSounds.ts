import { useState, useCallback, useEffect } from 'react';
import { chessAudio } from '../utils/chessAudio';

export const useGameSounds = (initialSoundEnabled: boolean = true) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialSoundEnabled);

  useEffect(() => {
    chessAudio.setMuted(!soundEnabled);
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      chessAudio.setMuted(!next);
      return next;
    });
  }, []);

  const playMoveSound = useCallback((isCapture: boolean, isCheck: boolean, isCheckmate: boolean) => {
    if (isCheckmate) {
      chessAudio.playCheckmate();
    } else if (isCheck) {
      chessAudio.playCheck();
    } else if (isCapture) {
      chessAudio.playCapture();
    } else {
      chessAudio.playMove();
    }
  }, []);

  const playStartSound = useCallback(() => {
    chessAudio.playGameStart();
  }, []);

  const playEndSound = useCallback(() => {
    chessAudio.playGameEnd();
  }, []);

  const playInvalidSound = useCallback(() => {
    chessAudio.playInvalid();
  }, []);

  const playLowTimeTick = useCallback(() => {
    chessAudio.playLowTimeTick();
  }, []);

  return {
    soundEnabled,
    setSoundEnabled,
    toggleSound,
    playMoveSound,
    playStartSound,
    playEndSound,
    playInvalidSound,
    playLowTimeTick,
  };
};
