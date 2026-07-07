import { useState } from 'react';
import type { Clef, Level } from './types';
import { initPiano } from './audio/piano';
import { QuizScreen, type QuizSummary } from './screens/QuizScreen';
import './App.css';

const CLEFS: { value: Clef; label: string }[] = [
  { value: 'treble', label: 'ト音記号' },
  { value: 'bass', label: 'ヘ音記号' },
];
const LEVELS: Level[] = [1, 2, 3];

type Screen = 'home' | 'quiz' | 'result';

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [clef, setClef] = useState<Clef>('treble');
  const [level, setLevel] = useState<Level>(1);
  const [summary, setSummary] = useState<QuizSummary | null>(null);

  if (screen === 'quiz') {
    return (
      <QuizScreen
        clef={clef}
        level={level}
        onFinish={(result) => {
          setSummary(result);
          setScreen('result');
        }}
      />
    );
  }

  if (screen === 'result' && summary) {
    return (
      <div className="home-screen">
        <h1>けっか</h1>
        <p className="result-score">
          {summary.correct} / {summary.total} 問正解
        </p>
        <p className="result-time">かかった時間: {formatDuration(summary.durationMs)}</p>
        <button type="button" className="primary-button" onClick={() => setScreen('home')}>
          もういちど
        </button>
      </div>
    );
  }

  return (
    <div className="home-screen">
      <h1>音符クイズ</h1>
      <p className="subtitle">譜表とレベルをえらんでね</p>

      <div className="choice-group">
        <h2>譜表</h2>
        <div className="choice-buttons">
          {CLEFS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`choice-button ${clef === c.value ? 'selected' : ''}`}
              onClick={() => setClef(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="choice-group">
        <h2>レベル</h2>
        <div className="choice-buttons">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              className={`choice-button ${level === l ? 'selected' : ''}`}
              onClick={() => setLevel(l)}
            >
              レベル{l}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={() => {
          // Create/resume the AudioContext synchronously inside this tap
          // handler (not awaited) -- iOS Safari only allows AudioContext
          // creation/resume while a user gesture is still "in progress".
          initPiano();
          setScreen('quiz');
        }}
      >
        スタート
      </button>
    </div>
  );
}

export default App;
