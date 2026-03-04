import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useExecutionStore } from '../../store/useExecutionStore';
import { useState } from 'react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const isRunning = useExecutionStore((s) => s.isRunning);
  const nodeStatuses = useExecutionStore((s) => s.nodeStatuses);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const sourceStatus = nodeStatuses[source];
  const isActive = sourceStatus === 'running' || sourceStatus === 'success';

  const handleDelete = () => {
    onEdgesChange([{ id, type: 'remove' }]);
  };

  return (
    <>
      {/* Invisible wider path for hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isActive ? '#a855f7' : hovered ? '#71717a' : '#3f3f46',
          strokeWidth: 2,
          strokeDasharray: sourceStatus === 'running' ? '5 5' : undefined,
          animation: sourceStatus === 'running' ? 'dash 0.5s linear infinite' : undefined,
        }}
      />
      {hovered && !isRunning && (
        <EdgeLabelRenderer>
          <button
            onClick={handleDelete}
            className="absolute p-0.5 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-400 hover:text-red-400 hover:border-red-500 transition-colors"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <X size={10} />
          </button>
        </EdgeLabelRenderer>
      )}
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -10; }
        }
      `}</style>
    </>
  );
}
