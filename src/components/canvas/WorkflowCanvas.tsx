import { useCallback, useRef, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  type Connection,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '../../store/useWorkflowStore';
import { NODE_DEFINITIONS } from '../../constants/nodeDefinitions';

import { TextPromptNode } from '../nodes/TextPromptNode';
import { ImageImportNode } from '../nodes/ImageImportNode';
import { ImageGenerateNode } from '../nodes/ImageGenerateNode';
import { ImageEditNode } from '../nodes/ImageEditNode';
import { ImageDisplayNode } from '../nodes/ImageDisplayNode';
import { ComposeNode } from '../nodes/ComposeNode';
import { BlurNode } from '../nodes/BlurNode';
import { ResizeNode } from '../nodes/ResizeNode';
import { CropNode } from '../nodes/CropNode';
import { InvertNode } from '../nodes/InvertNode';
import { PromptConcatNode } from '../nodes/PromptConcatNode';
import { StickyNoteNode } from '../nodes/StickyNoteNode';
import { CustomEdge } from './CustomEdge';
import { BottomToolbar } from '../layout/BottomToolbar';

// CRITICAL: Define outside component to prevent infinite re-renders
const nodeTypes = {
  textPrompt: TextPromptNode,
  imageImport: ImageImportNode,
  imageGenerate: ImageGenerateNode,
  imageEdit: ImageEditNode,
  imageDisplay: ImageDisplayNode,
  compose: ComposeNode,
  blur: BlurNode,
  resize: ResizeNode,
  crop: CropNode,
  invert: InvertNode,
  promptConcat: PromptConcatNode,
  stickyNote: StickyNoteNode,
} as const;

const edgeTypes = {
  custom: CustomEdge,
} as const;

export function WorkflowCanvas() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const addNode = useWorkflowStore((s) => s.addNode);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const isValidConnection = useCallback(
    (connection: Connection | { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) => {
      // Prevent self-connections
      if (connection.source === connection.target) return false;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return false;

      const sourceDef = NODE_DEFINITIONS[sourceNode.type!];
      const targetDef = NODE_DEFINITIONS[targetNode.type!];
      if (!sourceDef || !targetDef) return false;

      const sourceHandle = sourceDef.outputs.find((h) => h.id === connection.sourceHandle);
      const targetHandle = targetDef.inputs.find((h) => h.id === connection.targetHandle);
      if (!sourceHandle || !targetHandle) return false;

      return sourceHandle.dataType === targetHandle.dataType;
    },
    [nodes]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/weavy-node-type');
      if (!nodeType || !NODE_DEFINITIONS[nodeType]) return;

      const rfInstance = reactFlowInstance.current;
      if (!rfInstance || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addNode(nodeType, position);
    },
    [addNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div ref={reactFlowWrapper} className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'custom' }}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#27272a"
        />
        <MiniMap
          nodeColor="#3f3f46"
          maskColor="rgba(0,0,0,0.6)"
          className="!bg-zinc-900"
        />
      </ReactFlow>
      <BottomToolbar />
    </div>
  );
}
