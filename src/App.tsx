import { ReactFlowProvider } from '@xyflow/react';
import { TopToolbar } from './components/layout/TopToolbar';
import { Sidebar } from './components/layout/Sidebar';
import { PropertiesPanel } from './components/layout/PropertiesPanel';
import { GalleryPanel } from './components/layout/GalleryPanel';
import { WorkflowCanvas } from './components/canvas/WorkflowCanvas';
import { ToastContainer } from './components/shared/ToastContainer';

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen grid grid-rows-[48px_1fr_auto] grid-cols-[240px_1fr_300px] bg-zinc-950 text-zinc-100 overflow-hidden">
        {/* Top toolbar spans all columns */}
        <div className="col-span-3">
          <TopToolbar />
        </div>

        {/* Sidebar */}
        <Sidebar />

        {/* Main canvas */}
        <WorkflowCanvas />

        {/* Properties panel */}
        <PropertiesPanel />

        {/* Gallery panel spans all columns */}
        <div className="col-span-3">
          <GalleryPanel />
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </ReactFlowProvider>
  );
}
