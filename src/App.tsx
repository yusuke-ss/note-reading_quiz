import { useEffect, useState } from 'react';
import { setMuted } from './audio/piano';
import { getActiveProfile, recordSession, updateSettings, type Profile } from './lib/storage';
import { ProfileScreen } from './screens/ProfileScreen';
import { HomeScreen, type HomeStartSettings } from './screens/HomeScreen';
import { QuizScreen, type QuizSummary } from './screens/QuizScreen';
import { ResultScreen } from './screens/ResultScreen';
import { StatsScreen } from './screens/StatsScreen';

type Screen = 'profiles' | 'home' | 'quiz' | 'result' | 'stats';

function settingsFromProfile(profile: Profile): HomeStartSettings {
  return {
    clef: profile.settings.clef,
    level: profile.settings.level,
    showKeyLabels: profile.settings.showKeyLabels,
    questionCount: profile.settings.questionCount ?? 10,
  };
}

function App() {
  const [profile, setProfile] = useState<Profile | null>(() => getActiveProfile());
  const [screen, setScreen] = useState<Screen>(() => (profile ? 'home' : 'profiles'));
  const [settings, setSettings] = useState<HomeStartSettings>(() =>
    profile
      ? settingsFromProfile(profile)
      : { clef: 'treble', level: 1, showKeyLabels: true, questionCount: 10 },
  );
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  // Bumped on every quiz (re)start so QuizScreen remounts with fresh state
  // instead of reusing its useReducer instance across attempts.
  const [quizKey, setQuizKey] = useState(0);

  // The audio singleton's mute flag lives outside React state, so sync it
  // from the active profile's saved setting whenever the active profile
  // changes (e.g. right after picking a profile).
  useEffect(() => {
    if (profile) setMuted(profile.settings.muted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.settings.muted]);

  const handleProfileSelected = (selected: Profile) => {
    setProfile(selected);
    setSettings(settingsFromProfile(selected));
    setScreen('home');
  };

  const handleSettingsChange = (patch: Partial<HomeStartSettings>) => {
    if (!profile) return;
    setSettings((prev) => ({ ...prev, ...patch }));
    updateSettings(profile.id, patch);
  };

  if (screen === 'profiles' || !profile) {
    return <ProfileScreen onSelect={handleProfileSelected} />;
  }

  if (screen === 'stats') {
    return <StatsScreen profile={profile} onBack={() => setScreen('home')} />;
  }

  if (screen === 'quiz') {
    return (
      <QuizScreen
        key={quizKey}
        clef={settings.clef}
        level={settings.level}
        showLabels={settings.showKeyLabels}
        questionCount={settings.questionCount}
        onFinish={(result) => {
          recordSession(
            profile.id,
            {
              date: new Date().toISOString(),
              clef: settings.clef,
              level: settings.level,
              correct: result.correct,
              total: result.total,
              durationMs: result.durationMs,
            },
            result.results,
            settings.clef,
          );
          // Re-read from storage so StatsScreen (and a remounted HomeScreen)
          // see the session/noteStats update that recordSession just wrote.
          setProfile(getActiveProfile());
          setSummary(result);
          setScreen('result');
        }}
      />
    );
  }

  if (screen === 'result' && summary) {
    return (
      <ResultScreen
        clef={settings.clef}
        level={settings.level}
        summary={summary}
        onRetry={() => {
          setQuizKey((key) => key + 1);
          setScreen('quiz');
        }}
        onHome={() => setScreen('home')}
      />
    );
  }

  return (
    <HomeScreen
      profile={profile}
      settings={settings}
      onSettingsChange={handleSettingsChange}
      onStart={() => {
        setQuizKey((key) => key + 1);
        setScreen('quiz');
      }}
      onShowStats={() => setScreen('stats')}
      onSwitchProfile={() => setScreen('profiles')}
    />
  );
}

export default App;
