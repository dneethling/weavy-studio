import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Download, X } from 'lucide-react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { base64ToDataUrl } from '../../services/imageProcessing/imageConversion';
import type { GalleryImage } from '../../store/useGalleryStore';

export function GalleryPanel() {
  const images = useGalleryStore((s) => s.images);
  const removeImage = useGalleryStore((s) => s.removeImage);
  const clearGallery = useGalleryStore((s) => s.clearGallery);
  const [collapsed, setCollapsed] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  const handleDownload = (img: GalleryImage) => {
    const link = document.createElement('a');
    link.href = base64ToDataUrl(img.image.base64, img.image.mimeType);
    link.download = `weavy-${img.id}.${img.image.mimeType.split('/')[1]}`;
    link.click();
  };

  return (
    <>
      <div className={`bg-zinc-900 border-t border-zinc-800 flex flex-col ${collapsed ? 'h-8' : ''}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Gallery</span>
            {images.length > 0 && (
              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                {images.length}
              </span>
            )}
          </div>
          {collapsed ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
        </button>

        {!collapsed && (
          <div className="flex-1 px-3 pb-2 overflow-x-auto">
            {images.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-[11px] text-zinc-600">Generated images will appear here</p>
              </div>
            ) : (
              <div className="flex gap-2 h-full items-start">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group shrink-0 h-[140px] w-[140px] rounded-md overflow-hidden border border-zinc-700 cursor-pointer"
                    onClick={() => setLightboxImage(img)}
                  >
                    <img
                      src={base64ToDataUrl(img.image.base64, img.image.mimeType)}
                      alt={img.sourceNodeLabel}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(img); }}
                        className="p-1 bg-zinc-800/80 rounded text-zinc-300 hover:text-white"
                      >
                        <Download size={10} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        className="p-1 bg-zinc-800/80 rounded text-zinc-300 hover:text-red-400"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
                {images.length > 0 && (
                  <button
                    onClick={clearGallery}
                    className="shrink-0 px-2 py-1 text-[10px] text-zinc-600 hover:text-red-400 self-center"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-4 right-4 text-zinc-400 hover:text-white" onClick={() => setLightboxImage(null)}>
            <X size={24} />
          </button>
          <img
            src={base64ToDataUrl(lightboxImage.image.base64, lightboxImage.image.mimeType)}
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
