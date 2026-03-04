import { memo, useRef } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Upload } from 'lucide-react';
import { BaseNode, useNodeData } from './BaseNode';
import { base64ToDataUrl, dataUrlToBase64, getImageDimensions } from '../../services/imageProcessing/imageConversion';
import type { ImageImportData, ImagePayload } from '../../types/nodes';

export const ImageImportNode = memo(function ImageImportNode(props: NodeProps) {
  const [data, update] = useNodeData<ImageImportData>(props);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const { base64, mimeType } = dataUrlToBase64(dataUrl);
      const dims = await getImageDimensions(base64, mimeType);
      const payload: ImagePayload = {
        base64,
        mimeType: mimeType as ImagePayload['mimeType'],
        width: dims.width,
        height: dims.height,
      };
      update({ importedImage: payload, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <BaseNode id={props.id} type="imageImport" icon={<Upload size={14} />} selected={props.selected}>
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {data.importedImage ? (
          <>
            <img
              src={base64ToDataUrl(data.importedImage.base64, data.importedImage.mimeType)}
              alt="Imported"
              className="w-full rounded border border-zinc-700"
            />
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-zinc-500 truncate flex-1">
                {data.fileName || 'image'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="nodrag text-[9px] text-indigo-400 hover:text-indigo-300"
              >
                Replace
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="nodrag w-full h-24 bg-zinc-800/50 rounded border border-dashed border-zinc-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Upload size={16} className="text-zinc-500" />
            <span className="text-[10px] text-zinc-500">Click to import image</span>
          </button>
        )}
      </div>
    </BaseNode>
  );
});
