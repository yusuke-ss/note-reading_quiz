import { describe, expect, it } from 'vitest';
import type { Clef, Level } from '../types';
import { getKeyboardKeys, LEVEL_RANGES } from './levels';

const CLEFS: Clef[] = ['treble', 'bass'];
const LEVELS: Level[] = [1, 2, 3];

describe('LEVEL_RANGES', () => {
  it('matches the confirmed treble ranges', () => {
    expect(LEVEL_RANGES.treble[1]).toEqual({
      questionLow: 'E4',
      questionHigh: 'F5',
      keyboardLow: 'C4',
      keyboardHigh: 'C6',
    });
    expect(LEVEL_RANGES.treble[2]).toEqual({
      questionLow: 'C4',
      questionHigh: 'A5',
      keyboardLow: 'C4',
      keyboardHigh: 'C6',
    });
    expect(LEVEL_RANGES.treble[3]).toEqual({
      questionLow: 'A3',
      questionHigh: 'C6',
      keyboardLow: 'A3',
      keyboardHigh: 'C6',
    });
  });

  it('matches the confirmed bass ranges', () => {
    expect(LEVEL_RANGES.bass[1]).toEqual({
      questionLow: 'G2',
      questionHigh: 'A3',
      keyboardLow: 'F2',
      keyboardHigh: 'C4',
    });
    expect(LEVEL_RANGES.bass[2]).toEqual({
      questionLow: 'E2',
      questionHigh: 'C4',
      keyboardLow: 'C2',
      keyboardHigh: 'C4',
    });
    expect(LEVEL_RANGES.bass[3]).toEqual({
      questionLow: 'C2',
      questionHigh: 'E4',
      keyboardLow: 'C2',
      keyboardHigh: 'E4',
    });
  });
});

describe('getKeyboardKeys', () => {
  it('always includes middle C (C4) across all clef x level combinations', () => {
    for (const clef of CLEFS) {
      for (const level of LEVELS) {
        const keys = getKeyboardKeys(clef, level);
        const hasMiddleC = keys.some((k) => k.letter === 'C' && k.octave === 4);
        expect(hasMiddleC, `${clef} level ${level} should include C4`).toBe(true);
      }
    }
  });
});
