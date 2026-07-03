import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Download, X, PackageOpen, Play } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { downloadMedia, downloadMediaAsZip, mediaToDataUrl } from '../../utils/media';
import { useMediaObjectUrl } from '../../utils/useObjectUrl';
import { isVideoPayload } from '../../types/nodes';
import type { GalleryItem } from '../../store/useGalleryStore';

export function GalleryPanel() {
  const items = useGalleryStore((s) => s.items);
  const removeItem = useGalleryStore((s) => s.removeItem);
  const clearGallery = useGalleryStore((s) => s.clearGallery);
  const [collapsed, setCollapsed] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const videoCount = items.filter((i) => isVideoPayload(i.media)).length;
  const imageCount = items.length - videoCount;

  const handleDownload = (item: GalleryItem) => {
    downloadMedia(item.media, `bxai-${item.sourceNodeLabel.replace(/[^a-zA-Z0-9]+/g, '_')}-${item.id}`);
  };

  const handleDownloadAll = () => {
    if (items.length === 0) return;
    downloadMediaAsZip(
      items.map((item, i) => ({
        media: item.media,
        name: `${String(items.length - i).padStart(3, '0')}-${item.sourceNodeLabel.replace(/[^a-zA-Z0-9]+/g, '_')}`,
      })),
      `bxai-gallery-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.zip`
    );
  };

  return (
    <>
      <div className={`bg-zinc-900 border-t border-zinc-800 flex flex-col ${collapsed ? 'h-8' : ''}`}>
        <div className="flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/50 transition-colors">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <span className="text-xs font-semibold text-zinc-500">Gallery</span>
            {items.length > 0 && (
              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                {imageCount > 0 && `${imageCount} img`}
                {imageCount > 0 && videoCount > 0 && ' · '}
                {videoCount > 0 && `${videoCount} vid`}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1">
            {items.length > 1 && (
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-purple-300 hover:bg-zinc-800 rounded transition-colors"
                title="Download everything as a ZIP archive"
              >
                <PackageOpen size={11} />
                ZIP all
              </button>
            )}
            <button onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="flex-1 px-3 pb-2 overflow-x-auto">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-[11px] text-zinc-600">Generated images and videos accumulate here — every run adds its outputs</p>
              </div>
            ) : (
              <div className="flex gap-2 h-full items-start">
                {items.map((item) => (
                  <GalleryTile
                    key={item.id}
                    item={item}
                    onOpen={() => setLightboxItem(item)}
                    onDownload={() => handleDownload(item)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
                <button
                  onClick={clearGallery}
                  className="shrink-0 px-2 py-1 text-[10px] text-zinc-600 hover:text-red-400 self-center"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxItem(null)}>
          <button className="absolute top-4 right-4 text-zinc-400 hover:text-white" onClick={() => setLightboxItem(null)}>
            <X size={24} />
          </button>
          <Lightbox item={lightboxItem} />
        </div>
      )}
    </>
  );
}

function GalleryTile({
  item,
  onOpen,
  onDownload,
  onRemove,
}: {
  item: GalleryItem;
  onOpen: () => void;
  onDownload: () => void;
  onRemove: () => void;
}) {
  const isVideo = isVideoPayload(item.media);
  const videoUrl = useMediaObjectUrl(isVideo ? item.media : undefined);

  return (
    <div
      className="relative group shrink-0 h-[140px] w-[140px] rounded-md overflow-hidden border border-zinc-700 cursor-pointer bg-black"
      onClick={onOpen}
    >
      {isVideo ? (
        <>
          <video src={videoUrl} muted className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="p-1.5 bg-black/50 rounded-full">
              <Play size={14} className="text-white" />
            </div>
          </div>
        </>
      ) : (
        <img
          src={mediaToDataUrl(item.media)}
          alt={item.sourceNodeLabel}
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="p-1 bg-zinc-800/80 rounded text-zinc-300 hover:text-white"
        >
          <Download size={10} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 bg-zinc-800/80 rounded text-zinc-300 hover:text-red-400"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}

function Lightbox({ item }: { item: GalleryItem }) {
  const isVideo = isVideoPayload(item.media);
  const videoUrl = useMediaObjectUrl(isVideo ? item.media : undefined);

  if (isVideo) {
    return (
      <video
        src={videoUrl}
        controls
        autoPlay
        loop
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <img
      src={mediaToDataUrl(item.media)}
      alt="Preview"
      className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
      onClick={(e) => e.stopPropagation()}
    />
  );
}
