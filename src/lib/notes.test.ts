import { describe, expect, it } from 'vitest';
import { keyIdToMidi, noteId, noteToMidi, parseNoteId, whiteKeysInRange } from './notes';

describe('noteToMidi', () => {
  it('maps C4 to 60', () => {
    expect(noteToMidi({ letter: 'C', octave: 4 })).toBe(60);
  });

  it('maps A4 to 69', () => {
    expect(noteToMidi({ letter: 'A', octave: 4 })).toBe(69);
  });

  it('maps C0 to 12', () => {
    expect(noteToMidi({ letter: 'C', octave: 0 })).toBe(12);
  });

  it('maps B3 just below C4', () => {
    expect(noteToMidi({ letter: 'B', octave: 3 })).toBe(59);
  });
});

describe('noteId / parseNoteId', () => {
  it('round-trips a note', () => {
    const note = { letter: 'F', octave: 5 } as const;
    expect(parseNoteId(noteId(note))).toEqual(note);
  });

  it('formats as letter+octave', () => {
    expect(noteId({ letter: 'C', octave: 4 })).toBe('C4');
  });

  it('throws on an invalid id', () => {
    expect(() => parseNoteId('H9')).toThrow();
  });
});

describe('keyIdToMidi', () => {
  it('maps a white-key id the same as noteToMidi', () => {
    expect(keyIdToMidi('C4')).toBe(60);
    expect(keyIdToMidi('B3')).toBe(59);
  });

  it('maps a sharp (black-key) id to one semitone above the letter', () => {
    expect(keyIdToMidi('C#4')).toBe(61);
    expect(keyIdToMidi('G#2')).toBe(noteToMidi({ letter: 'G', octave: 2 }) + 1);
  });

  it('throws on an invalid id', () => {
    expect(() => keyIdToMidi('H9')).toThrow();
  });
});

describe('whiteKeysInRange', () => {
  it('returns 15 keys from C4 to C6', () => {
    const keys = whiteKeysInRange('C4', 'C6');
    expect(keys).toHaveLength(15);
    expect(keys[0]).toEqual({ letter: 'C', octave: 4 });
    expect(keys[keys.length - 1]).toEqual({ letter: 'C', octave: 6 });
  });

  it('is sorted low to high', () => {
    const keys = whiteKeysInRange('A3', 'C6');
    const midis = keys.map(noteToMidi);
    expect(midis).toEqual([...midis].sort((a, b) => a - b));
  });

  it('includes both endpoints when they are white keys', () => {
    const keys = whiteKeysInRange('E4', 'F5');
    expect(keys[0]).toEqual({ letter: 'E', octave: 4 });
    expect(keys[keys.length - 1]).toEqual({ letter: 'F', octave: 5 });
  });

  it('handles a single-note range', () => {
    expect(whiteKeysInRange('C4', 'C4')).toEqual([{ letter: 'C', octave: 4 }]);
  });
});
