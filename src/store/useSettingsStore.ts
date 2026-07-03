import { create } from 'zustand';
import { DEFAULT_MODEL, DEFAULT_CONCURRENCY } from '../constants/defaults';
import { aiQueue } from '../services/execution/taskQueue';

const STORAGE_KEY = 'bxai-studio-settings';

interface SettingsState {
  apiKey: string;
  globalModel: string;
  maxConcurrency: number;
  setApiKey: (key: string) => void;
  setGlobalModel: (model: string) => void;
  setMaxConcurrency: (n: number) => void;
}

interface PersistedSettings {
  apiKey: string;
  globalModel: string;
  maxConcurrency: number;
}

function loadSettings(): PersistedSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        apiKey: parsed.apiKey || '',
        globalModel: parsed.globalModel || DEFAULT_MODEL,
        maxConcurrency: parsed.maxConcurrency || DEFAULT_CONCURRENCY,
      };
    }
  } catch {
    // ignore
  }
  return {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    globalModel: DEFAULT_MODEL,
    maxConcurrency: DEFAULT_CONCURRENCY,
  };
}

function persistSettings(state: PersistedSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const initial = loadSettings();
aiQueue.setConcurrency(initial.maxConcurrency);

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  apiKey: initial.apiKey,
  globalModel: initial.globalModel,
  maxConcurrency: initial.maxConcurrency,

  setApiKey: (key: string) => {
    set({ apiKey: key });
    const { globalModel, maxConcurrency } = get();
    persistSettings({ apiKey: key, globalModel, maxConcurrency });
  },

  setGlobalModel: (model: string) => {
    set({ globalModel: model });
    const { apiKey, maxConcurrency } = get();
    persistSettings({ apiKey, globalModel: model, maxConcurrency });
  },

  setMaxConcurrency: (n: number) => {
    set({ maxConcurrency: n });
    aiQueue.setConcurrency(n);
    const { apiKey, globalModel } = get();
    persistSettings({ apiKey, globalModel, maxConcurrency: n });
  },
}));
