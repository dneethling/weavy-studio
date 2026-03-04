import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';
import { BaseNode, useNodeData } from './BaseNode';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import type { ComposeData } from '../../types/nodes';

export const ComposeNode = memo(function ComposeNode(props: NodeProps) {
  const [data, update] = useNodeData<ComposeData>(props);

  return (
    <BaseNode id={props.id} type="compose" icon={<Layers size={14} />} selected={props.selected}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[9px] text-zinc-500 block mb-0.5">Width</label>
            <input
              type="number"
              value={data.width || 1024}
              onChange={(e) => update({ width: parseInt(e.target.value) || 1024 })}
              className="nodrag w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] text-zinc-500 block mb-0.5">Height</label>
            <input
              type="number"
              value={data.height || 1024}
              onChange={(e) => update({ height: parseInt(e.target.value) || 1024 })}
              className="nodrag w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {data.outputImage ? (
          <img
            src={base64ToDataUrl(data.outputImage.base64, data.outputImage.mimeType)}
            alt="Composed"
            className="w-full rounded border border-zinc-700"
          />
        ) : (
          <div className="w-full h-16 bg-zinc-800/50 rounded border border-dashed border-zinc-700 flex items-center justify-center">
            <span className="text-[10px] text-zinc-600">Connect layer inputs</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
});
