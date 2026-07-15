import type { Clef, Level } from '../types';
import type { Profile } from '../lib/storage';
import { updateSettings } from '../lib/storage';
import { initPiano } from '../audio/piano';
import { usePiano } from '../hooks/usePiano';
import { MuteButton } from '../components/MuteButton';
import './HomeScreen.css';

const CLEFS: { value: Clef; label: string }[] = [
  { value: 'treble', label: 'ト音記号' },
  { value: 'bass', label: 'ヘ音記号' },
];
const LEVELS: Level[] = [1, 2, 3];
const QUESTION_COUNTS = [5, 10, 15, 20] as const;

export interface HomeStartSettings {
  clef: Clef;
  level: Level;
  showKeyLabels: boolean;
  questionCount: number;
}

export interface HomeScreenProps {
  profile: Profile;
  settings: HomeStartSettings;
  onSettingsChange: (patch: Partial<HomeStartSettings>) => void;
  onStart: () => void;
  onShowStats: () => void;
  onSwitchProfile: () => void;
}

export function HomeScreen({
  profile,
  settings,
  onSettingsChange,
  onStart,
  onShowStats,
  onSwitchProfile,
}: HomeScreenProps) {
  const { muted, toggleMute } = usePiano();

  const handleToggleMute = () => {
    const next = !muted;
    toggleMute();
    // Mute isn't part of the lifted `settings` (it lives in the audio
    // singleton, not React state), so it's persisted directly here.
    updateSettings(profile.id, { muted: next });
  };

  return (
    <div className="home-screen">
      <div className="home-header">
        <span className="home-profile-name">{profile.name} さん</span>
        <button type="button" className="link-button" onClick={onSwitchProfile}>
          プロフィールをかえる
        </button>
      </div>

      <h1>音符クイズ</h1>
      <p className="subtitle">譜表とレベルをえらんでね</p>

      <div className="choice-group">
        <h2>譜表</h2>
        <div className="choice-buttons">
          {CLEFS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`choice-button ${settings.clef === c.value ? 'selected' : ''}`}
              onClick={() => onSettingsChange({ clef: c.value })}
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
              className={`choice-button ${settings.level === l ? 'selected' : ''}`}
              onClick={() => onSettingsChange({ level: l })}
            >
              レベル{l}
            </button>
          ))}
        </div>
      </div>

      <div className="choice-group">
        <h2>問題数</h2>
        <div className="choice-buttons" aria-label="問題数">
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              className={`choice-button ${settings.questionCount === count ? 'selected' : ''}`}
              onClick={() => onSettingsChange({ questionCount: count })}
            >
              {count}問
            </button>
          ))}
        </div>
      </div>

      <div className="choice-group">
        <h2>設定</h2>
        <div className="home-toggle-row">
          <label className="home-toggle">
            <input
              type="checkbox"
              checked={settings.showKeyLabels}
              onChange={() => onSettingsChange({ showKeyLabels: !settings.showKeyLabels })}
            />
            ドレミラベルを表示
          </label>
          <MuteButton muted={muted} onToggle={handleToggleMute} />
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
          onStart();
        }}
      >
        スタート
      </button>

      <div className="home-actions">
        <button type="button" className="secondary-button" onClick={onShowStats}>
          せいせき
        </button>
      </div>
    </div>
  );
}
