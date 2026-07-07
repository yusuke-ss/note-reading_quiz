import type { Clef, Level } from '../types';
import { formatDuration } from '../lib/format';
import { parseNoteId, SOLFEGE } from '../lib/notes';
import { StaffDisplay } from '../components/StaffDisplay';
import type { QuizSummary } from './QuizScreen';
import './ResultScreen.css';

export interface ResultScreenProps {
  clef: Clef;
  level: Level;
  summary: QuizSummary;
  onRetry: () => void;
  onHome: () => void;
}

export function ResultScreen({ clef, level, summary, onRetry, onHome }: ResultScreenProps) {
  const allCorrect = summary.total > 0 && summary.correct === summary.total;

  return (
    <div className="result-screen">
      <h1>けっか</h1>
      {allCorrect && <p className="result-celebration">🎉 ぜんもん せいかい!</p>}
      <p className="result-score">
        {summary.correct} / {summary.total} 問正解
      </p>
      <p className="result-time">かかった時間 {formatDuration(summary.durationMs)}</p>

      {summary.wrongNoteIds.length > 0 && (
        <div className="result-wrong">
          <h2>まちがえた おと</h2>
          <ul className="result-wrong-list">
            {summary.wrongNoteIds.map((id, index) => {
              const note = parseNoteId(id);
              return (
                <li key={`${id}-${index}`} className="result-wrong-item">
                  <StaffDisplay clef={clef} level={level} note={note} />
                  <span className="result-wrong-label">{SOLFEGE[note.letter]}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="result-actions">
        <button type="button" className="primary-button" onClick={onRetry}>
          もういちど
        </button>
        <button type="button" className="secondary-button" onClick={onHome}>
          ホームへ
        </button>
      </div>
    </div>
  );
}
