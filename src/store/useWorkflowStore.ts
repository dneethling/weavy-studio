import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from '@xyflow/react';
import { NODE_DEFINITIONS } from '../constants/nodeDefinitions';
import { createNodeId, createEdgeId } from '../utils/id';

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Undo/Redo
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;

  addNode: (type: string, position: { x: number; y: number }) => string;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  setSelectedNode: (id: string | null) => void;

  clearWorkflow: () => void;
  loadWorkflow: (nodes: Node[], edges: Edge[]) => void;
  getWorkflowJSON: () => { nodes: Node[]; edges: Edge[] };

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

const MAX_HISTORY = 50;

export const useWorkflowStore = create<WorkflowState>()((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  history: [{ nodes: [], edges: [] }],
  historyIndex: 0,
  canUndo: false,
  canRedo: false,

  onNodesChange: (changes) => {
    // Only push history for significant changes (add/remove), not positions
    const isStructural = changes.some(
      (c) => c.type === 'remove' || c.type === 'add'
    );
    if (isStructural) {
      get().pushHistory();
    }
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    const isStructural = changes.some(
      (c) => c.type === 'remove' || c.type === 'add'
    );
    if (isStructural) {
      get().pushHistory();
    }
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    get().pushHistory();
    const newEdge: Edge = {
      ...connection,
      id: createEdgeId(),
      type: 'custom',
    };
    set({ edges: addEdge(newEdge, get().edges) });
  },

  addNode: (type, position) => {
    const definition = NODE_DEFINITIONS[type];
    if (!definition) throw new Error(`Unknown node type: ${type}`);

    get().pushHistory();

    const id = createNodeId();
    const newNode: Node = {
      id,
      type,
      position,
      data: { ...definition.defaultData },
    };
    set({ nodes: [...get().nodes, newNode] });
    return id;
  },

  removeNode: (id) => {
    get().pushHistory();
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  updateNodeData: (id, dataUpdate) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...dataUpdate } }
          : node
      ),
    });
  },

  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },

  clearWorkflow: () => {
    get().pushHistory();
    set({ nodes: [], edges: [], selectedNodeId: null });
  },

  loadWorkflow: (nodes, edges) => {
    set({
      nodes,
      edges,
      selectedNodeId: null,
      history: [{ nodes, edges }],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
    });
  },

  getWorkflowJSON: () => {
    const { nodes, edges } = get();
    return { nodes, edges };
  },

  pushHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    // Trim future history if we branched
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: structuredClone(nodes), edges: structuredClone(edges) });

    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false,
    });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;

    // Save current state at the end if we haven't yet
    if (historyIndex === history.length - 1) {
      const { nodes, edges } = get();
      const newHistory = [...history];
      // Replace last entry with current state
      newHistory[historyIndex] = { nodes: structuredClone(nodes), edges: structuredClone(edges) };
      set({ history: newHistory });
    }

    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    set({
      nodes: structuredClone(entry.nodes),
      edges: structuredClone(entry.edges),
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    set({
      nodes: structuredClone(entry.nodes),
      edges: structuredClone(entry.edges),
      historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < history.length - 1,
    });
  },
}));
