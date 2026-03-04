import type { Node, Edge } from '@xyflow/react';

/**
 * Standard topological sort — returns a flat list of node IDs in dependency order.
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Workflow contains a cycle and cannot be executed.');
  }

  return sorted;
}

/**
 * Level-based topological sort — returns batches of node IDs grouped by dependency level.
 * Nodes in the same batch have no dependencies on each other and can run in parallel.
 *
 * Level 0: all source nodes (no incoming edges)
 * Level 1: nodes whose inputs are all from level 0
 * Level N: nodes whose inputs are all from levels < N
 */
export function topologicalSortByLevel(nodes: Node[], edges: Edge[]): string[][] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Seed level 0 with all zero-degree nodes
  let currentBatch: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) currentBatch.push(nodeId);
  }

  const batches: string[][] = [];
  let processedCount = 0;

  while (currentBatch.length > 0) {
    batches.push(currentBatch);
    processedCount += currentBatch.length;

    const nextBatch: string[] = [];

    for (const nodeId of currentBatch) {
      for (const neighbor of adjacency.get(nodeId) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          nextBatch.push(neighbor);
        }
      }
    }

    currentBatch = nextBatch;
  }

  if (processedCount !== nodes.length) {
    throw new Error('Workflow contains a cycle and cannot be executed.');
  }

  return batches;
}
