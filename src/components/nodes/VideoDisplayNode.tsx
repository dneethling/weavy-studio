import { memo, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { MonitorPlay, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { useNodeData } from './useNodeData';
import { useMediaObjectUrl } from '../../utils/useObjectUrl';
import { downloadMedia, downloadMediaAsZip } from '../../utils/media';
import type { VideoDisplayData } from '../../types/nodes';

export const VideoDisplayNode = memo(function VideoDisplayNode(props: NodeProps) {
  const [data] = useNodeData<VideoDisplayData>(props);
  const [index, setIndex] = useState(0);

  const videos = data.displayVideos ?? [];
  const current = videos[Math.min(index, videos.length - 1)];
  const videoUrl = useMediaObjectUrl(current);

  const handleDownload = () => {
    if (!current) return;
    downloadMedia(current, `bxai-video-${(data.label || 'output').replace(/\s+/g, '_')}-${index + 1}`);
  };

  const handleDownloadAll = () => {
    if (videos.length === 0) return;
    downloadMediaAsZip(
      videos.map((media, i) => ({ media, name: `video-${i + 1}` })),
      `bxai-videos-${(data.label || 'output').replace(/\s+/g, '_')}.zip`
    );
  };

  return (
    <BaseNode id={props.id} type="videoDisplay" icon={<MonitorPlay size={14} />} selected={props.selected}>
      <div className="space-y-2">
        {videos.length > 0 && current ? (
          <>
            <video
              src={videoUrl}
              controls
              muted
              loop
              className="nodrag w-full rounded border border-zinc-700"
            />

            {videos.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setIndex((i) => (i - 1 + videos.length) % videos.length)}
                  className="nodrag p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"
                >
                  <ChevronLeft size={10} />
                </button>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {index + 1} / {videos.length}
                </span>
                <button
                  onClick={() => setIndex((i) => (i + 1) % videos.length)}
                  className="nodrag p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"
                >
                  <ChevronRight size={10} />
                </button>
              </div>
            )}

            <div className="flex gap-1">
              <button
                onClick={handleDownload}
                className="nodrag flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Download size={10} />
                Save
              </button>
              {videos.length > 1 && (
                <button
                  onClick={handleDownloadAll}
                  className="nodrag flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Download size={10} />
                  All ({videos.length}) ZIP
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-24 bg-zinc-800/50 rounded border border-dashed border-zinc-700 flex items-center justify-center">
            <span className="text-[10px] text-zinc-600">Connect a video input</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
});
