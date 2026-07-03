import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { ListOrdered } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { useNodeData } from './useNodeData';
import type { PromptListData } from '../../types/nodes';

export const PromptListNode = memo(function PromptListNode(props: NodeProps) {
  const [data, update] = useNodeData<PromptListData>(props);

  const promptCount = (data.text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  return (
    <BaseNode id={props.id} type="promptList" icon={<ListOrdered size={14} />} selected={props.selected}>
      <div className="space-y-1.5">
        <textarea
          value={data.text || ''}
          onChange={(e) => update({ text: e.target.value })}
          rows={5}
          placeholder={'One prompt per line…\na cat in a spacesuit\na dog on the moon\na fox in a forest'}
          className="nodrag w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-blue-500 font-mono leading-snug"
        />
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-500">
            {promptCount === 0
              ? 'Each line fans out as its own run'
              : `${promptCount} prompt${promptCount === 1 ? '' : 's'} → ${promptCount} parallel run${promptCount === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>
    </BaseNode>
  );
});
