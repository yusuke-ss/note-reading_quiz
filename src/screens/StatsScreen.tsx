import type { Clef } from '../types';
import { parseNoteId, SOLFEGE } from '../lib/notes';
import type { Profile } from '../lib/storage';
import './StatsScreen.css';

export interface StatsScreenProps {
  profile: Profile;
  onBack: () => void;
}

const CLEF_LABEL: Record<Clef, string> = { treble: 'ト音記号', bass: 'ヘ音記号' };
const CLEFS: Clef[] = ['treble', 'bass'];
// Below this many attempts, an accuracy percentage is too noisy to be
// meaningful (e.g. 0/1 reads as "0%", which overstates how weak the note
// really is), so it's shown as "データ不足" and sorted to the bottom instead.
const MIN_ATTEMPTS_FOR_RATE = 3;

interface NoteStatRow {
  noteId: string;
  correct: number;
  total: number;
}

// Notes for one clef, worst-accuracy-first so the notes needing the most
// practice surface at the top; notes with too few attempts to trust are
// pushed to the bottom regardless of their raw rate.
function sortedRowsForClef(profile: Profile, clef: Clef): NoteStatRow[] {
  const prefix = `${clef}:`;
  const rows: NoteStatRow[] = Object.entries(profile.noteStats)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, stat]) => ({ noteId: key.slice(prefix.length), correct: stat.correct, total: stat.total }));

  return rows.sort((a, b) => {
    const aInsufficient = a.total < MIN_ATTEMPTS_FOR_RATE;
    const bInsufficient = b.total < MIN_ATTEMPTS_FOR_RATE;
    if (aInsufficient !== bInsufficient) return aInsufficient ? 1 : -1;
    const rateA = a.total > 0 ? a.correct / a.total : 0;
    const rateB = b.total > 0 ? b.correct / b.total : 0;
    return rateA - rateB;
  });
}

function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

export function StatsScreen({ profile, onBack }: StatsScreenProps) {
  const hasAnyStats = Object.keys(profile.noteStats).length > 0;
  const recentSessions = [...profile.sessions].reverse().slice(0, 10);

  return (
    <div className="stats-screen">
      <h1>{profile.name} さんの せいせき</h1>

      <div className="stats-section">
        <h2>にがてな おと</h2>
        {!hasAnyStats && <p className="stats-empty">まだ記録がありません。クイズにちょうせんしてね！</p>}
        {CLEFS.map((clef) => {
          const rows = sortedRowsForClef(profile, clef);
          if (rows.length === 0) return null;
          return (
            <div key={clef}>
              <div className="stats-clef-heading">{CLEF_LABEL[clef]}</div>
              <ul className="stats-note-list">
                {rows.map((row) => {
                  const note = parseNoteId(row.noteId);
                  const label = `${SOLFEGE[note.letter]}${note.octave}`;
                  const insufficient = row.total < MIN_ATTEMPTS_FOR_RATE;
                  const pct = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
                  return (
                    <li key={row.noteId} className={`stats-note-row ${insufficient ? 'low-confidence' : ''}`}>
                      <span className="stats-note-label">{label}</span>
                      <span className="stats-note-bar-track">
                        <span className="stats-note-bar-fill" style={{ width: `${pct}%` }} />
                      </span>
                      {insufficient ? (
                        <span className="stats-note-pct insufficient">データ不足</span>
                      ) : (
                        <span className="stats-note-pct">{pct}%</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="stats-section">
        <h2>さいきんの きろく</h2>
        {recentSessions.length === 0 ? (
          <p className="stats-empty">まだ記録がありません。</p>
        ) : (
          <ul className="stats-session-list">
            {recentSessions.map((session, index) => (
              <li key={`${session.date}-${index}`} className="stats-session-row">
                <span>{formatSessionDate(session.date)}</span>
                <span>
                  {CLEF_LABEL[session.clef]} レベル{session.level}
                </span>
                <span className="stats-session-score">
                  {session.correct} / {session.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" className="secondary-button" onClick={onBack}>
        ホームへ
      </button>
    </div>
  );
}
