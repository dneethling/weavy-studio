import type { NodeProps } from '@xyflow/react';
import { useWorkflowStore } from '../../store/useWorkflowStore';

export function useNodeData<T>(props: NodeProps): [T, (updates: Partial<T>) => void] {
  const data = props.data as T;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  const update = (updates: Partial<T>) => {
    updateNodeData(props.id, updates as Record<string, unknown>);
  };

  return [data, update];
}
