import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { StickyNote } from 'lucide-react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import type { StickyNoteData } from '../../types/nodes';

const NOTE_COLORS = [
  { id: '#fef08a', label: 'Yellow' },
  { id: '#86efac', label: 'Green' },
  { id: '#93c5fd', label: 'Blue' },
  { id: '#f9a8d4', label: 'Pink' },
  { id: '#c4b5fd', label: 'Purple' },
  { id: '#fdba74', label: 'Orange' },
];

export const StickyNoteNode = memo(function StickyNoteNode(props: NodeProps) {
  const data = props.data as unknown as StickyNoteData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  const bgColor = data.noteColor || '#fef08a';

  return (
    <div
      className="rounded-md shadow-lg min-w-[180px] max-w-[280px] cursor-pointer"
      style={{ backgroundColor: bgColor }}
      onClick={() => setSelectedNode(props.id)}
    >
      <div className="flex items-center gap-1 px-2 pt-2 pb-1">
        <StickyNote size={10} className="text-black/40" />
        <span className="text-[9px] font-medium text-black/40 uppercase tracking-wider">Note</span>
        <div className="flex-1" />
        <div className="flex gap-0.5">
          {NOTE_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={(e) => {
                e.stopPropagation();
                updateNodeData(props.id, { noteColor: c.id });
              }}
              className="nodrag w-3 h-3 rounded-full border border-black/20 hover:scale-125 transition-transform"
              style={{ backgroundColor: c.id }}
              title={c.label}
            />
          ))}
        </div>
      </div>
      <textarea
        value={data.noteText || ''}
        onChange={(e) => updateNodeData(props.id, { noteText: e.target.value })}
        rows={4}
        className="nodrag nowheel w-full px-2 pb-2 bg-transparent text-[11px] text-black/80 placeholder-black/30 resize-none focus:outline-none"
        placeholder="Type a note..."
      />
    </div>
  );
});
