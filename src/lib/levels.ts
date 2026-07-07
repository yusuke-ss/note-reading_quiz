import type { Clef, Level, Note, NoteId } from '../types';
import { whiteKeysInRange } from './notes';

export interface LevelRange {
  questionLow: NoteId;
  questionHigh: NoteId;
  keyboardLow: NoteId;
  keyboardHigh: NoteId;
}

// Question range (staff + ledger lines) and displayed keyboard range, per clef x level.
export const LEVEL_RANGES: Record<Clef, Record<Level, LevelRange>> = {
  treble: {
    1: { questionLow: 'E4', questionHigh: 'F5', keyboardLow: 'C4', keyboardHigh: 'C6' },
    2: { questionLow: 'C4', questionHigh: 'A5', keyboardLow: 'C4', keyboardHigh: 'C6' },
    3: { questionLow: 'A3', questionHigh: 'C6', keyboardLow: 'A3', keyboardHigh: 'C6' },
  },
  bass: {
    1: { questionLow: 'G2', questionHigh: 'A3', keyboardLow: 'F2', keyboardHigh: 'C4' },
    2: { questionLow: 'E2', questionHigh: 'C4', keyboardLow: 'C2', keyboardHigh: 'C4' },
    3: { questionLow: 'C2', questionHigh: 'E4', keyboardLow: 'C2', keyboardHigh: 'E4' },
  },
};

export function getQuestionPool(clef: Clef, level: Level): Note[] {
  const range = LEVEL_RANGES[clef][level];
  return whiteKeysInRange(range.questionLow, range.questionHigh);
}

export function getKeyboardKeys(clef: Clef, level: Level): Note[] {
  const range = LEVEL_RANGES[clef][level];
  return whiteKeysInRange(range.keyboardLow, range.keyboardHigh);
}
