import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Droplets } from 'lucide-react';
import { BaseNode, useNodeData } from './BaseNode';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import type { BlurData } from '../../types/nodes';

export const BlurNode = memo(function BlurNode(props: NodeProps) {
  const [data, update] = useNodeData<BlurData>(props);

  return (
    <BaseNode id={props.id} type="blur" icon={<Droplets size={14} />} selected={props.selected}>
      <div className="space-y-2">
        <div>
          <label className="text-[9px] text-zinc-500 block mb-0.5">Radius: {data.radius}px</label>
          <input
            type="range"
            min={1}
            max={50}
            value={data.radius || 5}
            onChange={(e) => update({ radius: Number(e.target.value) })}
            className="nodrag w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>

        {data.outputImage ? (
          <img
            src={base64ToDataUrl(data.outputImage.base64, data.outputImage.mimeType)}
            alt="Blurred"
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
