import type { Node, Edge } from '@xyflow/react';
import { topologicalSortByLevel } from '../services/execution/topologicalSort';

const NODE_WIDTH = 260;
const NODE_HEIGHT_ESTIMATES: Record<string, number> = {
  textPrompt: 120,
  imageImport: 160,
  imageGenerate: 280,
  imageEdit: 240,
  imageDisplay: 240,
  compose: 180,
  blur: 120,
  resize: 120,
  crop: 120,
  invert: 100,
  promptConcat: 100,
  stickyNote: 120,
};
const DEFAULT_HEIGHT = 160;

const H_GAP = 80; // horizontal gap between columns
const V_GAP = 40; // vertical gap between nodes in a column

/**
 * Auto-arrange nodes in a clean left-to-right DAG layout.
 *
 * - Connected nodes are arranged by dependency level (topological sort)
 * - Disconnected nodes (sticky notes, orphans) are placed in a row below
 * - Returns new node positions without mutating the originals
 */
export function autoLayoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  // Separate connected subgraph from isolated nodes
  const connectedIds = new Set<string>();
  for (const edge of edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }

  const connectedNodes = nodes.filter((n) => connectedIds.has(n.id));
  const isolatedNodes = nodes.filter((n) => !connectedIds.has(n.id));

  // Layout connected nodes by level
  let levels: string[][] = [];
  if (connectedNodes.length > 0) {
    try {
      levels = topologicalSortByLevel(connectedNodes, edges);
    } catch {
      // If there's a cycle or error, fall back to a simple grid
      levels = [connectedNodes.map((n) => n.id)];
    }
  }

  const newPositions = new Map<string, { x: number; y: number }>();

  // Arrange each level as a column, centered vertically
  let xOffset = 0;

  for (const level of levels) {
    // Calculate total height of this column
    const columnHeights = level.map((id) => {
      const node = nodes.find((n) => n.id === id)!;
      return NODE_HEIGHT_ESTIMATES[node.type!] || DEFAULT_HEIGHT;
    });
    const totalHeight = columnHeights.reduce((a, b) => a + b, 0) + V_GAP * (level.length - 1);
    let yOffset = -totalHeight / 2; // center vertically around y=0

    for (let i = 0; i < level.length; i++) {
      const nodeId = level[i];
      const height = columnHeights[i];

      newPositions.set(nodeId, {
        x: xOffset,
        y: yOffset,
      });

      yOffset += height + V_GAP;
    }

    xOffset += NODE_WIDTH + H_GAP;
  }

  // Place isolated nodes in a row below the main graph
  if (isolatedNodes.length > 0) {
    const maxY = Math.max(
      0,
      ...Array.from(newPositions.values()).map((p) => p.y)
    );
    const bottomY = maxY + 300;

    let isoX = 0;
    for (const node of isolatedNodes) {
      newPositions.set(node.id, {
        x: isoX,
        y: bottomY,
      });
      isoX += NODE_WIDTH + H_GAP / 2;
    }
  }

  // Apply new positions
  return nodes.map((node) => {
    const pos = newPositions.get(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: pos,
    };
  });
}
