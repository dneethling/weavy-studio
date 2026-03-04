import type { ImagePayload } from '../../types/nodes';

export function base64ToDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

export function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/data:(.*?);/)?.[1] ?? 'image/png';
  return { base64: data, mimeType };
}

export async function getImageDimensions(
  base64: string,
  mimeType: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image for dimensions'));
    img.src = base64ToDataUrl(base64, mimeType);
  });
}

export async function canvasToImagePayload(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  mimeType: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<ImagePayload> {
  let base64: string;
  let width: number;
  let height: number;

  if (canvas instanceof HTMLCanvasElement) {
    const dataUrl = canvas.toDataURL(mimeType);
    base64 = dataUrlToBase64(dataUrl).base64;
    width = canvas.width;
    height = canvas.height;
  } else {
    const blob = await canvas.convertToBlob({ type: mimeType });
    const buffer = await blob.arrayBuffer();
    base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    width = canvas.width;
    height = canvas.height;
  }

  return { base64, mimeType, width, height };
}
