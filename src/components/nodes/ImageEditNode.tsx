import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Pencil, Globe, Unplug } from 'lucide-react';
import { BaseNode, useNodeData } from './BaseNode';
import { GEMINI_MODELS } from '../../constants/defaults';
import { useSettingsStore } from '../../store/useSettingsStore';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import type { ImageEditData } from '../../types/nodes';

export const ImageEditNode = memo(function ImageEditNode(props: NodeProps) {
  const [data, update] = useNodeData<ImageEditData>(props);
  const globalModel = useSettingsStore((s) => s.globalModel);
  const useGlobal = data.useGlobalModel !== false;
  const activeModelId = useGlobal ? globalModel : (data.model || GEMINI_MODELS[0].id);
  const activeModelLabel = GEMINI_MODELS.find((m) => m.id === activeModelId)?.label || activeModelId;

  return (
    <BaseNode id={props.id} type="imageEdit" icon={<Pencil size={14} />} selected={props.selected}>
      <div className="space-y-2">
        {/* Compact model selector */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[9px] text-zinc-500">Model</label>
            <button
              onClick={(e) => {
                e.stopPropagation();
                update({ useGlobalModel: !useGlobal });
              }}
              className={`nodrag flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded ${
                useGlobal
                  ? 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                  : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              }`}
              title={useGlobal ? 'Using global model — click to override' : 'Per-node override — click for global'}
            >
              {useGlobal ? <Globe size={8} /> : <Unplug size={8} />}
              {useGlobal ? 'Global' : 'Override'}
            </button>
          </div>
          {useGlobal ? (
            <div className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-[10px] text-zinc-400 flex items-center gap-1 truncate">
              <Globe size={10} className="text-purple-400 shrink-0" />
              <span className="truncate">{activeModelLabel}</span>
            </div>
          ) : (
            <select
              value={activeModelId}
              onChange={(e) => {
                e.stopPropagation();
                update({ model: e.target.value });
              }}
              className="nodrag w-full px-2 py-1 bg-zinc-800 border border-amber-600/30 rounded text-[10px] text-zinc-300 focus:outline-none focus:border-amber-500"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-[9px] text-zinc-500 block mb-0.5">Edit Instruction</label>
          <textarea
            value={data.editInstruction || ''}
            onChange={(e) => update({ editInstruction: e.target.value })}
            rows={2}
            className="nodrag nowheel w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-amber-500"
            placeholder="Describe the edit..."
          />
        </div>

        {data.outputImage ? (
          <img
            src={base64ToDataUrl(data.outputImage.base64, data.outputImage.mimeType)}
            alt="Edited"
            className="w-full rounded border border-zinc-700"
          />
        ) : (
          <div className="w-full h-16 bg-zinc-800/50 rounded border border-dashed border-zinc-700 flex items-center justify-center">
            <span className="text-[10px] text-zinc-600">Connect an image</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
});
