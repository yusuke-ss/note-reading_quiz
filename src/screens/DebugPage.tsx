import { useState } from 'react';
import type { Clef, Level } from '../types';
import { noteId } from '../lib/notes';
import { getQuestionPool } from '../lib/levels';
import { StaffDisplay } from '../components/StaffDisplay';
import './DebugPage.css';

const CLEFS: { value: Clef; label: string }[] = [
  { value: 'treble', label: 'ト音記号' },
  { value: 'bass', label: 'ヘ音記号' },
];
const LEVELS: Level[] = [1, 2, 3];

export function DebugPage() {
  const [clef, setClef] = useState<Clef>('treble');
  const [level, setLevel] = useState<Level>(1);

  const notes = getQuestionPool(clef, level);

  return (
    <div className="debug-page">
      <h1>デバッグ: 出題音域の一覧描画</h1>
      <div className="debug-controls">
        <label>
          譜表
          <select value={clef} onChange={(e) => setClef(e.target.value as Clef)}>
            {CLEFS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          レベル
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value) as Level)}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                レベル{l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p>{notes.length} 音</p>
      <div className="debug-grid">
        {notes.map((note) => (
          <div key={noteId(note)} className="debug-cell">
            <StaffDisplay clef={clef} note={note} />
            <span>{noteId(note)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
