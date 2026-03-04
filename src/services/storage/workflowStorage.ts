import type { Node, Edge } from '@xyflow/react';
import type { SavedWorkflow } from '../../types/workflow';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'weavy-studio-workflows';

export function saveWorkflow(name: string, nodes: Node[], edges: Edge[]): void {
  const workflows = loadWorkflows();

  // Strip output images from node data to save space
  const cleanNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      outputImage: undefined,
      displayImage: undefined,
    },
  }));

  const workflow: SavedWorkflow = {
    id: nanoid(8),
    name,
    nodes: cleanNodes,
    edges,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  workflows.unshift(workflow);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

export function loadWorkflows(): SavedWorkflow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteWorkflow(id: string): void {
  const workflows = loadWorkflows().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}
