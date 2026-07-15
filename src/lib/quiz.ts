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
  | { type: 'start'; clef: Clef; level: Level; count?: number; now?: number }
  | { type: 'answer'; pressed: NoteId }
  | { type: 'next' };

// Random 10 (default) questions from the level's white-key pool.
// Constraint: never the same note as the immediately preceding question.
// For longer custom quizzes, notes are distributed as evenly as the pool allows.
export function generateQuestions(clef: Clef, level: Level, count = 10): Note[] {
  const pool = getQuestionPool(clef, level);
  if (pool.length === 0) return [];

  const questions: Note[] = [];
  const usedCount = new Map<NoteId, number>();
  const maxPerNote = Math.ceil(count / pool.length);
  let lastId: NoteId | null = null;

  const maxAttempts = count * 500;
  let attempts = 0;
  while (questions.length < count && attempts < maxAttempts) {
    attempts++;
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    const id = noteId(candidate);
    if (id === lastId) continue;
    if ((usedCount.get(id) ?? 0) >= maxPerNote) continue;

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

export interface QuizProgress {
  // e.g. "3 / 10" during the primary 10, or "10 / 10(復習 +2)" while
  // working through re-asked notes.
  label: string;
  isReview: boolean;
}

// Derives the "n / 10" (or "10 / 10(復習 +m)") progress label from quiz
// state. Primary progress counts recorded results plus the question in
// flight; review progress counts the current review item (if any) plus
// any review items still queued.
export function getProgress(state: QuizState, primaryTotal = 10): QuizProgress {
  const isReview = state.current?.isReview ?? false;
  if (isReview) {
    const reviewRemaining =
      state.queue.filter((item) => item.isReview).length + 1;
    return { label: `${primaryTotal} / ${primaryTotal}(復習 +${reviewRemaining})`, isReview };
  }
  return { label: `${state.results.length + 1} / ${primaryTotal}`, isReview };
}

// Auto-advance delay after an answer: quicker for a correct answer, longer
// for a wrong one so the correct-note callout has time to register.
export function getFeedbackDelayMs(correct: boolean): number {
  return correct ? 700 : 1800;
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'start': {
      const notes = generateQuestions(action.clef, action.level, action.count ?? 10);
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
