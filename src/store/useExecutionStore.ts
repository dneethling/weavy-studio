import { create } from 'zustand';
import { requestCancel } from '../services/execution/taskQueue';
import type { NodeExecutionStatus } from '../types/workflow';

export interface NodeProgress {
  done: number;
  total: number;
}

interface ExecutionState {
  isRunning: boolean;
  executionOrder: string[];
  nodeStatuses: Record<string, NodeExecutionStatus>;
  nodeErrors: Record<string, string>;
  nodeWarnings: Record<string, string>;
  nodeOutputs: Record<string, unknown>;
  nodeProgress: Record<string, NodeProgress>;
  currentNodeIndex: number;

  startExecution: (order: string[]) => void;
  setNodeStatus: (nodeId: string, status: NodeExecutionStatus) => void;
  setNodeError: (nodeId: string, error: string) => void;
  setNodeWarning: (nodeId: string, warning: string) => void;
  setNodeOutput: (nodeId: string, output: unknown) => void;
  setNodeProgress: (nodeId: string, done: number, total: number) => void;
  cancelExecution: () => void;
  finishExecution: () => void;
  resetExecution: () => void;
}

export const useExecutionStore = create<ExecutionState>()((set, get) => ({
  isRunning: false,
  executionOrder: [],
  nodeStatuses: {},
  nodeErrors: {},
  nodeWarnings: {},
  nodeOutputs: {},
  nodeProgress: {},
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
      nodeWarnings: {},
      nodeOutputs: {},
      nodeProgress: {},
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

  setNodeWarning: (nodeId, warning) => {
    set({
      nodeWarnings: { ...get().nodeWarnings, [nodeId]: warning },
    });
  },

  setNodeOutput: (nodeId, output) => {
    set({
      nodeOutputs: { ...get().nodeOutputs, [nodeId]: output },
    });
  },

  setNodeProgress: (nodeId, done, total) => {
    set({
      nodeProgress: { ...get().nodeProgress, [nodeId]: { done, total } },
    });
  },

  /** Request a graceful stop — running API calls finish, queued ones abort. */
  cancelExecution: () => {
    requestCancel();
  },

  finishExecution: () => {
    set({ isRunning: false });
  },

  resetExecution: () => {
    requestCancel();
    set({
      isRunning: false,
      executionOrder: [],
      nodeStatuses: {},
      nodeErrors: {},
      nodeWarnings: {},
      nodeOutputs: {},
      nodeProgress: {},
      currentNodeIndex: 0,
    });
  },
}));
