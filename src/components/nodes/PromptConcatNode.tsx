import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Link2 } from 'lucide-react';
import { BaseNode, useNodeData } from './BaseNode';
import type { PromptConcatData } from '../../types/nodes';

export const PromptConcatNode = memo(function PromptConcatNode(props: NodeProps) {
  const [data, update] = useNodeData<PromptConcatData>(props);

  return (
    <BaseNode id={props.id} type="promptConcat" icon={<Link2 size={14} />} selected={props.selected}>
      <div className="space-y-2">
        <div>
          <label className="text-[9px] text-zinc-500 block mb-0.5">Separator</label>
          <input
            type="text"
            value={data.separator ?? ', '}
            onChange={(e) => update({ separator: e.target.value })}
            className="nodrag w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 focus:outline-none focus:border-blue-500 font-mono"
            placeholder=", "
          />
        </div>
        <p className="text-[9px] text-zinc-600 text-center">
          Joins Text 1 + separator + Text 2
        </p>
      </div>
    </BaseNode>
  );
});
