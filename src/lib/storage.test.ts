import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Clef } from '../types';

// Minimal in-memory Storage implementation -- this project has no jsdom
// dependency (Vitest runs under the plain "node" environment, which has no
// global localStorage), so tests provide their own fake rather than pull in
// a DOM environment just for this.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

let memoryStorage: MemoryStorage;

beforeEach(() => {
  memoryStorage = new MemoryStorage();
  vi.stubGlobal('localStorage', memoryStorage);
});

const STORAGE_KEY = 'note-quiz:v1';

import {
  createProfile,
  deleteProfile,
  getActiveProfile,
  listProfiles,
  load,
  recordSession,
  save,
  setActiveProfile,
  updateSettings,
} from './storage';

describe('load', () => {
  it('returns an empty initial structure when nothing is stored', () => {
    expect(load()).toEqual({ version: 1, activeProfileId: null, profiles: [] });
  });

  it('falls back to the initial structure on invalid JSON', () => {
    memoryStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(load()).toEqual({ version: 1, activeProfileId: null, profiles: [] });
  });

  it('falls back to the initial structure on a version mismatch', () => {
    memoryStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, activeProfileId: null, profiles: [] }));
    expect(load()).toEqual({ version: 1, activeProfileId: null, profiles: [] });
  });

  it('falls back to the initial structure when profiles is missing/malformed', () => {
    memoryStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, activeProfileId: null }));
    expect(load()).toEqual({ version: 1, activeProfileId: null, profiles: [] });
  });
});

describe('save', () => {
  it('round-trips through load()', () => {
    const data = { version: 1 as const, activeProfileId: 'p1', profiles: [] };
    save(data);
    expect(load()).toEqual(data);
  });

  it('swallows write failures (e.g. quota exceeded) without throwing', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(memoryStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => save({ version: 1, activeProfileId: null, profiles: [] })).not.toThrow();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('profile CRUD', () => {
  it('createProfile adds a profile with defaults and makes it active', () => {
    const profile = createProfile('たろう');
    expect(profile.name).toBe('たろう');
    expect(profile.settings).toEqual({ clef: 'treble', level: 1, showKeyLabels: true, muted: false });
    expect(profile.sessions).toEqual([]);
    expect(profile.noteStats).toEqual({});
    expect(profile.id).toBeTruthy();

    expect(listProfiles()).toHaveLength(1);
    expect(getActiveProfile()?.id).toBe(profile.id);
  });

  it('createProfile assigns distinct ids across multiple profiles', () => {
    const a = createProfile('A');
    const b = createProfile('B');
    expect(a.id).not.toBe(b.id);
    expect(listProfiles()).toHaveLength(2);
  });

  it('setActiveProfile switches the active profile', () => {
    const a = createProfile('A');
    const b = createProfile('B');
    setActiveProfile(a.id);
    expect(getActiveProfile()?.id).toBe(a.id);
    setActiveProfile(b.id);
    expect(getActiveProfile()?.id).toBe(b.id);
  });

  it('deleteProfile removes the profile and reassigns active if it was active', () => {
    const a = createProfile('A');
    const b = createProfile('B');
    setActiveProfile(a.id);
    deleteProfile(a.id);
    expect(listProfiles().map((p) => p.id)).toEqual([b.id]);
    expect(getActiveProfile()?.id).toBe(b.id);
  });

  it('deleteProfile clears active profile when it was the last one', () => {
    const a = createProfile('A');
    deleteProfile(a.id);
    expect(listProfiles()).toEqual([]);
    expect(getActiveProfile()).toBeNull();
  });

  it('getActiveProfile returns null when no profile has ever been created', () => {
    expect(getActiveProfile()).toBeNull();
  });

  it('updateSettings merges a partial settings patch', () => {
    const profile = createProfile('A');
    updateSettings(profile.id, { clef: 'bass', muted: true });
    const updated = getActiveProfile();
    expect(updated?.settings).toEqual({ clef: 'bass', level: 1, showKeyLabels: true, muted: true });
  });
});

describe('recordSession', () => {
  const session = (overrides: Partial<{ correct: number; total: number }> = {}) => ({
    date: '2026-07-07T00:00:00.000Z',
    clef: 'treble' as Clef,
    level: 1 as const,
    correct: overrides.correct ?? 8,
    total: overrides.total ?? 10,
    durationMs: 42000,
  });

  it('appends the session record', () => {
    const profile = createProfile('A');
    recordSession(profile.id, session(), [], 'treble');
    const updated = getActiveProfile();
    expect(updated?.sessions).toHaveLength(1);
    expect(updated?.sessions[0]).toEqual(session());
  });

  it('aggregates noteStats keyed by "clef:noteId", accumulating across calls', () => {
    const profile = createProfile('A');
    recordSession(
      profile.id,
      session(),
      [
        { noteId: 'C4', correct: true },
        { noteId: 'C4', correct: false },
        { noteId: 'D4', correct: true },
      ],
      'treble',
    );
    recordSession(
      profile.id,
      session(),
      [{ noteId: 'C4', correct: true }],
      'treble',
    );

    const updated = getActiveProfile();
    expect(updated?.noteStats).toEqual({
      'treble:C4': { correct: 2, total: 3 },
      'treble:D4': { correct: 1, total: 1 },
    });
  });

  it('keeps stats separate per clef even for the same note letter/octave', () => {
    const profile = createProfile('A');
    recordSession(profile.id, session(), [{ noteId: 'C4', correct: true }], 'treble');
    recordSession(profile.id, session(), [{ noteId: 'C4', correct: false }], 'bass');

    const updated = getActiveProfile();
    expect(updated?.noteStats).toEqual({
      'treble:C4': { correct: 1, total: 1 },
      'bass:C4': { correct: 0, total: 1 },
    });
  });

  it('caps stored sessions at 200, dropping the oldest first', () => {
    const profile = createProfile('A');
    for (let i = 0; i < 205; i++) {
      recordSession(profile.id, { ...session(), date: `session-${i}` }, [], 'treble');
    }
    const updated = getActiveProfile();
    expect(updated?.sessions).toHaveLength(200);
    expect(updated?.sessions[0].date).toBe('session-5');
    expect(updated?.sessions[199].date).toBe('session-204');
  });
});
