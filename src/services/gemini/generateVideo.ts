import { getGeminiClient, getApiKey } from './client';
import { throttledAICall, throwIfCancelled, CancelledError } from '../execution/taskQueue';
import type { ImagePayload, VideoPayload } from '../../types/nodes';

interface GenerateVideoOptions {
  prompt: string;
  model: string;
  aspectRatio?: string;
  resolution?: string;
  negativePrompt?: string;
  /** Optional first frame — turns the request into image-to-video. */
  referenceImage?: ImagePayload;
}

const POLL_INTERVAL_MS = 8000;
const MAX_POLL_MS = 10 * 60 * 1000; // 10 minutes

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a video with a Veo model.
 *
 * Veo is a long-running operation: the initial request goes through the
 * throttled AI queue (so batch runs respect the concurrency limit), but
 * polling happens outside the queue — a slot is not held for the minutes
 * the render takes, letting other batch items proceed.
 */
export async function generateVideo(options: GenerateVideoOptions): Promise<VideoPayload> {
  const ai = getGeminiClient();

  console.log(
    '[BxAI] Generating video with model:', options.model,
    '| aspectRatio:', options.aspectRatio ?? '16:9',
    '| resolution:', options.resolution ?? '720p',
    '| hasFirstFrame:', !!options.referenceImage,
    '| prompt:', options.prompt.slice(0, 80)
  );

  // Kick off the long-running operation (throttled + retried)
  let operation = await throttledAICall(() =>
    ai.models.generateVideos({
      model: options.model,
      prompt: options.prompt,
      ...(options.referenceImage && {
        image: {
          imageBytes: options.referenceImage.base64,
          mimeType: options.referenceImage.mimeType,
        },
      }),
      config: {
        numberOfVideos: 1,
        ...(options.aspectRatio && { aspectRatio: options.aspectRatio }),
        ...(options.resolution && { resolution: options.resolution }),
        ...(options.negativePrompt && { negativePrompt: options.negativePrompt }),
      },
    })
  );

  // Poll until done (outside the queue — cheap GETs)
  const startedAt = Date.now();
  while (!operation.done) {
    throwIfCancelled();
    if (Date.now() - startedAt > MAX_POLL_MS) {
      throw new Error('Video generation timed out after 10 minutes.');
    }
    await sleep(POLL_INTERVAL_MS);
    throwIfCancelled();
    operation = await ai.operations.getVideosOperation({ operation });
    console.log('[BxAI] Veo operation status: done =', operation.done ?? false);
  }

  if (operation.error) {
    throw new Error(`Video generation failed: ${operation.error.message ?? 'unknown error'}`);
  }

  const generated = operation.response?.generatedVideos;
  if (!generated || generated.length === 0) {
    // Veo surfaces safety filtering as an empty result
    const filtered = operation.response?.raiMediaFilteredReasons?.join('; ');
    throw new Error(
      filtered
        ? `Video was filtered: ${filtered}`
        : 'Veo returned no videos. Try a different prompt.'
    );
  }

  const video = generated[0].video;
  if (!video) {
    throw new Error('Veo returned an empty video result.');
  }

  // Prefer inline bytes if present, otherwise download from the file URI
  let base64: string;
  if (video.videoBytes) {
    base64 = video.videoBytes;
  } else if (video.uri) {
    base64 = await downloadVideoAsBase64(video.uri);
  } else {
    throw new Error('Veo returned a video with no data or download URI.');
  }

  const mimeType = (video.mimeType || 'video/mp4') as VideoPayload['mimeType'];
  console.log('[BxAI] Video generated,', Math.round((base64.length * 3) / 4 / 1024), 'KB');

  return { base64, mimeType };
}

async function downloadVideoAsBase64(uri: string): Promise<string> {
  throwIfCancelled();
  const apiKey = getApiKey();

  const response = await fetch(uri, {
    headers: { 'x-goog-api-key': apiKey },
  });
  if (!response.ok) {
    throw new Error(`Failed to download generated video (HTTP ${response.status}).`);
  }

  const blob = await response.blob();
  return blobToBase64(blob);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('Failed to encode downloaded video.'));
    reader.readAsDataURL(blob);
  });
}

export { CancelledError };
