import { create } from 'zustand';
import type { NodeExecutionStatus } from '../types/workflow';

interface ExecutionState {
  isRunning: boolean;
  executionOrder: string[];
  nodeStatuses: Record<string, NodeExecutionStatus>;
  nodeErrors: Record<string, string>;
  nodeOutputs: Record<string, unknown>;
  currentNodeIndex: number;

  startExecution: (order: string[]) => void;
  setNodeStatus: (nodeId: string, status: NodeExecutionStatus) => void;
  setNodeError: (nodeId: string, error: string) => void;
  setNodeOutput: (nodeId: string, output: unknown) => void;
  finishExecution: () => void;
  resetExecution: () => void;
}

export const useExecutionStore = create<ExecutionState>()((set, get) => ({
  isRunning: false,
  executionOrder: [],
  nodeStatuses: {},
  nodeErrors: {},
  nodeOutputs: {},
  currentNodeIndex: 0,

  startExecution: (order) => {
    const statuses: Record<string, NodeExecutionStatus> = {};
    for (const id of order) {
      statuses[id] = 'queued';
    }
    set({
      isRunning: true,
      executionOrder: order,
      nodeStatuses: statuses,
      nodeErrors: {},
      nodeOutputs: {},
      currentNodeIndex: 0,
    });
  },

  setNodeStatus: (nodeId, status) => {
    set({
      nodeStatuses: { ...get().nodeStatuses, [nodeId]: status },
    });
  },

  setNodeError: (nodeId, error) => {
    set({
      nodeErrors: { ...get().nodeErrors, [nodeId]: error },
    });
  },

  setNodeOutput: (nodeId, output) => {
    set({
      nodeOutputs: { ...get().nodeOutputs, [nodeId]: output },
    });
  },

  finishExecution: () => {
    set({ isRunning: false });
  },

  resetExecution: () => {
    set({
      isRunning: false,
      executionOrder: [],
      nodeStatuses: {},
      nodeErrors: {},
      nodeOutputs: {},
      currentNodeIndex: 0,
    });
  },
}));
