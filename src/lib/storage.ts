import type { Clef, Level } from '../types';

const STORAGE_KEY = 'note-quiz:v1';
const MAX_SESSIONS = 200;

export interface ProfileSettings {
  clef: Clef;
  level: Level;
  showKeyLabels: boolean;
  muted: boolean;
  questionCount: number;
}

export interface SessionRecord {
  date: string;
  clef: Clef;
  level: Level;
  correct: number;
  total: number;
  durationMs: number;
}

export interface NoteStat {
  correct: number;
  total: number;
}

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  settings: ProfileSettings;
  sessions: SessionRecord[];
  // Keyed by `${clef}:${noteId}`, e.g. "treble:C4".
  noteStats: Record<string, NoteStat>;
}

export interface PersistedData {
  version: 1;
  activeProfileId: string | null;
  profiles: Profile[];
}

const DEFAULT_SETTINGS: ProfileSettings = {
  clef: 'treble',
  level: 1,
  showKeyLabels: true,
  muted: false,
  questionCount: 10,
};

function initialData(): PersistedData {
  return { version: 1, activeProfileId: null, profiles: [] };
}

// Guards every access: some browsers throw just *reading* localStorage in
// certain private-browsing modes, and this project's Vitest suite runs
// under plain Node (no DOM), where the global simply doesn't exist.
function getStorage(): Storage | null {
  try {
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

function isPersistedData(value: unknown): value is PersistedData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return data.version === 1 && Array.isArray(data.profiles);
}

export function load(): PersistedData {
  const storage = getStorage();
  if (!storage) return initialData();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return initialData();
    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedData(parsed)) return initialData();
    return {
      ...parsed,
      profiles: parsed.profiles.map((profile) => ({
        ...profile,
        settings: { ...DEFAULT_SETTINGS, ...profile.settings },
      })),
    };
  } catch (error) {
    console.error('note-quiz: failed to load saved data, resetting to defaults', error);
    return initialData();
  }
}

export function save(data: PersistedData): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Not fatal -- e.g. storage quota exceeded. The user just loses this
    // particular write; the app keeps working off in-memory state.
    console.error('note-quiz: failed to save data', error);
  }
}

function createId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listProfiles(): Profile[] {
  return load().profiles;
}

export function getActiveProfile(): Profile | null {
  const data = load();
  if (!data.activeProfileId) return null;
  return data.profiles.find((profile) => profile.id === data.activeProfileId) ?? null;
}

export function createProfile(name: string): Profile {
  const data = load();
  const profile: Profile = {
    id: createId(),
    name,
    createdAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS },
    sessions: [],
    noteStats: {},
  };
  data.profiles.push(profile);
  data.activeProfileId = profile.id;
  save(data);
  return profile;
}

export function deleteProfile(id: string): void {
  const data = load();
  data.profiles = data.profiles.filter((profile) => profile.id !== id);
  if (data.activeProfileId === id) {
    data.activeProfileId = data.profiles[0]?.id ?? null;
  }
  save(data);
}

export function setActiveProfile(id: string): void {
  const data = load();
  if (!data.profiles.some((profile) => profile.id === id)) return;
  data.activeProfileId = id;
  save(data);
}

export function updateSettings(profileId: string, settings: Partial<ProfileSettings>): void {
  const data = load();
  const profile = data.profiles.find((p) => p.id === profileId);
  if (!profile) return;
  profile.settings = { ...profile.settings, ...settings };
  save(data);
}

// Records one finished quiz set: appends the session (trimming the oldest
// once past MAX_SESSIONS) and folds `results` into per-note accuracy
// stats, keyed by clef so the same note letter/octave is tracked
// separately for treble vs. bass. Persists once for both updates.
export function recordSession(
  profileId: string,
  session: SessionRecord,
  results: { noteId: string; correct: boolean }[],
  clef: Clef,
): void {
  const data = load();
  const profile = data.profiles.find((p) => p.id === profileId);
  if (!profile) return;

  profile.sessions.push(session);
  if (profile.sessions.length > MAX_SESSIONS) {
    profile.sessions = profile.sessions.slice(profile.sessions.length - MAX_SESSIONS);
  }

  for (const result of results) {
    const key = `${clef}:${result.noteId}`;
    const stat = profile.noteStats[key] ?? { correct: 0, total: 0 };
    stat.total += 1;
    if (result.correct) stat.correct += 1;
    profile.noteStats[key] = stat;
  }

  save(data);
}
