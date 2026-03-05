import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { TopToolbar } from './components/layout/TopToolbar';
import { Sidebar } from './components/layout/Sidebar';
import { PropertiesPanel } from './components/layout/PropertiesPanel';
import { GalleryPanel } from './components/layout/GalleryPanel';
import { WorkflowCanvas } from './components/canvas/WorkflowCanvas';
import { ToastContainer } from './components/shared/ToastContainer';
import { LoginPage } from './components/auth/LoginPage';
import { useAuthStore } from './store/useAuthStore';
import { Zap } from 'lucide-react';

export default function App() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Loading state — checking auth
  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-2 animate-pulse">
          <Zap size={24} className="text-purple-400" />
          <span className="text-lg font-semibold text-zinc-400">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated — show login
  if (!user) {
    return <LoginPage />;
  }

  // Authenticated — show app
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
