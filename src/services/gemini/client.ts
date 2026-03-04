import { GoogleGenAI } from '@google/genai';
import { useSettingsStore } from '../../store/useSettingsStore';

let clientInstance: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = useSettingsStore.getState().apiKey;

  if (!apiKey) {
    throw new Error(
      'No API key set. Click the Settings (gear) icon in the toolbar to enter your Google AI Studio API key.'
    );
  }

  // Recreate client if key changed
  if (!clientInstance || currentApiKey !== apiKey) {
    clientInstance = new GoogleGenAI({ apiKey });
    currentApiKey = apiKey;
  }

  return clientInstance;
}
