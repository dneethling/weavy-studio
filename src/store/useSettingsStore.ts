import { create } from 'zustand';
import { DEFAULT_MODEL } from '../constants/defaults';

const STORAGE_KEY = 'bxai-studio-settings';

interface SettingsState {
  apiKey: string;
  globalModel: string;
  setApiKey: (key: string) => void;
  setGlobalModel: (model: string) => void;
}

function loadSettings(): { apiKey: string; globalModel: string } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        apiKey: parsed.apiKey || '',
        globalModel: parsed.globalModel || DEFAULT_MODEL,
      };
    }
  } catch {
    // ignore
  }
  return {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    globalModel: DEFAULT_MODEL,
  };
}

function persistSettings(state: { apiKey: string; globalModel: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const initial = loadSettings();

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  apiKey: initial.apiKey,
  globalModel: initial.globalModel,

  setApiKey: (key: string) => {
    set({ apiKey: key });
    persistSettings({ apiKey: key, globalModel: get().globalModel });
  },

  setGlobalModel: (model: string) => {
    set({ globalModel: model });
    persistSettings({ apiKey: get().apiKey, globalModel: model });
  },
}));
