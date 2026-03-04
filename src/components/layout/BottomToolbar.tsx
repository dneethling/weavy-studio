import { Undo2, Redo2, MousePointer2, Hand, ZoomIn, ZoomOut, Maximize, LayoutGrid } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { autoLayoutNodes } from '../../utils/autoLayout';
import { useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

type CanvasTool = 'select' | 'pan';

export function BottomToolbar() {
  const undo = useWorkflowStore((s) => s.undo);
  const redo = useWorkflowStore((s) => s.redo);
  const canUndo = useWorkflowStore((s) => s.canUndo);
  const canRedo = useWorkflowStore((s) => s.canRedo);
  const nodes = useWorkflowStore((s) => s.nodes);
  const pushHistory = useWorkflowStore((s) => s.pushHistory);

  const reactFlow = useReactFlow();
  const [zoom, setZoom] = useState(100);
  const [tool, setTool] = useState<CanvasTool>('select');

  // Track zoom level
  useEffect(() => {
    const handleViewportChange = () => {
      const viewport = reactFlow.getViewport();
      setZoom(Math.round(viewport.zoom * 100));
    };

    // Poll zoom level (ReactFlow doesn't have a direct zoom change event easily accessible here)
    const interval = setInterval(handleViewportChange, 500);
    return () => clearInterval(interval);
  }, [reactFlow]);

  const handleZoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: 200 });
  }, [reactFlow]);

  const handleZoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: 200 });
  }, [reactFlow]);

  const handleFitView = useCallback(() => {
    reactFlow.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlow]);

  const handleAutoArrange = useCallback(() => {
    const currentNodes = useWorkflowStore.getState().nodes;
    const currentEdges = useWorkflowStore.getState().edges;
    if (currentNodes.length === 0) return;

    pushHistory();
    const arranged = autoLayoutNodes(currentNodes, currentEdges);
    useWorkflowStore.setState({ nodes: arranged });

    // Fit view after a tick so positions are applied
    setTimeout(() => {
      reactFlow.fitView({ padding: 0.2, duration: 300 });
    }, 50);
  }, [reactFlow, pushHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (isMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (isMeta && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-2 py-1.5 shadow-xl z-10">
      {/* Tool selector */}
      <button
        onClick={() => setTool('select')}
        className={cn(
          'p-1.5 rounded transition-colors',
          tool === 'select'
            ? 'bg-purple-500/20 text-purple-400'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        )}
        title="Select (V)"
      >
        <MousePointer2 size={14} />
      </button>
      <button
        onClick={() => setTool('pan')}
        className={cn(
          'p-1.5 rounded transition-colors',
          tool === 'pan'
            ? 'bg-purple-500/20 text-purple-400'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        )}
        title="Pan (H)"
      >
        <Hand size={14} />
      </button>

      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className={cn(
          'p-1.5 rounded transition-colors',
          canUndo
            ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            : 'text-zinc-700 cursor-not-allowed'
        )}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={14} />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className={cn(
          'p-1.5 rounded transition-colors',
          canRedo
            ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            : 'text-zinc-700 cursor-not-allowed'
        )}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 size={14} />
      </button>

      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Zoom controls */}
      <button
        onClick={handleZoomOut}
        className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        title="Zoom Out"
      >
        <ZoomOut size={14} />
      </button>
      <span className="text-[10px] text-zinc-500 font-mono w-9 text-center tabular-nums">
        {zoom}%
      </span>
      <button
        onClick={handleZoomIn}
        className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        title="Zoom In"
      >
        <ZoomIn size={14} />
      </button>
      <button
        onClick={handleFitView}
        className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        title="Fit to View"
      >
        <Maximize size={14} />
      </button>
      <button
        onClick={handleAutoArrange}
        className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        title="Auto Arrange"
      >
        <LayoutGrid size={14} />
      </button>

      {/* Node count */}
      <div className="w-px h-5 bg-zinc-700 mx-1" />
      <span className="text-[10px] text-zinc-600 px-1">
        {nodes.length} node{nodes.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
