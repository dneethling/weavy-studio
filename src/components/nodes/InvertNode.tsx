import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { SunMoon } from 'lucide-react';
import { BaseNode, useNodeData } from './BaseNode';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import type { InvertData } from '../../types/nodes';

export const InvertNode = memo(function InvertNode(props: NodeProps) {
  const [data] = useNodeData<InvertData>(props);

  return (
    <BaseNode id={props.id} type="invert" icon={<SunMoon size={14} />} selected={props.selected}>
      <div className="space-y-2">
        {data.outputImage ? (
          <img
            src={base64ToDataUrl(data.outputImage.base64, data.outputImage.mimeType)}
            alt="Inverted"
            className="w-full rounded border border-zinc-700"
          />
        ) : (
          <div className="w-full h-16 bg-zinc-800/50 rounded border border-dashed border-zinc-700 flex items-center justify-center">
            <span className="text-[10px] text-zinc-600">Connect image input</span>
          </div>
        )}
        <p className="text-[9px] text-zinc-600 text-center">Inverts all color channels</p>
      </div>
    </BaseNode>
  );
});
