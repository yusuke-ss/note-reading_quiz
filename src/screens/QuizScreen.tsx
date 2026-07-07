import { useEffect, useReducer } from 'react';
import type { Clef, Level, NoteId } from '../types';
import { keyIdToMidi, noteId, SOLFEGE } from '../lib/notes';
import { getKeyboardKeys } from '../lib/levels';
import { initialQuizState, quizReducer } from '../lib/quiz';
import { usePiano } from '../hooks/usePiano';
import { StaffDisplay } from '../components/StaffDisplay';
import { PianoKeyboard, type KeyHighlight } from '../components/PianoKeyboard';
import { MuteButton } from '../components/MuteButton';
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
  const { loadState, muted, toggleMute, play } = usePiano();

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

  // On a wrong answer, play the correct note shortly after the (already
  // played) wrong tap, so the two sounds don't blur together.
  useEffect(() => {
    if (state.phase !== 'feedback' || !state.lastAnswer || state.lastAnswer.correct || !state.current) {
      return;
    }
    const correctMidi = keyIdToMidi(noteId(state.current.note));
    const timer = setTimeout(() => play(correctMidi), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.lastAnswer, state.current]);

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
      <div className="quiz-header">
        <div className="quiz-progress">
          {currentIsReview
            ? `${PRIMARY_TOTAL} / ${PRIMARY_TOTAL}(復習 +${reviewRemaining})`
            : `${primaryDone + 1} / ${PRIMARY_TOTAL}`}
        </div>
        <div className="quiz-header-controls">
          {loadState === 'loading' && <span className="quiz-loading">読みこみ中…</span>}
          <MuteButton muted={muted} onToggle={toggleMute} />
        </div>
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
        onKeyPress={(id) => {
          play(keyIdToMidi(id));
          dispatch({ type: 'answer', pressed: id });
        }}
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
