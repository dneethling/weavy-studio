import { Play, Square, Save, FolderOpen, Trash2, Zap, Settings, LogOut } from 'lucide-react';
import { Button } from '../shared/Button';
import { useExecutionStore } from '../../store/useExecutionStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { executeWorkflow } from '../../services/execution/engine';
import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { saveWorkflow, loadWorkflows, deleteWorkflow } from '../../services/storage/workflowStorage';
import { GEMINI_MODELS } from '../../constants/defaults';

export function TopToolbar() {
  const isRunning = useExecutionStore((s) => s.isRunning);
  const resetExecution = useExecutionStore((s) => s.resetExecution);
  const clearWorkflow = useWorkflowStore((s) => s.clearWorkflow);
  const getWorkflowJSON = useWorkflowStore((s) => s.getWorkflowJSON);
  const loadWorkflow = useWorkflowStore((s) => s.loadWorkflow);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const globalModel = useSettingsStore((s) => s.globalModel);
  const setGlobalModel = useSettingsStore((s) => s.setGlobalModel);
  const addToast = useToastStore((s) => s.addToast);
  const authUser = useAuthStore((s) => s.user);
  const authSignOut = useAuthStore((s) => s.signOut);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedWorkflows, setSavedWorkflows] = useState<ReturnType<typeof loadWorkflows>>([]);
  const [tempApiKey, setTempApiKey] = useState('');

  const handleRun = async () => {
    if (isRunning) return;

    // Check API key before running
    if (!apiKey.trim()) {
      addToast('error', 'No API key set. Click the ⚙ Settings button to enter your Google AI Studio API key.');
      setShowSettingsModal(true);
      setTempApiKey('');
      return;
    }

    // Check if there are nodes
    const { nodes } = useWorkflowStore.getState();
    if (nodes.length === 0) {
      addToast('error', 'No nodes in the workflow. Drag nodes from the sidebar onto the canvas.');
      return;
    }

    addToast('info', 'Running workflow...');

    try {
      await executeWorkflow();
      addToast('success', 'Workflow completed successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      addToast('error', `Workflow failed: ${message}`);
      console.error('Workflow execution failed:', err);
    }
  };

  const handleStop = () => {
    resetExecution();
    addToast('info', 'Workflow stopped.');
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    const { nodes, edges } = getWorkflowJSON();
    saveWorkflow(saveName.trim(), nodes, edges);
    setSaveName('');
    setShowSaveModal(false);
    addToast('success', `Workflow "${saveName.trim()}" saved.`);
  };

  const handleOpenLoad = () => {
    setSavedWorkflows(loadWorkflows());
    setShowLoadModal(true);
  };

  const handleLoad = (id: string) => {
    const workflows = loadWorkflows();
    const wf = workflows.find((w) => w.id === id);
    if (wf) {
      loadWorkflow(wf.nodes, wf.edges);
      resetExecution();
      addToast('success', `Workflow "${wf.name}" loaded.`);
    }
    setShowLoadModal(false);
  };

  const handleDelete = (id: string) => {
    deleteWorkflow(id);
    setSavedWorkflows(loadWorkflows());
  };

  const handleOpenSettings = () => {
    setTempApiKey(apiKey);
    setShowSettingsModal(true);
  };

  const handleSaveApiKey = () => {
    setApiKey(tempApiKey.trim());
    setShowSettingsModal(false);
    if (tempApiKey.trim()) {
      addToast('success', 'API key saved.');
    }
  };

  return (
    <>
      <div className="bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-purple-400" />
          <span className="text-sm font-semibold text-zinc-100">BxAI Studio</span>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button variant="danger" size="sm" onClick={handleStop}>
              <Square size={14} />
              Stop
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleRun}>
              <Play size={14} />
              Run
            </Button>
          )}

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Global Model Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Model</span>
            <select
              value={globalModel}
              onChange={(e) => {
                setGlobalModel(e.target.value);
                addToast('info', `Model changed to ${GEMINI_MODELS.find(m => m.id === e.target.value)?.label || e.target.value}`);
              }}
              className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer hover:border-zinc-600 max-w-[200px]"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          <Button variant="ghost" size="sm" onClick={() => setShowSaveModal(true)}>
            <Save size={14} />
            Save
          </Button>

          <Button variant="ghost" size="sm" onClick={handleOpenLoad}>
            <FolderOpen size={14} />
            Load
          </Button>

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSettings}
            className={!apiKey.trim() ? 'text-amber-400 hover:text-amber-300' : ''}
          >
            <Settings size={14} />
            {!apiKey.trim() && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span></span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearWorkflow();
              resetExecution();
            }}
          >
            <Trash2 size={14} />
            Clear
          </Button>

          {/* User + Sign Out */}
          {authUser && (
            <>
              <div className="w-px h-5 bg-zinc-700 mx-1" />
              <div className="flex items-center gap-2">
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt=""
                    className="w-5 h-5 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-[9px] text-purple-300 font-bold">
                    {authUser.email?.[0]?.toUpperCase()}
                  </div>
                )}
                <button
                  onClick={authSignOut}
                  className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save Modal */}
      <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)} title="Save Workflow">
        <div className="space-y-3">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Workflow name..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            autoFocus
          />
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!saveName.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Load Modal */}
      <Modal open={showLoadModal} onClose={() => setShowLoadModal(false)} title="Load Workflow">
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {savedWorkflows.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No saved workflows</p>
          ) : (
            savedWorkflows.map((wf) => (
              <div
                key={wf.id}
                className="flex items-center justify-between px-3 py-2 bg-zinc-800 rounded-md"
              >
                <button
                  onClick={() => handleLoad(wf.id)}
                  className="text-sm text-zinc-200 hover:text-white text-left flex-1"
                >
                  {wf.name}
                </button>
                <button
                  onClick={() => handleDelete(wf.id)}
                  className="text-zinc-600 hover:text-red-400 ml-2"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Settings / API Key Modal */}
      <Modal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Settings">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400">
              Google AI Studio API Key
            </label>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
              placeholder="Enter your Gemini API key..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
              autoFocus
            />
            <p className="text-xs text-zinc-500">
              Get your API key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Google AI Studio
              </a>
              . Your key is stored locally in your browser.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveApiKey}>
              Save Key
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
