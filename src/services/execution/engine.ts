import { topologicalSortByLevel } from './topologicalSort';
import { nodeExecutors } from './nodeExecutors';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useExecutionStore } from '../../store/useExecutionStore';
import type { Node, Edge } from '@xyflow/react';

function resolveInputs(
  nodeId: string,
  _nodes: Node[],
  edges: Edge[],
  outputs: Record<string, unknown>
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  const incomingEdges = edges.filter((e) => e.target === nodeId);

  for (const edge of incomingEdges) {
    const targetHandle = edge.targetHandle!;
    const sourceOutput = outputs[edge.source];
    inputs[targetHandle] = sourceOutput;
  }

  return inputs;
}

export async function executeWorkflow(): Promise<void> {
  const { nodes, edges } = useWorkflowStore.getState();

  if (nodes.length === 0) {
    throw new Error('No nodes in the workflow.');
  }

  const executionStore = useExecutionStore.getState();

  // Compute execution levels — nodes in the same level can run in parallel
  const levels = topologicalSortByLevel(nodes, edges);
  const flatOrder = levels.flat();

  console.log(
    '[Weavy] Execution plan:',
    levels.map((batch, lvl) =>
      `Level ${lvl}: [${batch.map((id) => {
        const node = nodes.find((n) => n.id === id);
        return `${node?.type}(${id.slice(0, 8)})`;
      }).join(', ')}]`
    ).join(' → ')
  );

  executionStore.startExecution(flatOrder);

  let failedNodeError: string | null = null;

  for (let level = 0; level < levels.length; level++) {
    const batch = levels[level];

    if (batch.length === 1) {
      // Single node in this level — run directly (no overhead of Promise.all)
      const nodeId = batch[0];
      const error = await executeNode(nodeId, nodes, edges);
      if (error) {
        failedNodeError = error;
        break;
      }
    } else {
      // Multiple independent nodes — run in parallel
      console.log(`[Weavy] Running ${batch.length} nodes in parallel (level ${level})`);

      const results = await Promise.allSettled(
        batch.map((nodeId) => executeNode(nodeId, nodes, edges))
      );

      // Check for failures
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          failedNodeError = result.value;
        } else if (result.status === 'rejected') {
          failedNodeError = String(result.reason);
        }
      }

      if (failedNodeError) break;
    }
  }

  useExecutionStore.getState().finishExecution();

  // Re-throw so the caller (TopToolbar) can show the error toast
  if (failedNodeError) {
    throw new Error(failedNodeError);
  }
}

/**
 * Execute a single node. Returns an error string if it failed, or null on success.
 */
async function executeNode(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): Promise<string | null> {
  const node = nodes.find((n) => n.id === nodeId)!;

  console.log(`[Weavy] Executing node: ${node.type} (${nodeId.slice(0, 8)})`);
  useExecutionStore.getState().setNodeStatus(nodeId, 'running');

  try {
    const inputs = resolveInputs(
      nodeId,
      nodes,
      edges,
      useExecutionStore.getState().nodeOutputs
    );

    const executor = nodeExecutors[node.type!];
    if (!executor) {
      throw new Error(`No executor for node type: ${node.type}`);
    }

    const output = await executor(node, inputs);

    useExecutionStore.getState().setNodeOutput(nodeId, output);
    useExecutionStore.getState().setNodeStatus(nodeId, 'success');
    console.log(`[Weavy] Node ${node.type} completed successfully`);

    // Write output back to node data for preview
    const updateData: Record<string, unknown> = {};
    if (node.type === 'imageDisplay') {
      updateData.displayImage = output;
    } else if (
      node.type === 'imageGenerate' ||
      node.type === 'imageEdit' ||
      node.type === 'compose' ||
      node.type === 'blur' ||
      node.type === 'resize' ||
      node.type === 'crop' ||
      node.type === 'invert'
    ) {
      updateData.outputImage = output;
    }

    if (Object.keys(updateData).length > 0) {
      useWorkflowStore.getState().updateNodeData(nodeId, updateData);
    }

    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Weavy] Node ${node.type} failed:`, message);
    useExecutionStore.getState().setNodeStatus(nodeId, 'error');
    useExecutionStore.getState().setNodeError(nodeId, message);
    return `${node.type} failed: ${message}`;
  }
}
