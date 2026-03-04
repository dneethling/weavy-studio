import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useExecutionStore } from '../../store/useExecutionStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { NODE_DEFINITIONS } from '../../constants/nodeDefinitions';
import { GEMINI_MODELS, ASPECT_RATIOS } from '../../constants/defaults';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import { X, Download, Globe, Unplug, Shuffle } from 'lucide-react';
import type { ImagePayload } from '../../types/nodes';

export function PropertiesPanel() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const nodes = useWorkflowStore((s) => s.nodes);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);
  const nodeStatuses = useExecutionStore((s) => s.nodeStatuses);
  const nodeErrors = useExecutionStore((s) => s.nodeErrors);

  const globalModel = useSettingsStore((s) => s.globalModel);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="bg-zinc-900 border-l border-zinc-800 flex items-center justify-center p-4">
        <p className="text-xs text-zinc-600 text-center">Select a node to edit its properties</p>
      </div>
    );
  }

  const def = NODE_DEFINITIONS[selectedNode.type!];
  const status = nodeStatuses[selectedNode.id];
  const error = nodeErrors[selectedNode.id];
  const data = selectedNode.data as Record<string, unknown>;

  const handleDownload = (image: ImagePayload) => {
    const ext = image.mimeType.split('/')[1];
    // Build a descriptive filename with model + ratio if this is an AI node
    const parts = ['weavy'];
    if (selectedNode.type === 'imageGenerate' || selectedNode.type === 'imageEdit') {
      const useGlobal = data.useGlobalModel !== false;
      const modelId = useGlobal ? globalModel : (data.model as string);
      const modelLabel = GEMINI_MODELS.find((m) => m.id === modelId)?.label || modelId;
      parts.push(modelLabel.replace(/[^a-zA-Z0-9.()-]/g, '_'));
      if (data.aspectRatio) parts.push((data.aspectRatio as string).replace(':', 'x'));
    }
    parts.push('output');
    const link = document.createElement('a');
    link.href = base64ToDataUrl(image.base64, image.mimeType);
    link.download = `${parts.join('-')}.${ext}`;
    link.click();
  };

  const outputImage = (data.outputImage || data.displayImage || data.importedImage) as ImagePayload | undefined;

  return (
    <div className="bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${def?.color || 'bg-zinc-600'}`} />
          <h3 className="text-xs font-semibold text-zinc-300">{def?.label || 'Properties'}</h3>
        </div>
        <button onClick={() => setSelectedNode(null)} className="text-zinc-600 hover:text-zinc-400">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 p-3 space-y-4">
        {status === 'error' && error && (
          <div className="px-2.5 py-2 bg-red-500/10 border border-red-500/30 rounded-md">
            <p className="text-[11px] text-red-400">{error}</p>
          </div>
        )}

        {/* Text Prompt properties */}
        {selectedNode.type === 'textPrompt' && (
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">Prompt Text</label>
            <textarea
              value={(data.text as string) || ''}
              onChange={(e) => updateNodeData(selectedNode.id, { text: e.target.value })}
              rows={6}
              className="w-full px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-purple-500"
              placeholder="Enter your prompt..."
            />
          </div>
        )}

        {/* Image Generate properties */}
        {selectedNode.type === 'imageGenerate' && (
          <>
            <ModelSelector
              data={data}
              globalModel={globalModel}
              nodeId={selectedNode.id}
              updateNodeData={updateNodeData}
            />
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Aspect Ratio</label>
              <select
                value={(data.aspectRatio as string) || '1:1'}
                onChange={(e) => updateNodeData(selectedNode.id, { aspectRatio: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            <SeedControl
              data={data}
              nodeId={selectedNode.id}
              updateNodeData={updateNodeData}
            />
          </>
        )}

        {/* Image Edit properties */}
        {selectedNode.type === 'imageEdit' && (
          <>
            <ModelSelector
              data={data}
              globalModel={globalModel}
              nodeId={selectedNode.id}
              updateNodeData={updateNodeData}
            />
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Edit Instruction</label>
              <textarea
                value={(data.editInstruction as string) || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { editInstruction: e.target.value })}
                rows={4}
                className="w-full px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-purple-500"
                placeholder="Describe the edit..."
              />
            </div>
          </>
        )}

        {/* Display Image properties */}
        {selectedNode.type === 'imageDisplay' && (
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">Label</label>
            <input
              type="text"
              value={(data.label as string) || ''}
              onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-purple-500"
            />
          </div>
        )}

        {/* Blur properties */}
        {selectedNode.type === 'blur' && (
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
              Blur Radius: {(data.radius as number) || 5}px
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={(data.radius as number) || 5}
              onChange={(e) => updateNodeData(selectedNode.id, { radius: Number(e.target.value) })}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        )}

        {/* Resize properties */}
        {selectedNode.type === 'resize' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Width</label>
                <input
                  type="number"
                  value={(data.targetWidth as number) || 1024}
                  onChange={(e) => updateNodeData(selectedNode.id, { targetWidth: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Height</label>
                <input
                  type="number"
                  value={(data.targetHeight as number) || 1024}
                  onChange={(e) => updateNodeData(selectedNode.id, { targetHeight: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(data.maintainAspectRatio as boolean) !== false}
                onChange={(e) => updateNodeData(selectedNode.id, { maintainAspectRatio: e.target.checked })}
                className="rounded border-zinc-600 bg-zinc-800 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-[11px] text-zinc-400">Maintain aspect ratio</span>
            </label>
          </div>
        )}

        {/* Crop properties */}
        {selectedNode.type === 'crop' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">X Offset</label>
              <input
                type="number"
                value={(data.cropX as number) || 0}
                onChange={(e) => updateNodeData(selectedNode.id, { cropX: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Y Offset</label>
              <input
                type="number"
                value={(data.cropY as number) || 0}
                onChange={(e) => updateNodeData(selectedNode.id, { cropY: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Width</label>
              <input
                type="number"
                value={(data.cropWidth as number) || 512}
                onChange={(e) => updateNodeData(selectedNode.id, { cropWidth: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Height</label>
              <input
                type="number"
                value={(data.cropHeight as number) || 512}
                onChange={(e) => updateNodeData(selectedNode.id, { cropHeight: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}

        {/* Prompt Concatenator properties */}
        {selectedNode.type === 'promptConcat' && (
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">Separator</label>
            <input
              type="text"
              value={(data.separator as string) ?? ', '}
              onChange={(e) => updateNodeData(selectedNode.id, { separator: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
              placeholder=", "
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              Character(s) placed between the two input texts.
            </p>
          </div>
        )}

        {/* Sticky Note properties */}
        {selectedNode.type === 'stickyNote' && (
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">Note Text</label>
            <textarea
              value={(data.noteText as string) || ''}
              onChange={(e) => updateNodeData(selectedNode.id, { noteText: e.target.value })}
              rows={6}
              className="w-full px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-yellow-500"
              placeholder="Write a note..."
            />
          </div>
        )}

        {/* Output image preview */}
        {outputImage && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-zinc-500">Output Preview</label>
              <button
                onClick={() => handleDownload(outputImage)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <Download size={12} />
              </button>
            </div>
            <img
              src={base64ToDataUrl(outputImage.base64, outputImage.mimeType)}
              alt="Output"
              className="w-full rounded-md border border-zinc-700"
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              {outputImage.width} x {outputImage.height}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── ModelSelector sub-component ───────────────────────────────── */

interface ModelSelectorProps {
  data: Record<string, unknown>;
  globalModel: string;
  nodeId: string;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
}

function ModelSelector({ data, globalModel, nodeId, updateNodeData }: ModelSelectorProps) {
  const useGlobal = data.useGlobalModel !== false; // default to true
  const globalLabel = GEMINI_MODELS.find((m) => m.id === globalModel)?.label || globalModel;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-medium text-zinc-500">Model</label>
        <button
          onClick={() => updateNodeData(nodeId, { useGlobalModel: !useGlobal })}
          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
            useGlobal
              ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
              : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
          }`}
          title={useGlobal ? 'Using global model — click to override' : 'Using per-node override — click to use global'}
        >
          {useGlobal ? <Globe size={10} /> : <Unplug size={10} />}
          {useGlobal ? 'Global' : 'Override'}
        </button>
      </div>

      {useGlobal ? (
        <div className="px-2.5 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-sm text-zinc-400 flex items-center gap-1.5">
          <Globe size={12} className="text-purple-400 shrink-0" />
          <span className="truncate">{globalLabel}</span>
        </div>
      ) : (
        <select
          value={(data.model as string) || GEMINI_MODELS[0].id}
          onChange={(e) => updateNodeData(nodeId, { model: e.target.value })}
          className="w-full px-2.5 py-1.5 bg-zinc-800 border border-amber-600/30 rounded-md text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
        >
          {GEMINI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      )}

      <p className="text-[10px] text-zinc-600 mt-1">
        {useGlobal
          ? 'Change the global model from the toolbar dropdown.'
          : 'This node uses its own model, ignoring the global selection.'}
      </p>
    </div>
  );
}

/* ── SeedControl sub-component ───────────────────────────────── */

interface SeedControlProps {
  data: Record<string, unknown>;
  nodeId: string;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
}

function SeedControl({ data, nodeId, updateNodeData }: SeedControlProps) {
  const isRandom = data.randomSeed !== false; // default true
  const seed = (data.seed as number) || 0;

  const generateRandomSeed = () => {
    updateNodeData(nodeId, { seed: Math.floor(Math.random() * 2147483647) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] font-medium text-zinc-500">Seed</label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isRandom}
            onChange={(e) => updateNodeData(nodeId, { randomSeed: e.target.checked })}
            className="rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500 w-3 h-3"
          />
          <span className="text-[10px] text-zinc-500">Random</span>
        </label>
      </div>

      {isRandom ? (
        <div className="px-2.5 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-sm text-zinc-500 flex items-center gap-1.5">
          <Shuffle size={12} className="text-purple-400 shrink-0" />
          <span>Random each run</span>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <input
            type="number"
            value={seed}
            onChange={(e) => updateNodeData(nodeId, { seed: Number(e.target.value) })}
            className="flex-1 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
            min={0}
            max={2147483647}
          />
          <button
            onClick={generateRandomSeed}
            className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            title="Generate random seed"
          >
            <Shuffle size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
