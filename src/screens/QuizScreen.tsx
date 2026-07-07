import { useEffect, useReducer } from 'react';
import type { Clef, Level, NoteId } from '../types';
import { noteId, SOLFEGE } from '../lib/notes';
import { getKeyboardKeys } from '../lib/levels';
import { initialQuizState, quizReducer } from '../lib/quiz';
import { StaffDisplay } from '../components/StaffDisplay';
import { PianoKeyboard, type KeyHighlight } from '../components/PianoKeyboard';
import './QuizScreen.css';

export interface QuizSummary {
  correct: number;
  total: number;
  durationMs: number;
  wrongNoteIds: NoteId[];
}

export interface QuizScreenProps {
  clef: Clef;
  level: Level;
  onFinish: (summary: QuizSummary) => void;
}

const PRIMARY_TOTAL = 10;

export function QuizScreen({ clef, level, onFinish }: QuizScreenProps) {
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);

  // Kick off a fresh 10-question set once, on mount. The parent screen
  // remounts QuizScreen (via a fresh `key`) to start another game.
  useEffect(() => {
    dispatch({ type: 'start', clef, level });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.phase !== 'finished') return;
    const correct = state.results.filter((result) => result.correct).length;
    const wrongNoteIds = state.results.filter((result) => !result.correct).map((result) => result.noteId);
    onFinish({
      correct,
      total: state.results.length,
      durationMs: Date.now() - state.startedAt,
      wrongNoteIds,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  if (!state.current) {
    return null;
  }

  const keyboardKeys = getKeyboardKeys(clef, level);
  const primaryDone = state.results.length;
  const currentIsReview = state.current.isReview;
  const reviewRemaining =
    state.queue.filter((item) => item.isReview).length + (currentIsReview ? 1 : 0);

  const highlight: Record<NoteId, KeyHighlight> = {};
  let feedbackMessage: string | null = null;
  const isCorrect = state.lastAnswer?.correct ?? false;

  if (state.phase === 'feedback' && state.lastAnswer) {
    const correctId = noteId(state.current.note);
    if (state.lastAnswer.correct) {
      highlight[state.lastAnswer.pressed] = 'correct';
      feedbackMessage = '○ せいかい!';
    } else {
      highlight[state.lastAnswer.pressed] = 'wrong';
      highlight[correctId] = 'answer';
      feedbackMessage = `× こたえは ${SOLFEGE[state.current.note.letter]}`;
    }
  }

  return (
    <div className="quiz-screen">
      <div className="quiz-progress">
        {currentIsReview
          ? `${PRIMARY_TOTAL} / ${PRIMARY_TOTAL}(復習 +${reviewRemaining})`
          : `${primaryDone + 1} / ${PRIMARY_TOTAL}`}
      </div>
      <StaffDisplay clef={clef} note={state.current.note} />
      <div className={`quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
        {feedbackMessage ?? ' '}
      </div>
      <PianoKeyboard
        keys={keyboardKeys}
        showLabels
        highlight={highlight}
        disabled={state.phase === 'feedback'}
        onKeyPress={(id) => dispatch({ type: 'answer', pressed: id })}
      />
      <div className="quiz-actions">
        {state.phase === 'feedback' && (
          <button type="button" className="quiz-next" onClick={() => dispatch({ type: 'next' })}>
            つぎへ
          </button>
        )}
      </div>
    </div>
  );
}
