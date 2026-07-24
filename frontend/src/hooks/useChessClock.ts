import { useState, useEffect, useRef, useCallback } from 'react';
import type { PlayerColor } from '../types/chess';

export interface UseChessClockProps {
  baseMinutes: number;
  incrementSeconds: number;
  onTimeout?: (winner: PlayerColor) => void;
  onLowTimeTick?: () => void;
}

export const useChessClock = ({
  baseMinutes,
  incrementSeconds,
  onTimeout,
  onLowTimeTick,
}: UseChessClockProps) => {
  const baseTimeSec = baseMinutes * 60;
  
  const [whiteTime, setWhiteTime] = useState<number>(baseTimeSec);
  const [blackTime, setBlackTime] = useState<number>(baseTimeSec);
  const [activeColor, setActiveColor] = useState<PlayerColor>('w');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const activeColorRef = useRef<PlayerColor>(activeColor);
  activeColorRef.current = activeColor;

  const isRunningRef = useRef<boolean>(isRunning);
  isRunningRef.current = isRunning;

  // Clock countdown interval loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (activeColorRef.current === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            onTimeout?.('b'); // Black wins on time
            return 0;
          }
          if (prev <= 10 && onLowTimeTick) {
            onLowTimeTick();
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            onTimeout?.('w'); // White wins on time
            return 0;
          }
          if (prev <= 10 && onLowTimeTick) {
            onLowTimeTick();
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeout, onLowTimeTick]);

  // Switch Turn & Add Increment
  const switchTurn = useCallback((newActiveColor: PlayerColor) => {
    // Add increment to the player who just finished their move
    if (incrementSeconds > 0) {
      if (newActiveColor === 'b') {
        // White just moved
        setWhiteTime((prev) => prev + incrementSeconds);
      } else {
        // Black just moved
        setBlackTime((prev) => prev + incrementSeconds);
      }
    }

    setActiveColor(newActiveColor);
    if (!isRunningRef.current) {
      setIsRunning(true);
    }
  }, [incrementSeconds]);

  // Start Clock
  const startClock = useCallback(() => {
    setIsRunning(true);
  }, []);

  // Pause Clock
  const pauseClock = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Reset Clocks
  const resetClock = useCallback((newBaseMinutes?: number, _newIncrement?: number) => {
    const base = (newBaseMinutes !== undefined ? newBaseMinutes : baseMinutes) * 60;
    setWhiteTime(base);
    setBlackTime(base);
    setActiveColor('w');
    setIsRunning(false);
  }, [baseMinutes]);

  // Format Time helper (HH:MM:SS or MM:SS)
  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, []);

  return {
    whiteTime,
    blackTime,
    activeColor,
    isRunning,
    switchTurn,
    startClock,
    pauseClock,
    resetClock,
    formatTime,
    setWhiteTime,
    setBlackTime,
  };
};
