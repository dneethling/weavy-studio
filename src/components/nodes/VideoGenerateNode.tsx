import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Clapperboard } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { useNodeData } from './useNodeData';
import { VEO_MODELS, VIDEO_ASPECT_RATIOS } from '../../constants/defaults';
import { useMediaObjectUrl } from '../../utils/useObjectUrl';
import type { VideoGenerateData } from '../../types/nodes';

export const VideoGenerateNode = memo(function VideoGenerateNode(props: NodeProps) {
  const [data, update] = useNodeData<VideoGenerateData>(props);
  const previewUrl = useMediaObjectUrl(data.outputVideo);
  const batchSize = data.outputVideos?.length ?? 0;

  return (
    <BaseNode id={props.id} type="videoGenerate" icon={<Clapperboard size={14} />} selected={props.selected}>
      <div className="space-y-2">
        <div>
          <label className="text-[9px] text-zinc-500 block mb-0.5">Model</label>
          <select
            value={data.model || VEO_MODELS[0].id}
            onChange={(e) => update({ model: e.target.value })}
            className="nodrag w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 focus:outline-none focus:border-fuchsia-500"
          >
            {VEO_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[9px] text-zinc-500 block mb-0.5">Aspect Ratio</label>
          <select
            value={data.aspectRatio || '16:9'}
            onChange={(e) => update({ aspectRatio: e.target.value })}
            className="nodrag w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-fuchsia-500"
          >
            {VIDEO_ASPECT_RATIOS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {previewUrl ? (
          <div className="space-y-1">
            <video
              src={previewUrl}
              controls
              muted
              loop
              className="nodrag w-full rounded border border-zinc-700"
            />
            {batchSize > 1 && (
              <p className="text-[9px] text-zinc-500 text-center">
                1 of {batchSize} — see Display Video or the Gallery for all
              </p>
            )}
          </div>
        ) : (
          <div className="w-full h-20 bg-zinc-800/50 rounded border border-dashed border-zinc-700 flex items-center justify-center">
            <span className="text-[10px] text-zinc-600">No video yet</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
});
