import { useCallback, useSyncExternalStore } from 'react';
import { getPianoSnapshot, isMuted, playNote, setMuted, subscribePiano } from '../audio/piano';

// Thin React binding over the audio/piano.ts singleton. Deliberately not
// unit-tested here: the underlying state machine (load transitions, mute
// gating, subscriber notifications) is covered directly in
// src/audio/piano.test.ts without needing a DOM; this hook is pure
// react-glue wiring that a project without jsdom/testing-library cannot
// exercise meaningfully in isolation.
export function usePiano() {
  const snapshot = useSyncExternalStore(subscribePiano, getPianoSnapshot);

  const toggleMute = useCallback(() => {
    setMuted(!isMuted());
  }, []);

  const play = useCallback((midi: number, durationSec?: number) => {
    playNote(midi, durationSec);
  }, []);

  return {
    loadState: snapshot.loadState,
    progress: snapshot.progress,
    muted: snapshot.muted,
    toggleMute,
    play,
  };
}
