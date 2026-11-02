import { AppSettings, ExecutionEvent, WorkflowRun } from '../domain/types';

const STORAGE_KEYS = {
  RUNS: 'agentvault_runs_v1',
  EVENTS: 'agentvault_events_v1',
  SETTINGS: 'agentvault_settings_v1'
};

export const DEFAULT_SETTINGS: AppSettings = {
  autoSpeakResults: false,
  speechVoiceName: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  stepTimeoutSeconds: 60,
  showAdvancedLogs: false,
  preferredModel: 'gemini-3.8-flash'
};

// In-memory fallback if localStorage fails
const memoryStore: Record<string, string> = {};

function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore[key] || null;
  } catch (err) {
    console.warn(`Storage read error for key "${key}":`, err);
    return memoryStore[key] || null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    memoryStore[key] = value;
  } catch (err) {
    console.warn(`Storage write error for key "${key}":`, err);
    memoryStore[key] = value;
  }
}

export function loadStoredRuns(): WorkflowRun[] {
  const data = safeGet(STORAGE_KEYS.RUNS);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse stored runs:', err);
    return [];
  }
}

export function saveStoredRuns(runs: WorkflowRun[]): void {
  // Keep last 30 runs to avoid hitting storage quotas
  const trimmed = runs.slice(0, 30);
  safeSet(STORAGE_KEYS.RUNS, JSON.stringify(trimmed));
}

export function loadStoredEvents(): ExecutionEvent[] {
  const data = safeGet(STORAGE_KEYS.EVENTS);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse stored events:', err);
    return [];
  }
}

export function saveStoredEvents(events: ExecutionEvent[]): void {
  // Keep last 200 events
  const trimmed = events.slice(0, 200);
  safeSet(STORAGE_KEYS.EVENTS, JSON.stringify(trimmed));
}

export function loadStoredSettings(): AppSettings {
  const data = safeGet(STORAGE_KEYS.SETTINGS);
  if (!data) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function clearAllHistory(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEYS.RUNS);
      window.localStorage.removeItem(STORAGE_KEYS.EVENTS);
    }
  } catch {}
  delete memoryStore[STORAGE_KEYS.RUNS];
  delete memoryStore[STORAGE_KEYS.EVENTS];
}

export function exportHistoryAsJson(runs: WorkflowRun[], events: ExecutionEvent[]): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    platform: 'AgentVault X',
    version: '1.0.0',
    runs,
    events
  };
  return JSON.stringify(payload, null, 2);
}
