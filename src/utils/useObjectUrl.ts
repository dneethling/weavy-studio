import { useEffect, useMemo, useState } from 'react';
import type { MediaPayload } from '../types/nodes';
import { base64ToBytes } from './media';

/**
 * Object URL for a media payload, revoked automatically on change/unmount.
 * Much lighter than base64 data URLs for video playback.
 */
export function useMediaObjectUrl(media: MediaPayload | undefined): string | undefined {
  // Key on content identity, not object identity
  const key = media ? `${media.mimeType}:${media.base64.length}:${media.base64.slice(0, 32)}` : undefined;

  const blob = useMemo(() => {
    if (!media) return undefined;
    const bytes = base64ToBytes(media.base64);
    return new Blob([bytes.buffer as ArrayBuffer], { type: media.mimeType });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}
