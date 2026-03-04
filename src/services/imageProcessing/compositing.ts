import type { ImagePayload, ComposeData } from '../../types/nodes';
import { base64ToDataUrl, canvasToImagePayload } from './imageConversion';

interface CompositeOptions {
  width: number;
  height: number;
  backgroundColor: string;
  layers: Array<{
    image: ImagePayload;
    config: ComposeData['layers'][0];
  }>;
}

export async function compositeImages(options: CompositeOptions): Promise<ImagePayload> {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, options.width, options.height);

  // Draw each layer
  for (const layer of options.layers) {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load layer image'));
      img.src = base64ToDataUrl(layer.image.base64, layer.image.mimeType);
    });

    ctx.save();
    ctx.globalAlpha = layer.config.opacity;
    ctx.globalCompositeOperation = layer.config.blendMode;
    ctx.drawImage(
      img,
      layer.config.x,
      layer.config.y,
      layer.config.width,
      layer.config.height
    );
    ctx.restore();
  }

  return canvasToImagePayload(canvas);
}
