import type { Clef, Level, Note, NoteId } from '../types';
import { noteId } from './notes';
import { getQuestionPool } from './levels';

export interface QuizItem {
  note: Note;
  isReview: boolean;
}

export type QuizPhase = 'question' | 'feedback' | 'finished';

export interface QuizResult {
  noteId: NoteId;
  correct: boolean;
}

export interface QuizState {
  queue: QuizItem[];
  current: QuizItem | null;
  phase: QuizPhase;
  lastAnswer: { pressed: NoteId; correct: boolean } | null;
  results: QuizResult[];
  startedAt: number;
}

export type QuizAction =
  | { type: 'start'; clef: Clef; level: Level; now?: number }
  | { type: 'answer'; pressed: NoteId }
  | { type: 'next' };

// Random 10 (default) questions from the level's white-key pool.
// Constraints: never the same note as the immediately preceding question,
// and no note appears more than twice across the set.
export function generateQuestions(clef: Clef, level: Level, count = 10): Note[] {
  const pool = getQuestionPool(clef, level);
  if (pool.length === 0) return [];

  const questions: Note[] = [];
  const usedCount = new Map<NoteId, number>();
  let lastId: NoteId | null = null;

  const maxAttempts = count * 500;
  let attempts = 0;
  while (questions.length < count && attempts < maxAttempts) {
    attempts++;
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    const id = noteId(candidate);
    if (id === lastId) continue;
    if ((usedCount.get(id) ?? 0) >= 2) continue;

    questions.push(candidate);
    usedCount.set(id, (usedCount.get(id) ?? 0) + 1);
    lastId = id;
  }
  return questions;
}

export const initialQuizState: QuizState = {
  queue: [],
  current: null,
  phase: 'question',
  lastAnswer: null,
  results: [],
  startedAt: 0,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'start': {
      const notes = generateQuestions(action.clef, action.level, 10);
      const [current, ...rest] = notes.map((note): QuizItem => ({ note, isReview: false }));
      return {
        queue: rest,
        current: current ?? null,
        phase: 'question',
        lastAnswer: null,
        results: [],
        startedAt: action.now ?? Date.now(),
      };
    }
    case 'answer': {
      const current = state.current;
      if (!current || state.phase !== 'question') return state;

      const correct = noteId(current.note) === action.pressed;
      let queue = state.queue;

      if (!correct && !current.isReview) {
        const currentId = noteId(current.note);
        const alreadyScheduled = queue.some(
          (item) => item.isReview && noteId(item.note) === currentId,
        );
        if (!alreadyScheduled) {
          queue = [...queue, { note: current.note, isReview: true }];
        }
      }

      const results = current.isReview
        ? state.results
        : [...state.results, { noteId: noteId(current.note), correct }];

      return {
        ...state,
        queue,
        phase: 'feedback',
        lastAnswer: { pressed: action.pressed, correct },
        results,
      };
    }
    case 'next': {
      const [next, ...rest] = state.queue;
      if (!next) {
        return { ...state, current: null, phase: 'finished', lastAnswer: null };
      }
      return { ...state, queue: rest, current: next, phase: 'question', lastAnswer: null };
    }
    default:
      return state;
  }
}
