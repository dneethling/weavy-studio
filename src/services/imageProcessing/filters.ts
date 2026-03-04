import type { ImagePayload } from '../../types/nodes';
import { base64ToDataUrl, canvasToImagePayload } from './imageConversion';

/**
 * Loads a base64 image into an HTMLImageElement
 */
function loadImage(payload: ImagePayload): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64ToDataUrl(payload.base64, payload.mimeType);
  });
}

/**
 * Apply Gaussian or Box blur to an image using CSS filter
 */
export async function blurImage(
  source: ImagePayload,
  radius: number,
): Promise<ImagePayload> {
  const img = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.filter = `blur(${radius}px)`;

  // Draw slightly larger to avoid edge artifacts
  const margin = radius * 2;
  ctx.drawImage(img, -margin, -margin, canvas.width + margin * 2, canvas.height + margin * 2);

  return canvasToImagePayload(canvas, source.mimeType as 'image/png' | 'image/jpeg');
}

/**
 * Resize an image to target dimensions
 */
export async function resizeImage(
  source: ImagePayload,
  targetWidth: number,
  targetHeight: number,
  maintainAspectRatio: boolean,
): Promise<ImagePayload> {
  const img = await loadImage(source);

  let finalWidth = targetWidth;
  let finalHeight = targetHeight;

  if (maintainAspectRatio) {
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    if (targetWidth / targetHeight > aspectRatio) {
      finalWidth = Math.round(targetHeight * aspectRatio);
    } else {
      finalHeight = Math.round(targetWidth / aspectRatio);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext('2d')!;

  // Use high quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

  return canvasToImagePayload(canvas, source.mimeType as 'image/png' | 'image/jpeg');
}

/**
 * Crop an image to the specified region
 */
export async function cropImage(
  source: ImagePayload,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<ImagePayload> {
  const img = await loadImage(source);

  // Clamp values to image bounds
  const sx = Math.max(0, Math.min(x, img.naturalWidth));
  const sy = Math.max(0, Math.min(y, img.naturalHeight));
  const sw = Math.min(width, img.naturalWidth - sx);
  const sh = Math.min(height, img.naturalHeight - sy);

  if (sw <= 0 || sh <= 0) {
    throw new Error('Crop region is outside the image bounds.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  return canvasToImagePayload(canvas, source.mimeType as 'image/png' | 'image/jpeg');
}

/**
 * Invert all color channels of an image
 */
export async function invertImage(source: ImagePayload): Promise<ImagePayload> {
  const img = await loadImage(source);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];       // R
    data[i + 1] = 255 - data[i + 1]; // G
    data[i + 2] = 255 - data[i + 2]; // B
    // Alpha channel (data[i + 3]) stays the same
  }

  ctx.putImageData(imageData, 0, 0);

  return canvasToImagePayload(canvas, source.mimeType as 'image/png' | 'image/jpeg');
}
