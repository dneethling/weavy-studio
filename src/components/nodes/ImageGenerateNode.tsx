import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Sparkles, Globe, Unplug, Layers } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { useNodeData } from './useNodeData';
import { GEMINI_MODELS, ASPECT_RATIOS, MAX_BATCH_COUNT } from '../../constants/defaults';
import { useSettingsStore } from '../../store/useSettingsStore';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import type { ImageGenerateData } from '../../types/nodes';

export const ImageGenerateNode = memo(function ImageGenerateNode(props: NodeProps) {
  const [data, update] = useNodeData<ImageGenerateData>(props);
  const globalModel = useSettingsStore((s) => s.globalModel);
  const useGlobal = data.useGlobalModel !== false;
  const activeModelId = useGlobal ? globalModel : (data.model || GEMINI_MODELS[0].id);
  const activeModelLabel = GEMINI_MODELS.find((m) => m.id === activeModelId)?.label || activeModelId;

  return (
    <BaseNode id={props.id} type="imageGenerate" icon={<Sparkles size={14} />} selected={props.selected}>
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

        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[9px] text-zinc-500 block mb-0.5">Aspect Ratio</label>
            <select
              value={data.aspectRatio || '1:1'}
              onChange={(e) => update({ aspectRatio: e.target.value })}
              className="nodrag w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-purple-500"
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] text-zinc-500 flex items-center gap-0.5 mb-0.5">
              <Layers size={8} />
              Variations
            </label>
            <select
              value={data.batchCount || 1}
              onChange={(e) => update({ batchCount: Number(e.target.value) })}
              className="nodrag w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-purple-500"
            >
              {Array.from({ length: MAX_BATCH_COUNT }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n === 1 ? '1 image' : `${n} images`}</option>
              ))}
            </select>
          </div>
        </div>

        <OutputPreview images={data.outputImages} fallback={data.outputImage} />
      </div>
    </BaseNode>
  );
});

function OutputPreview({
  images,
  fallback,
}: {
  images?: ImageGenerateData['outputImages'];
  fallback?: ImageGenerateData['outputImage'];
}) {
  const list = images && images.length > 0 ? images : fallback ? [fallback] : [];

  if (list.length === 0) {
    return (
      <div className="w-full h-24 bg-zinc-800/50 rounded border border-dashed border-zinc-700 flex items-center justify-center">
        <span className="text-[10px] text-zinc-600">No image yet</span>
      </div>
    );
  }

  if (list.length === 1) {
    return (
      <img
        src={base64ToDataUrl(list[0].base64, list[0].mimeType)}
        alt="Generated"
        className="w-full rounded border border-zinc-700"
      />
    );
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-1">
        {list.slice(0, 4).map((img, i) => (
          <img
            key={i}
            src={base64ToDataUrl(img.base64, img.mimeType)}
            alt={`Variation ${i + 1}`}
            className="w-full aspect-square object-cover rounded border border-zinc-700"
          />
        ))}
      </div>
      <p className="text-[9px] text-zinc-500 text-center">
        {list.length} variation{list.length === 1 ? '' : 's'}
        {list.length > 4 ? ` (showing 4)` : ''}
      </p>
    </div>
  );
}
