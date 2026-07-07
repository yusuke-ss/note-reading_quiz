import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetForTest,
  getLoadState,
  getPianoSnapshot,
  initPiano,
  isMuted,
  playNote,
  setMuted,
  subscribePiano,
  type PianoAudioContext,
  type PianoInstrument,
} from './piano';

function makeContext(state: 'running' | 'suspended' = 'running'): PianoAudioContext {
  return {
    state,
    resume: vi.fn().mockResolvedValue(undefined),
  };
}

function makeInstrument(ready: Promise<void> = Promise.resolve()): PianoInstrument {
  return {
    ready,
    start: vi.fn(),
  };
}

describe('audio/piano', () => {
  beforeEach(() => {
    _resetForTest();
  });

  it('starts idle and unmuted', () => {
    expect(getLoadState()).toBe('idle');
    expect(isMuted()).toBe(false);
  });

  it('creates the context and instrument exactly once, even if initPiano is called twice', () => {
    const createContext = vi.fn(() => makeContext());
    const createInstrument = vi.fn(() => makeInstrument());
    _resetForTest({ createContext, createInstrument });

    initPiano();
    initPiano();

    expect(createContext).toHaveBeenCalledTimes(1);
    expect(createInstrument).toHaveBeenCalledTimes(1);
  });

  it('resumes a suspended context during init', () => {
    const context = makeContext('suspended');
    _resetForTest({ createContext: () => context, createInstrument: () => makeInstrument() });

    initPiano();

    expect(context.resume).toHaveBeenCalledTimes(1);
  });

  it('transitions loading -> ready once the instrument resolves', async () => {
    _resetForTest({ createContext: () => makeContext(), createInstrument: () => makeInstrument() });

    const ready = initPiano();
    expect(getLoadState()).toBe('loading');
    await ready;

    expect(getLoadState()).toBe('ready');
  });

  it('does not play a note before the instrument is ready', () => {
    const instrument = makeInstrument(new Promise(() => {}));
    _resetForTest({ createContext: () => makeContext(), createInstrument: () => instrument });

    initPiano();
    playNote(60);

    expect(instrument.start).not.toHaveBeenCalled();
  });

  it('plays the given MIDI note with the given duration once ready', async () => {
    const instrument = makeInstrument();
    _resetForTest({ createContext: () => makeContext(), createInstrument: () => instrument });

    await initPiano();
    playNote(60, 2);

    expect(instrument.start).toHaveBeenCalledWith({ note: 60, duration: 2 });
  });

  it('defaults to a 1 second duration when none is given', async () => {
    const instrument = makeInstrument();
    _resetForTest({ createContext: () => makeContext(), createInstrument: () => instrument });

    await initPiano();
    playNote(67);

    expect(instrument.start).toHaveBeenCalledWith({ note: 67, duration: 1 });
  });

  it('does nothing when muted, even once ready', async () => {
    const instrument = makeInstrument();
    _resetForTest({ createContext: () => makeContext(), createInstrument: () => instrument });

    await initPiano();
    setMuted(true);
    playNote(60);

    expect(instrument.start).not.toHaveBeenCalled();
    expect(isMuted()).toBe(true);
  });

  it('resumes the context defensively before playing (iOS background resume)', async () => {
    const context = makeContext('running');
    const instrument = makeInstrument();
    _resetForTest({ createContext: () => context, createInstrument: () => instrument });

    await initPiano();
    context.state = 'suspended';
    playNote(60);

    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(instrument.start).toHaveBeenCalled();
  });

  it('falls back to idle on load failure, allowing a retry', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const createInstrument = vi
      .fn()
      .mockImplementationOnce(() => makeInstrument(Promise.reject(new Error('network error'))))
      .mockImplementationOnce(() => makeInstrument());
    _resetForTest({ createContext: () => makeContext(), createInstrument });

    await initPiano();
    expect(getLoadState()).toBe('idle');

    await initPiano();
    expect(getLoadState()).toBe('ready');
    expect(createInstrument).toHaveBeenCalledTimes(2);

    errorSpy.mockRestore();
  });

  it('notifies subscribers when load state and mute state change', async () => {
    _resetForTest({ createContext: () => makeContext(), createInstrument: () => makeInstrument() });
    const listener = vi.fn();
    subscribePiano(listener);

    await initPiano();
    setMuted(true);

    expect(listener).toHaveBeenCalled();
    expect(getPianoSnapshot()).toEqual({ loadState: 'ready', muted: true, progress: null });
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribePiano(listener);

    unsubscribe();
    setMuted(true);

    expect(listener).not.toHaveBeenCalled();
  });

  it('reports load progress through onLoadProgress and the snapshot', () => {
    let capturedOnProgress: ((progress: { loaded: number; total: number }) => void) | undefined;
    const createInstrument = vi.fn((_context: PianoAudioContext, onProgress?: (p: { loaded: number; total: number }) => void) => {
      capturedOnProgress = onProgress;
      return makeInstrument(new Promise(() => {}));
    });
    _resetForTest({ createContext: () => makeContext(), createInstrument });

    const onProgress = vi.fn();
    initPiano(onProgress);
    capturedOnProgress?.({ loaded: 3, total: 10 });

    expect(onProgress).toHaveBeenCalledWith({ loaded: 3, total: 10 });
    expect(getPianoSnapshot().progress).toEqual({ loaded: 3, total: 10 });
  });
});
