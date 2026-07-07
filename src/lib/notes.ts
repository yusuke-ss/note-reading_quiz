import type { Letter, Note, NoteId } from '../types';

// Semitone offset of each white-key letter from C within an octave.
const LETTER_OFFSET: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

// Order of white-key letters within a single octave, low to high.
const LETTERS_IN_OCTAVE: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const SOLFEGE: Record<Letter, string> = {
  C: 'ド',
  D: 'レ',
  E: 'ミ',
  F: 'ファ',
  G: 'ソ',
  A: 'ラ',
  B: 'シ',
};

// MIDI note number, C4 = 60.
export function noteToMidi(note: Note): number {
  return (note.octave + 1) * 12 + LETTER_OFFSET[note.letter];
}

export function noteId(note: Note): NoteId {
  return `${note.letter}${note.octave}`;
}

export function parseNoteId(id: NoteId): Note {
  const match = /^([A-G])(-?\d+)$/.exec(id);
  if (!match) {
    throw new Error(`invalid NoteId: ${id}`);
  }
  return { letter: match[1] as Letter, octave: Number(match[2]) };
}

// All white-key notes within [low, high] (inclusive), sorted low to high.
export function whiteKeysInRange(low: NoteId, high: NoteId): Note[] {
  const lowNote = parseNoteId(low);
  const highNote = parseNoteId(high);
  const lowMidi = noteToMidi(lowNote);
  const highMidi = noteToMidi(highNote);

  const result: Note[] = [];
  for (let octave = lowNote.octave; octave <= highNote.octave; octave++) {
    for (const letter of LETTERS_IN_OCTAVE) {
      const note: Note = { letter, octave };
      const midi = noteToMidi(note);
      if (midi >= lowMidi && midi <= highMidi) {
        result.push(note);
      }
    }
  }
  return result.sort((a, b) => noteToMidi(a) - noteToMidi(b));
}
