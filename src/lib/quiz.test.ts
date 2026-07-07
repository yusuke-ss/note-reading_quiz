import { describe, expect, it } from 'vitest';
import type { Clef, Level } from '../types';
import { getQuestionPool } from './levels';
import { noteId } from './notes';
import { generateQuestions, getFeedbackDelayMs, getProgress, quizReducer } from './quiz';
import type { QuizState } from './quiz';

const CLEFS: Clef[] = ['treble', 'bass'];
const LEVELS: Level[] = [1, 2, 3];

describe('generateQuestions', () => {
  it('produces 10 questions all within the level pool, with no immediate repeat and at most 2 of any note (checked over many runs)', () => {
    for (const clef of CLEFS) {
      for (const level of LEVELS) {
        const poolIds = new Set(getQuestionPool(clef, level).map(noteId));
        for (let run = 0; run < 30; run++) {
          const questions = generateQuestions(clef, level, 10);
          expect(questions).toHaveLength(10);

          const counts = new Map<string, number>();
          let lastId: string | null = null;
          for (const note of questions) {
            const id = noteId(note);
            expect(poolIds.has(id)).toBe(true);
            expect(id).not.toBe(lastId);
            counts.set(id, (counts.get(id) ?? 0) + 1);
            lastId = id;
          }
          for (const count of counts.values()) {
            expect(count).toBeLessThanOrEqual(2);
          }
        }
      }
    }
  });
});

function startState(clef: Clef = 'treble', level: Level = 1, now = 1000): QuizState {
  return quizReducer(
    { queue: [], current: null, phase: 'question', lastAnswer: null, results: [], startedAt: 0 },
    { type: 'start', clef, level, now },
  );
}

describe('quizReducer', () => {
  it('start seeds 10 items total (1 current + 9 queued) and sets startedAt', () => {
    const state = startState();
    expect(state.current).not.toBeNull();
    expect(state.queue).toHaveLength(9);
    expect(state.phase).toBe('question');
    expect(state.startedAt).toBe(1000);
    expect(state.results).toEqual([]);
  });

  it('marks a correct answer and records it in results', () => {
    let state = startState();
    const correctId = noteId(state.current!.note);
    state = quizReducer(state, { type: 'answer', pressed: correctId });
    expect(state.phase).toBe('feedback');
    expect(state.lastAnswer).toEqual({ pressed: correctId, correct: true });
    expect(state.results).toEqual([{ noteId: correctId, correct: true }]);
    // no review should have been scheduled
    expect(state.queue.some((i) => i.isReview)).toBe(false);
  });

  it('marks a wrong answer, records it, and appends a review item at queue end', () => {
    let state = startState();
    const correctId = noteId(state.current!.note);
    const wrongId = correctId === 'C4' ? 'D4' : 'C4';
    const queueLenBefore = state.queue.length;
    state = quizReducer(state, { type: 'answer', pressed: wrongId });
    expect(state.phase).toBe('feedback');
    expect(state.lastAnswer).toEqual({ pressed: wrongId, correct: false });
    expect(state.results).toEqual([{ noteId: correctId, correct: false }]);
    expect(state.queue).toHaveLength(queueLenBefore + 1);
    const review = state.queue[state.queue.length - 1];
    expect(review.isReview).toBe(true);
    expect(noteId(review.note)).toBe(correctId);
  });

  it('review answers are not recorded in results, whether correct or not', () => {
    let state: QuizState = {
      queue: [],
      current: { note: { letter: 'C', octave: 4 }, isReview: true },
      phase: 'question',
      lastAnswer: null,
      results: [{ noteId: 'D4', correct: true }],
      startedAt: 0,
    };
    state = quizReducer(state, { type: 'answer', pressed: 'E4' });
    expect(state.results).toEqual([{ noteId: 'D4', correct: true }]);
    expect(state.queue.some((i) => i.isReview)).toBe(false);
  });

  it('a wrong review answer does not schedule a second review for the same note', () => {
    const state: QuizState = {
      queue: [],
      current: { note: { letter: 'C', octave: 4 }, isReview: true },
      phase: 'question',
      lastAnswer: null,
      results: [],
      startedAt: 0,
    };
    const next = quizReducer(state, { type: 'answer', pressed: 'D4' });
    expect(next.queue).toHaveLength(0);
  });

  it('does not schedule a duplicate review if one is already queued for the same note', () => {
    const state: QuizState = {
      queue: [{ note: { letter: 'C', octave: 4 }, isReview: true }],
      current: { note: { letter: 'C', octave: 4 }, isReview: false },
      phase: 'question',
      lastAnswer: null,
      results: [],
      startedAt: 0,
    };
    const next = quizReducer(state, { type: 'answer', pressed: 'D4' });
    expect(next.queue).toHaveLength(1);
  });

  it('a black-key press is always incorrect', () => {
    let state = startState();
    // parseNoteId only understands letters A-G, so we simulate a "black key"
    // id with a sharp marker that can never equal a natural NoteId.
    state = quizReducer(state, { type: 'answer', pressed: 'C#4' });
    expect(state.lastAnswer?.correct).toBe(false);
  });

  it('next advances to the following queued item and clears lastAnswer', () => {
    let state = startState();
    const secondNote = state.queue[0];
    state = quizReducer(state, { type: 'answer', pressed: 'zzz' });
    state = quizReducer(state, { type: 'next' });
    expect(state.phase).toBe('question');
    expect(state.current).toEqual(secondNote);
    expect(state.lastAnswer).toBeNull();
  });

  it('finishes once the queue is fully drained', () => {
    let state: QuizState = {
      queue: [],
      current: { note: { letter: 'C', octave: 4 }, isReview: false },
      phase: 'question',
      lastAnswer: null,
      results: [],
      startedAt: 0,
    };
    state = quizReducer(state, { type: 'answer', pressed: 'C4' });
    state = quizReducer(state, { type: 'next' });
    expect(state.phase).toBe('finished');
    expect(state.current).toBeNull();
  });

  it('drains a full 10-question set to finished, review included', () => {
    let state = startState();
    let guard = 0;
    while (state.phase !== 'finished' && guard < 100) {
      guard++;
      if (state.phase === 'question') {
        state = quizReducer(state, { type: 'answer', pressed: 'not-a-real-note' });
      } else if (state.phase === 'feedback') {
        state = quizReducer(state, { type: 'next' });
      }
    }
    expect(state.phase).toBe('finished');
    // 10 initial questions, all wrong -> exactly 10 results recorded (reviews excluded)
    expect(state.results).toHaveLength(10);
  });
});

describe('getProgress', () => {
  it('reports "n / 10" for the nth primary question, before any answers are recorded', () => {
    const state = startState();
    expect(getProgress(state)).toEqual({ label: '1 / 10', isReview: false });
  });

  it('advances n as primary results accumulate', () => {
    let state: QuizState = {
      queue: [],
      current: { note: { letter: 'C', octave: 4 }, isReview: false },
      phase: 'question',
      lastAnswer: null,
      results: [
        { noteId: 'D4', correct: true },
        { noteId: 'E4', correct: false },
      ],
      startedAt: 0,
    };
    expect(getProgress(state)).toEqual({ label: '3 / 10', isReview: false });
  });

  it('shows "10 / 10(復習 +m)" while working through review items, counting current + queued reviews', () => {
    const state: QuizState = {
      queue: [
        { note: { letter: 'D', octave: 4 }, isReview: true },
        { note: { letter: 'E', octave: 4 }, isReview: true },
      ],
      current: { note: { letter: 'C', octave: 4 }, isReview: true },
      phase: 'question',
      lastAnswer: null,
      results: new Array(10).fill({ noteId: 'C4', correct: true }),
      startedAt: 0,
    };
    expect(getProgress(state)).toEqual({ label: '10 / 10(復習 +3)', isReview: true });
  });

  it('ignores non-review items left in the queue when counting review remaining (they should not coexist, but be defensive)', () => {
    const state: QuizState = {
      queue: [{ note: { letter: 'D', octave: 4 }, isReview: false }],
      current: { note: { letter: 'C', octave: 4 }, isReview: true },
      phase: 'question',
      lastAnswer: null,
      results: [],
      startedAt: 0,
    };
    expect(getProgress(state)).toEqual({ label: '10 / 10(復習 +1)', isReview: true });
  });

  it('supports a custom primary total', () => {
    const state = startState();
    expect(getProgress(state, 5)).toEqual({ label: '1 / 5', isReview: false });
  });
});

describe('getFeedbackDelayMs', () => {
  it('returns 700ms for a correct answer', () => {
    expect(getFeedbackDelayMs(true)).toBe(700);
  });

  it('returns 1800ms for a wrong answer', () => {
    expect(getFeedbackDelayMs(false)).toBe(1800);
  });
});
