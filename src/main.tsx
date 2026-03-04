import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Expose stores for debugging in dev
if (import.meta.env.DEV) {
  import('./store/useWorkflowStore').then(m => {
    (window as any).__workflowStore = m.useWorkflowStore;
  });
  import('./store/useExecutionStore').then(m => {
    (window as any).__executionStore = m.useExecutionStore;
  });
  import('./store/useSettingsStore').then(m => {
    (window as any).__settingsStore = m.useSettingsStore;
  });
  import('./store/useToastStore').then(m => {
    (window as any).__toastStore = m.useToastStore;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
