import { useEffect, useReducer } from 'react';
import type { Clef, Level, NoteId } from '../types';
import { keyIdToMidi, noteId, SOLFEGE } from '../lib/notes';
import { getKeyboardKeys } from '../lib/levels';
import { getFeedbackDelayMs, getProgress, initialQuizState, quizReducer, type QuizResult } from '../lib/quiz';
import { usePiano } from '../hooks/usePiano';
import { StaffDisplay } from '../components/StaffDisplay';
import { PianoKeyboard, type KeyHighlight } from '../components/PianoKeyboard';
import { FeedbackBanner, type Feedback } from '../components/FeedbackBanner';
import { MuteButton } from '../components/MuteButton';
import './QuizScreen.css';

export interface QuizSummary {
  correct: number;
  total: number;
  durationMs: number;
  // Every primary (non-review) question, in order, with its pass/fail --
  // the full log needed to aggregate per-note accuracy stats.
  results: QuizResult[];
  wrongNoteIds: NoteId[];
}

export interface QuizScreenProps {
  clef: Clef;
  level: Level;
  showLabels: boolean;
  onFinish: (summary: QuizSummary) => void;
}

const PRIMARY_TOTAL = 10;

export function QuizScreen({ clef, level, showLabels, onFinish }: QuizScreenProps) {
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
      results: state.results,
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

  // Auto-advance to the next question after feedback: quicker for a
  // correct answer, longer for a wrong one. Cleared on unmount and on
  // every phase change (including a manual tap-to-skip via `next`), so
  // there's never more than one pending timer.
  useEffect(() => {
    if (state.phase !== 'feedback' || !state.lastAnswer) return;
    const delay = getFeedbackDelayMs(state.lastAnswer.correct);
    const timer = setTimeout(() => dispatch({ type: 'next' }), delay);
    return () => clearTimeout(timer);
  }, [state.phase, state.lastAnswer]);

  if (!state.current) {
    return null;
  }

  const keyboardKeys = getKeyboardKeys(clef, level);
  const progress = getProgress(state, PRIMARY_TOTAL);

  const highlight: Record<NoteId, KeyHighlight> = {};
  let feedback: Feedback | null = null;

  if (state.phase === 'feedback' && state.lastAnswer) {
    const correctId = noteId(state.current.note);
    if (state.lastAnswer.correct) {
      highlight[state.lastAnswer.pressed] = 'correct';
      feedback = { kind: 'correct', answerLabel: SOLFEGE[state.current.note.letter] };
    } else {
      highlight[state.lastAnswer.pressed] = 'wrong';
      highlight[correctId] = 'answer';
      feedback = { kind: 'wrong', answerLabel: SOLFEGE[state.current.note.letter] };
    }
  }

  // Tapping anywhere on screen other than the (disabled, during feedback)
  // keyboard skips the auto-advance wait. Guarded by phase so a tap during
  // 'question' never fires this early (and the tap that produced the
  // answer itself still reads the pre-update 'question' phase from this
  // render's closure, so it can't immediately re-trigger 'next').
  const handleScreenTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (state.phase !== 'feedback') return;
    if ((event.target as HTMLElement).closest('.piano-keyboard')) return;
    dispatch({ type: 'next' });
  };

  return (
    <div className="quiz-screen" onClick={handleScreenTap}>
      <div className="quiz-header">
        <div className="quiz-progress">{progress.label}</div>
        <div className="quiz-header-controls">
          {loadState === 'loading' && <span className="quiz-loading">読みこみ中…</span>}
          <MuteButton muted={muted} onToggle={toggleMute} />
        </div>
      </div>
      <div className="quiz-staff-area">
        <StaffDisplay clef={clef} level={level} note={state.current.note} />
        <FeedbackBanner feedback={feedback} />
      </div>
      <PianoKeyboard
        keys={keyboardKeys}
        showLabels={showLabels}
        highlight={highlight}
        disabled={state.phase === 'feedback'}
        onKeyPress={(id) => {
          play(keyIdToMidi(id));
          dispatch({ type: 'answer', pressed: id });
        }}
      />
    </div>
  );
}
