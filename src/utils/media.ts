import { zipSync } from 'fflate';
import type { MediaPayload } from '../types/nodes';
import { isVideoPayload } from '../types/nodes';

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function mediaExtension(media: MediaPayload): string {
  return media.mimeType.split('/')[1] ?? 'bin';
}

/** Trigger a browser download of a single media payload. */
export function downloadMedia(media: MediaPayload, filename: string): void {
  const bytes = base64ToBytes(media.base64);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: media.mimeType });
  downloadBlob(blob, filename);
}

/**
 * Bundle many media payloads into a single ZIP download.
 * PNG/JPEG/MP4 are already compressed, so entries are stored (level 0) —
 * zipping hundreds of outputs stays fast.
 */
export function downloadMediaAsZip(
  entries: Array<{ media: MediaPayload; name: string }>,
  zipName: string
): void {
  const files: Record<string, [Uint8Array, { level: 0 }]> = {};
  const usedNames = new Set<string>();

  for (const { media, name } of entries) {
    const ext = mediaExtension(media);
    let filename = `${name}.${ext}`;
    // De-duplicate names inside the archive
    for (let i = 2; usedNames.has(filename); i++) {
      filename = `${name}-${i}.${ext}`;
    }
    usedNames.add(filename);
    files[filename] = [base64ToBytes(media.base64), { level: 0 }];
  }

  const zipped = zipSync(files);
  const blob = new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
  downloadBlob(blob, zipName);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Data URL for previews. Videos can be large — prefer object URLs for playback. */
export function mediaToDataUrl(media: MediaPayload): string {
  return `data:${media.mimeType};base64,${media.base64}`;
}

export { isVideoPayload };
