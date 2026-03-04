import type { Node, Edge } from '@xyflow/react';

export interface SavedWorkflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: number;
  updatedAt: number;
}

export type NodeExecutionStatus = 'idle' | 'queued' | 'running' | 'success' | 'error';
