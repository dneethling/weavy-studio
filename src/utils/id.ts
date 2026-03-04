import { nanoid } from 'nanoid';

export function createNodeId() {
  return `node-${nanoid(8)}`;
}

export function createEdgeId() {
  return `edge-${nanoid(6)}`;
}
