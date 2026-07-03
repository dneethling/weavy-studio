import { topologicalSortByLevel } from './topologicalSort';
import { nodeExecutors } from './nodeExecutors';
import { resetCancel, isCancelled, CancelledError } from './taskQueue';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useExecutionStore } from '../../store/useExecutionStore';
import { useGalleryStore } from '../../store/useGalleryStore';
import { NODE_DEFINITIONS } from '../../constants/nodeDefinitions';
import { MAX_BATCH_ITEMS } from '../../constants/defaults';
import type { Node, Edge } from '@xyflow/react';
import type { MediaPayload } from '../../types/nodes';
import { isVideoPayload } from '../../types/nodes';

export interface RunSummary {
  cancelled: boolean;
  imageCount: number;
  videoCount: number;
}

/** Node types whose outputs are auto-collected into the gallery. */
const GALLERY_SOURCE_TYPES = new Set(['imageGenerate', 'imageEdit', 'videoGenerate']);

function isMediaPayload(value: unknown): value is MediaPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as MediaPayload).base64 === 'string' &&
    typeof (value as MediaPayload).mimeType === 'string'
  );
}

/** Everything a node produced, always as a flat list. */
function asList(output: unknown): unknown[] {
  return Array.isArray(output) ? output : [output];
}

function resolveInputs(
  nodeId: string,
  edges: Edge[],
  outputs: Record<string, unknown>
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  const incomingEdges = edges.filter((e) => e.target === nodeId);

  for (const edge of incomingEdges) {
    const targetHandle = edge.targetHandle!;
    inputs[targetHandle] = outputs[edge.source];
  }

  return inputs;
}

/**
 * Batch semantics: any upstream output may be an array. The batch size of a
 * node is the largest array among its inputs; shorter arrays cycle and
 * scalars broadcast to every item. The executor itself stays single-item —
 * the engine maps it over the batch.
 */
function expandBatch(inputs: Record<string, unknown>): Array<Record<string, unknown>> {
  let batchSize = 1;
  for (const value of Object.values(inputs)) {
    if (Array.isArray(value)) batchSize = Math.max(batchSize, value.length);
  }

  if (batchSize > MAX_BATCH_ITEMS) {
    throw new Error(
      `Batch of ${batchSize} items exceeds the limit of ${MAX_BATCH_ITEMS}. Reduce the prompt list or batch count.`
    );
  }

  if (batchSize === 1) return [inputs];

  return Array.from({ length: batchSize }, (_, i) => {
    const item: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(inputs)) {
      item[key] = Array.isArray(value) ? value[i % value.length] : value;
    }
    return item;
  });
}

export async function executeWorkflow(): Promise<RunSummary> {
  const { nodes, edges } = useWorkflowStore.getState();

  if (nodes.length === 0) {
    throw new Error('No nodes in the workflow.');
  }

  const executionStore = useExecutionStore.getState();
  resetCancel();

  // Compute execution levels — nodes in the same level can run in parallel
  const levels = topologicalSortByLevel(nodes, edges);
  const flatOrder = levels.flat();

  console.log(
    '[BxAI] Execution plan:',
    levels.map((batch, lvl) =>
      `Level ${lvl}: [${batch.map((id) => {
        const node = nodes.find((n) => n.id === id);
        return `${node?.type}(${id.slice(0, 8)})`;
      }).join(', ')}]`
    ).join(' → ')
  );

  executionStore.startExecution(flatOrder);

  const summary: RunSummary = { cancelled: false, imageCount: 0, videoCount: 0 };
  let failedNodeError: string | null = null;

  for (let level = 0; level < levels.length && !failedNodeError; level++) {
    if (isCancelled()) {
      summary.cancelled = true;
      break;
    }

    const batch = levels[level];
    if (batch.length > 1) {
      console.log(`[BxAI] Running ${batch.length} nodes in parallel (level ${level})`);
    }

    const results = await Promise.allSettled(
      batch.map((nodeId) => executeNode(nodeId, nodes, edges, summary))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        failedNodeError = result.value;
      } else if (result.status === 'rejected') {
        failedNodeError = String(result.reason);
      }
    }
  }

  if (isCancelled()) summary.cancelled = true;

  useExecutionStore.getState().finishExecution();

  // Re-throw so the caller (TopToolbar) can show the error toast
  if (failedNodeError && !summary.cancelled) {
    throw new Error(failedNodeError);
  }

  return summary;
}

/**
 * Execute a single node, mapping the executor over its input batch.
 * Returns an error string if it failed, or null on success.
 */
async function executeNode(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  summary: RunSummary
): Promise<string | null> {
  const node = nodes.find((n) => n.id === nodeId)!;

  console.log(`[BxAI] Executing node: ${node.type} (${nodeId.slice(0, 8)})`);
  const execStore = useExecutionStore.getState();
  execStore.setNodeStatus(nodeId, 'running');

  try {
    const executor = nodeExecutors[node.type!];
    if (!executor) {
      throw new Error(`No executor for node type: ${node.type}`);
    }

    const inputs = resolveInputs(nodeId, edges, useExecutionStore.getState().nodeOutputs);
    const batchItems = expandBatch(inputs);
    const total = batchItems.length;

    if (total > 1) {
      console.log(`[BxAI] Node ${node.type} mapping over batch of ${total} items`);
      useExecutionStore.getState().setNodeProgress(nodeId, 0, total);
    }

    // Run every batch item; AI calls throttle themselves via the global queue.
    let done = 0;
    const settled = await Promise.allSettled(
      batchItems.map((itemInputs) =>
        executor(node, itemInputs).finally(() => {
          done++;
          if (total > 1) {
            useExecutionStore.getState().setNodeProgress(nodeId, done, total);
          }
        })
      )
    );

    if (isCancelled()) throw new CancelledError();

    // Collect results, flattening executors that natively return batches
    const outputs: unknown[] = [];
    let failedItems = 0;
    let firstError: string | null = null;

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        outputs.push(...asList(result.value));
      } else {
        if (result.reason instanceof CancelledError) throw result.reason;
        failedItems++;
        if (!firstError) {
          firstError =
            result.reason instanceof Error ? result.reason.message : String(result.reason);
        }
      }
    }

    if (outputs.length === 0 && firstError) {
      throw new Error(firstError);
    }

    // Batch runs stay arrays; single results stay scalars (backward compatible)
    const output = outputs.length === 1 ? outputs[0] : outputs;

    useExecutionStore.getState().setNodeOutput(nodeId, output);
    useExecutionStore.getState().setNodeStatus(nodeId, 'success');

    if (failedItems > 0) {
      useExecutionStore
        .getState()
        .setNodeWarning(nodeId, `${failedItems}/${total} batch items failed: ${firstError}`);
      console.warn(`[BxAI] Node ${node.type}: ${failedItems}/${total} batch items failed`);
    }

    console.log(`[BxAI] Node ${node.type} completed (${outputs.length} output(s))`);

    writeBackPreviews(node, outputs);
    collectMedia(node, outputs, summary);

    return null;
  } catch (error) {
    if (error instanceof CancelledError || isCancelled()) {
      useExecutionStore.getState().setNodeStatus(nodeId, 'idle');
      return null;
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[BxAI] Node ${node.type} failed:`, message);
    useExecutionStore.getState().setNodeStatus(nodeId, 'error');
    useExecutionStore.getState().setNodeError(nodeId, message);
    return `${node.type} failed: ${message}`;
  }
}

/** Write outputs back into node data so node cards can render previews. */
function writeBackPreviews(node: Node, outputs: unknown[]): void {
  const media = outputs.filter(isMediaPayload);
  const images = media.filter((m) => !isVideoPayload(m));
  const videos = media.filter(isVideoPayload);

  const updateData: Record<string, unknown> = {};

  switch (node.type) {
    case 'imageDisplay':
      updateData.displayImage = images[0];
      updateData.displayImages = images;
      break;
    case 'videoDisplay':
      updateData.displayVideos = videos;
      break;
    case 'videoGenerate':
      updateData.outputVideo = videos[0];
      updateData.outputVideos = videos;
      break;
    case 'imageGenerate':
    case 'imageEdit':
    case 'compose':
    case 'blur':
    case 'resize':
    case 'crop':
    case 'invert':
      updateData.outputImage = images[0];
      updateData.outputImages = images;
      break;
    default:
      return;
  }

  useWorkflowStore.getState().updateNodeData(node.id, updateData);
}

/** Auto-collect AI-generated media into the gallery so batch runs accumulate. */
function collectMedia(node: Node, outputs: unknown[], summary: RunSummary): void {
  // Only media created here counts — downstream nodes just pass it along
  if (!GALLERY_SOURCE_TYPES.has(node.type!)) return;

  const media = outputs.filter(isMediaPayload);
  if (media.length === 0) return;

  for (const item of media) {
    if (isVideoPayload(item)) summary.videoCount++;
    else summary.imageCount++;
  }

  const label = NODE_DEFINITIONS[node.type!]?.label || node.type!;
  const addMedia = useGalleryStore.getState().addMedia;
  media.forEach((item, i) => {
    addMedia(item, node.id, media.length > 1 ? `${label} ${i + 1}/${media.length}` : label);
  });
}
