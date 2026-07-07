import { CacheStorage, SplendidGrandPiano } from 'smplr';

export type LoadState = 'idle' | 'loading' | 'ready';

export interface LoadProgress {
  loaded: number;
  total: number;
}

// Minimal surfaces we depend on -- narrower than smplr's real types so tests
// can supply plain fakes without satisfying the full Smplr/AudioContext
// interfaces.
export interface PianoAudioContext {
  state: AudioContextState;
  resume(): Promise<void>;
}

export interface PianoInstrument {
  readonly ready: Promise<void>;
  start(event: { note: number; duration?: number }): unknown;
}

export type CreateContextFn = () => PianoAudioContext;
export type CreateInstrumentFn = (
  context: PianoAudioContext,
  onProgress?: (progress: LoadProgress) => void,
) => PianoInstrument;

function createDefaultContext(): PianoAudioContext {
  const AudioContextCtor: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new AudioContextCtor();
}

function createDefaultInstrument(
  context: PianoAudioContext,
  onProgress?: (progress: LoadProgress) => void,
): PianoInstrument {
  return SplendidGrandPiano(context as unknown as AudioContext, {
    storage: CacheStorage(),
    onLoadProgress: onProgress,
  });
}

let createContext: CreateContextFn = createDefaultContext;
let createInstrument: CreateInstrumentFn = createDefaultInstrument;

let audioContext: PianoAudioContext | null = null;
let instrument: PianoInstrument | null = null;
let readyPromise: Promise<void> | null = null;

export interface PianoSnapshot {
  loadState: LoadState;
  muted: boolean;
  progress: LoadProgress | null;
}

let snapshot: PianoSnapshot = { loadState: 'idle', muted: false, progress: null };
const listeners = new Set<() => void>();

function updateSnapshot(partial: Partial<PianoSnapshot>): void {
  snapshot = { ...snapshot, ...partial };
  for (const listener of listeners) listener();
}

export function subscribePiano(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPianoSnapshot(): PianoSnapshot {
  return snapshot;
}

export function getLoadState(): LoadState {
  return snapshot.loadState;
}

export function isMuted(): boolean {
  return snapshot.muted;
}

export function setMuted(muted: boolean): void {
  updateSnapshot({ muted });
}

// Initializes the piano (AudioContext + smplr instrument). Idempotent: once
// a context exists, subsequent calls return the existing ready-promise
// instead of re-initializing. Must be invoked from inside a user gesture
// handler (e.g. a button's onClick) so the AudioContext is created -- and
// resumed -- while iOS Safari still considers the tap "in progress".
export function initPiano(onProgress?: (progress: LoadProgress) => void): Promise<void> {
  if (audioContext) {
    return readyPromise ?? Promise.resolve();
  }

  audioContext = createContext();
  updateSnapshot({ loadState: 'loading', progress: null });

  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  instrument = createInstrument(audioContext, (progress) => {
    updateSnapshot({ progress });
    onProgress?.(progress);
  });

  readyPromise = instrument.ready
    .then(() => {
      updateSnapshot({ loadState: 'ready' });
    })
    .catch((error: unknown) => {
      console.error('[piano] failed to load piano samples', error);
      audioContext = null;
      instrument = null;
      updateSnapshot({ loadState: 'idle', progress: null });
    });

  return readyPromise;
}

// Plays a MIDI note. Silently does nothing if muted or not yet loaded --
// callers are not expected to gate on load state themselves. Resumes the
// context defensively in case it was suspended in the background (iOS).
export function playNote(midi: number, durationSec = 1): void {
  if (snapshot.muted) return;
  if (snapshot.loadState !== 'ready' || !instrument || !audioContext) return;

  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  instrument.start({ note: midi, duration: durationSec });
}

export function _resetForTest(overrides?: {
  createContext?: CreateContextFn;
  createInstrument?: CreateInstrumentFn;
}): void {
  audioContext = null;
  instrument = null;
  readyPromise = null;
  snapshot = { loadState: 'idle', muted: false, progress: null };
  listeners.clear();
  createContext = overrides?.createContext ?? createDefaultContext;
  createInstrument = overrides?.createInstrument ?? createDefaultInstrument;
}
