export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export interface Note {
  letter: Letter;
  octave: number;
}

// e.g. "C4" -- used for judging answers and as a storage key (octave-strict)
export type NoteId = string;

export type Clef = 'treble' | 'bass';

export type Level = 1 | 2 | 3;
