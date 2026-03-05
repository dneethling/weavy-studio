import type { Node, Edge } from '@xyflow/react';
import type { SavedWorkflow } from '../../types/workflow';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'bxai-studio-workflows';

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

/** Export a single workflow as a downloadable JSON file */
export function exportWorkflow(id: string): void {
  const workflows = loadWorkflows();
  const wf = workflows.find((w) => w.id === id);
  if (!wf) return;
  downloadJSON(wf, `bxai-workflow-${slugify(wf.name)}.json`);
}

/** Export all saved workflows as a single JSON file */
export function exportAllWorkflows(): void {
  const workflows = loadWorkflows();
  if (workflows.length === 0) return;
  downloadJSON(workflows, `bxai-all-workflows-${Date.now()}.json`);
}

/** Import workflows from a JSON file, returns count of imported workflows */
export function importWorkflows(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const existing = loadWorkflows();
        const existingIds = new Set(existing.map((w) => w.id));

        let imported: SavedWorkflow[] = [];

        // Handle both single workflow and array of workflows
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          if (!isValidWorkflow(item)) continue;

          // Give a new ID if it collides
          const wf: SavedWorkflow = {
            ...item,
            id: existingIds.has(item.id) ? nanoid(8) : item.id,
            updatedAt: Date.now(),
          };
          imported.push(wf);
          existingIds.add(wf.id);
        }

        if (imported.length === 0) {
          reject(new Error('No valid workflows found in file'));
          return;
        }

        // Prepend imported workflows
        const merged = [...imported, ...existing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        resolve(imported.length);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function isValidWorkflow(obj: unknown): obj is SavedWorkflow {
  if (!obj || typeof obj !== 'object') return false;
  const w = obj as Record<string, unknown>;
  return (
    typeof w.name === 'string' &&
    Array.isArray(w.nodes) &&
    Array.isArray(w.edges)
  );
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
