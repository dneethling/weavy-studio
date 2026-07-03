import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Expose stores for debugging in dev
if (import.meta.env.DEV) {
  const devWindow = window as unknown as Record<string, unknown>;
  import('./store/useWorkflowStore').then(m => {
    devWindow.__workflowStore = m.useWorkflowStore;
  });
  import('./store/useExecutionStore').then(m => {
    devWindow.__executionStore = m.useExecutionStore;
  });
  import('./store/useSettingsStore').then(m => {
    devWindow.__settingsStore = m.useSettingsStore;
  });
  import('./store/useToastStore').then(m => {
    devWindow.__toastStore = m.useToastStore;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
