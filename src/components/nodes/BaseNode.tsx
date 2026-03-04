import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '../../utils/cn';
import { NODE_DEFINITIONS } from '../../constants/nodeDefinitions';
import { useExecutionStore } from '../../store/useExecutionStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { Spinner } from '../shared/Spinner';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface BaseNodeProps {
  id: string;
  type: string;
  icon: ReactNode;
  selected?: boolean;
  children: ReactNode;
}

export function BaseNode({ id, type, icon, selected, children }: BaseNodeProps) {
  const def = NODE_DEFINITIONS[type];
  const status = useExecutionStore((s) => s.nodeStatuses[id]);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  return (
    <div
      className={cn(
        'bg-zinc-900 rounded-lg border shadow-lg min-w-[200px] max-w-[260px]',
        selected ? 'border-purple-500 ring-1 ring-purple-500/30' : 'border-zinc-700',
        status === 'running' && 'border-yellow-500/60 ring-1 ring-yellow-500/20',
        status === 'error' && 'border-red-500/60',
        status === 'success' && 'border-green-500/40'
      )}
      onClick={() => setSelectedNode(id)}
    >
      {/* Header */}
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-t-lg', def.color)}>
        <div className="text-white/90">{icon}</div>
        <span className="text-xs font-medium text-white flex-1">{def.label}</span>
        {status === 'running' && <Spinner className="h-3 w-3 border-white/40 border-t-white" />}
        {status === 'success' && <CheckCircle size={12} className="text-white/80" />}
        {status === 'error' && <AlertCircle size={12} className="text-white/80" />}
      </div>

      {/* Body */}
      <div className="p-3">{children}</div>

      {/* Input handles */}
      {def.inputs.map((input, i) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          data-handletype={input.dataType}
          className={cn(
            '!w-3 !h-3 !border-2 !bg-zinc-800',
            input.dataType === 'text' ? '!border-blue-500' : '!border-emerald-500'
          )}
          style={{ top: `${((i + 1) / (def.inputs.length + 1)) * 100}%` }}
          title={input.label}
        />
      ))}

      {/* Output handles */}
      {def.outputs.map((output, i) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          data-handletype={output.dataType}
          className={cn(
            '!w-3 !h-3 !border-2 !bg-zinc-800',
            output.dataType === 'text' ? '!border-blue-500' : '!border-emerald-500'
          )}
          style={{ top: `${((i + 1) / (def.outputs.length + 1)) * 100}%` }}
          title={output.label}
        />
      ))}
    </div>
  );
}

export function useNodeData<T>(props: NodeProps): [T, (updates: Partial<T>) => void] {
  const data = props.data as T;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  const update = (updates: Partial<T>) => {
    updateNodeData(props.id, updates as Record<string, unknown>);
  };

  return [data, update];
}
