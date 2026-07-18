import { validateFen as chessJsValidateFen } from 'chess.js';

// Helper to pad incomplete FENs to 6 space-delimited fields for chess.js strict validation
export const cleanFenForChessJs = (fen: string): string => {
  if (!fen) return '';
  const trimmed = fen.trim();
  if (trimmed === 'start') return '';
  
  const fields = trimmed.split(/\s+/);
  if (fields.length < 6) {
    const defaults = ['w', '-', '-', '0', '1'];
    const missingCount = 6 - fields.length;
    const padding = defaults.slice(defaults.length - missingCount).join(' ');
    return `${trimmed} ${padding}`;
  }
  return trimmed;
};

/**
 * Validates a FEN string using chess.js.
 * @param fen The FEN string to validate.
 * @returns true if the FEN is valid (or is 'start'), false otherwise.
 */
export const isValidFen = (fen: string): boolean => {
  if (!fen) return false;
  const trimmed = fen.trim();
  if (trimmed === 'start') return true;
  
  const cleaned = cleanFenForChessJs(trimmed);
  const result = chessJsValidateFen(cleaned);
  return result.ok;
};

/**
 * Parses and validates all FENs inside a lesson's content.
 * Logs a warning if any invalid FEN is found.
 * @param content The lesson content.
 * @param lessonTitle The title of the lesson for logging.
 * @returns true if all FENs are valid, false otherwise.
 */
export const validateLessonFens = (content: string, lessonTitle: string): boolean => {
  if (!content) return true;
  
  const matches = [...content.matchAll(/\[BOARD:([^\]]+)\]/g)];
  let allValid = true;
  
  for (const match of matches) {
    const fen = match[1];
    if (!isValidFen(fen)) {
      console.error(`Invalid FEN detected in lesson: "${lessonTitle}"`);
      allValid = false;
    }
  }
  
  return allValid;
};
