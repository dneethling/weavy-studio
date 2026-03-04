import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Type } from 'lucide-react';
import { BaseNode, useNodeData } from './BaseNode';
import type { TextPromptData } from '../../types/nodes';

export const TextPromptNode = memo(function TextPromptNode(props: NodeProps) {
  const [data, update] = useNodeData<TextPromptData>(props);

  return (
    <BaseNode id={props.id} type="textPrompt" icon={<Type size={14} />} selected={props.selected}>
      <textarea
        value={data.text || ''}
        onChange={(e) => update({ text: e.target.value })}
        rows={3}
        className="nodrag nowheel w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-blue-500"
        placeholder="Enter prompt..."
      />
      <p className="text-[9px] text-zinc-600 mt-1 text-right">
        {(data.text || '').length} chars
      </p>
    </BaseNode>
  );
});
