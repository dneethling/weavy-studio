import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Crop } from 'lucide-react';
import { BaseNode, useNodeData } from './BaseNode';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import type { CropData } from '../../types/nodes';

export const CropNode = memo(function CropNode(props: NodeProps) {
  const [data, update] = useNodeData<CropData>(props);

  return (
    <BaseNode id={props.id} type="crop" icon={<Crop size={14} />} selected={props.selected}>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[9px] text-zinc-500 block mb-0.5">X</label>
            <input
              type="number"
              value={data.cropX || 0}
              onChange={(e) => update({ cropX: Number(e.target.value) })}
              className="nodrag w-full px-1.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="text-[9px] text-zinc-500 block mb-0.5">Y</label>
            <input
              type="number"
              value={data.cropY || 0}
              onChange={(e) => update({ cropY: Number(e.target.value) })}
              className="nodrag w-full px-1.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="text-[9px] text-zinc-500 block mb-0.5">W</label>
            <input
              type="number"
              value={data.cropWidth || 512}
              onChange={(e) => update({ cropWidth: Number(e.target.value) })}
              className="nodrag w-full px-1.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="text-[9px] text-zinc-500 block mb-0.5">H</label>
            <input
              type="number"
              value={data.cropHeight || 512}
              onChange={(e) => update({ cropHeight: Number(e.target.value) })}
              className="nodrag w-full px-1.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {data.outputImage ? (
          <img
            src={base64ToDataUrl(data.outputImage.base64, data.outputImage.mimeType)}
            alt="Cropped"
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
