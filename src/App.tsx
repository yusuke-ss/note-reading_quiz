import { useState } from 'react';
import type { Clef, Level } from './types';
import { initPiano } from './audio/piano';
import { QuizScreen, type QuizSummary } from './screens/QuizScreen';
import { ResultScreen } from './screens/ResultScreen';
import './App.css';

const CLEFS: { value: Clef; label: string }[] = [
  { value: 'treble', label: 'ト音記号' },
  { value: 'bass', label: 'ヘ音記号' },
];
const LEVELS: Level[] = [1, 2, 3];

type Screen = 'home' | 'quiz' | 'result';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [clef, setClef] = useState<Clef>('treble');
  const [level, setLevel] = useState<Level>(1);
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  // Bumped on every quiz (re)start so QuizScreen remounts with fresh state
  // instead of reusing its useReducer instance across attempts.
  const [quizKey, setQuizKey] = useState(0);

  if (screen === 'quiz') {
    return (
      <QuizScreen
        key={quizKey}
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
      <ResultScreen
        clef={clef}
        summary={summary}
        onRetry={() => {
          initPiano();
          setQuizKey((key) => key + 1);
          setScreen('quiz');
        }}
        onHome={() => setScreen('home')}
      />
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
