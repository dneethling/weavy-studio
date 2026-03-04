import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Maximize2 } from 'lucide-react';
import { BaseNode, useNodeData } from './BaseNode';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import type { ResizeData } from '../../types/nodes';

export const ResizeNode = memo(function ResizeNode(props: NodeProps) {
  const [data, update] = useNodeData<ResizeData>(props);

  return (
    <BaseNode id={props.id} type="resize" icon={<Maximize2 size={14} />} selected={props.selected}>
      <div className="space-y-2">
        <div className="flex gap-1.5">
          <div className="flex-1">
            <label className="text-[9px] text-zinc-500 block mb-0.5">W</label>
            <input
              type="number"
              value={data.targetWidth || 1024}
              onChange={(e) => update({ targetWidth: Number(e.target.value) })}
              className="nodrag w-full px-1.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] text-zinc-500 block mb-0.5">H</label>
            <input
              type="number"
              value={data.targetHeight || 1024}
              onChange={(e) => update({ targetHeight: Number(e.target.value) })}
              className="nodrag w-full px-1.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <label className="nodrag flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={data.maintainAspectRatio !== false}
            onChange={(e) => update({ maintainAspectRatio: e.target.checked })}
            className="rounded border-zinc-600 bg-zinc-800 text-sky-500 focus:ring-sky-500"
          />
          <span className="text-[10px] text-zinc-400">Lock aspect ratio</span>
        </label>

        {data.outputImage ? (
          <img
            src={base64ToDataUrl(data.outputImage.base64, data.outputImage.mimeType)}
            alt="Resized"
            className="w-full rounded border border-zinc-700"
          />
        ) : (
          <div className="w-full h-16 bg-zinc-800/50 rounded border border-dashed border-zinc-700 flex items-center justify-center">
            <span className="text-[10px] text-zinc-600">Connect image input</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
});
