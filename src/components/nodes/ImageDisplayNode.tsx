import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Image, Download, BookmarkPlus } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { useNodeData } from './useNodeData';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import { downloadMedia, downloadMediaAsZip } from '../../utils/media';
import { useGalleryStore } from '../../store/useGalleryStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { GEMINI_MODELS } from '../../constants/defaults';
import type { ImageDisplayData, ImagePayload } from '../../types/nodes';

/**
 * Walk upstream edges from a Display Image node to find the AI node that generated
 * the image, returning its model label and aspect ratio for the filename.
 */
function useSourceMetadata(nodeId: string) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const globalModel = useSettingsStore((s) => s.globalModel);

  // Walk upstream — follow image edges backwards until we find an AI node
  let currentId: string | null = nodeId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = nodes.find((n) => n.id === currentId);
    if (!node) break;

    const data = node.data as Record<string, unknown>;

    // Found an AI generation/edit node — extract metadata
    if (node.type === 'imageGenerate' || node.type === 'imageEdit') {
      const useGlobal = data.useGlobalModel !== false;
      const modelId = useGlobal ? globalModel : (data.model as string);
      const modelLabel = GEMINI_MODELS.find((m) => m.id === modelId)?.label || modelId;
      const aspectRatio = (data.aspectRatio as string) || undefined;
      return { modelLabel, aspectRatio };
    }

    // Follow the image-in edge upstream
    const inEdge = edges.find((e) => e.target === currentId && e.targetHandle === 'image-in');
    currentId = inEdge?.source ?? null;
  }

  return { modelLabel: undefined, aspectRatio: undefined };
}

function buildFilename(label: string | undefined, modelLabel: string | undefined, aspectRatio: string | undefined, suffix?: string) {
  const parts = ['bxai'];
  if (modelLabel) parts.push(modelLabel.replace(/[^a-zA-Z0-9.()-]/g, '_'));
  if (aspectRatio) parts.push(aspectRatio.replace(':', 'x'));
  parts.push(label || 'output');
  if (suffix) parts.push(suffix);
  return parts.join('-');
}

export const ImageDisplayNode = memo(function ImageDisplayNode(props: NodeProps) {
  const [data] = useNodeData<ImageDisplayData>(props);
  const addMedia = useGalleryStore((s) => s.addMedia);
  const { modelLabel, aspectRatio } = useSourceMetadata(props.id);

  const images: ImagePayload[] =
    data.displayImages && data.displayImages.length > 0
      ? data.displayImages
      : data.displayImage
        ? [data.displayImage]
        : [];

  const handleDownload = () => {
    if (images.length === 0) return;
    if (images.length === 1) {
      downloadMedia(images[0], buildFilename(data.label, modelLabel, aspectRatio));
    } else {
      downloadMediaAsZip(
        images.map((media, i) => ({
          media,
          name: buildFilename(data.label, modelLabel, aspectRatio, String(i + 1)),
        })),
        `${buildFilename(data.label, modelLabel, aspectRatio)}.zip`
      );
    }
  };

  const handleAddToGallery = () => {
    images.forEach((img, i) => {
      addMedia(img, props.id, images.length > 1 ? `${data.label || 'Output'} ${i + 1}` : data.label || 'Output');
    });
  };

  return (
    <BaseNode id={props.id} type="imageDisplay" icon={<Image size={14} />} selected={props.selected}>
      <div className="space-y-2">
        {images.length > 0 ? (
          <>
            {images.length === 1 ? (
              <img
                src={base64ToDataUrl(images[0].base64, images[0].mimeType)}
                alt={data.label}
                className="w-full rounded border border-zinc-700"
              />
            ) : (
              <div className="space-y-1">
                <div className={images.length === 2 ? 'grid grid-cols-2 gap-1' : 'grid grid-cols-3 gap-1'}>
                  {images.slice(0, 9).map((img, i) => (
                    <img
                      key={i}
                      src={base64ToDataUrl(img.base64, img.mimeType)}
                      alt={`${data.label} ${i + 1}`}
                      className="w-full aspect-square object-cover rounded border border-zinc-700"
                    />
                  ))}
                </div>
                <p className="text-[9px] text-zinc-500 text-center">
                  {images.length} outputs{images.length > 9 ? ' (showing 9)' : ''}
                </p>
              </div>
            )}
            <div className="flex gap-1">
              <button
                onClick={handleDownload}
                className="nodrag flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Download size={10} />
                {images.length > 1 ? `Save all (${images.length}) ZIP` : 'Save'}
              </button>
              <button
                onClick={handleAddToGallery}
                className="nodrag flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <BookmarkPlus size={10} />
                Gallery
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-32 bg-zinc-800/50 rounded border border-dashed border-zinc-700 flex items-center justify-center">
            <span className="text-[10px] text-zinc-600">Connect an image input</span>
          </div>
        )}
      </div>
    </BaseNode>
  );
});
