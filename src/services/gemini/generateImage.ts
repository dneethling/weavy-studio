import { getGeminiClient } from './client';
import { getImageDimensions } from '../imageProcessing/imageConversion';
import { throttledAICall } from '../execution/taskQueue';
import type { ImagePayload } from '../../types/nodes';

interface GenerateImageOptions {
  prompt: string;
  model: string;
  aspectRatio?: string;
  seed?: number;
  referenceImage?: ImagePayload;
}

/**
 * Routes to the correct API based on model name:
 * - Imagen models → ai.models.generateImages()
 * - Gemini models → ai.models.generateContent() with responseModalities
 */
export async function generateImage(options: GenerateImageOptions): Promise<ImagePayload> {
  if (options.model.startsWith('imagen')) {
    const [image] = await generateWithImagen(options, 1);
    return image;
  }
  return throttledAICall(() => generateWithGemini(options));
}

/** Imagen supports up to 4 images per request — batch natively when we can. */
const IMAGEN_MAX_PER_CALL = 4;

/**
 * Generates `count` variations of a prompt as efficiently as the model allows:
 * - Imagen: chunks of up to 4 images per API call.
 * - Gemini: `count` parallel calls with deterministic per-variation seeds,
 *   throttled by the global AI queue.
 *
 * Tolerates partial failures — returns every variation that succeeded and
 * only throws if ALL of them failed.
 */
export async function generateImageBatch(
  options: GenerateImageOptions,
  count: number
): Promise<ImagePayload[]> {
  const total = Math.max(1, count);

  if (options.model.startsWith('imagen')) {
    const chunks: number[] = [];
    for (let remaining = total; remaining > 0; remaining -= IMAGEN_MAX_PER_CALL) {
      chunks.push(Math.min(remaining, IMAGEN_MAX_PER_CALL));
    }
    const results = await Promise.allSettled(
      chunks.map((n, i) =>
        generateWithImagen(
          // Vary the seed per chunk so chunks don't repeat each other
          { ...options, seed: options.seed !== undefined ? options.seed + i : undefined },
          n
        )
      )
    );
    return collectBatch(results.map((r) => (r.status === 'fulfilled' ? r.value : r)), total);
  }

  const results = await Promise.allSettled(
    Array.from({ length: total }, (_, i) =>
      throttledAICall(() =>
        generateWithGemini({
          ...options,
          // Deterministic per-variation seed so a fixed seed reproduces the batch
          seed: options.seed !== undefined ? options.seed + i : undefined,
        })
      )
    )
  );
  return collectBatch(results.map((r) => (r.status === 'fulfilled' ? [r.value] : r)), total);
}

function collectBatch(
  results: Array<ImagePayload[] | PromiseRejectedResult>,
  total: number
): ImagePayload[] {
  const images: ImagePayload[] = [];
  let firstError: unknown = null;

  for (const result of results) {
    if (Array.isArray(result)) {
      images.push(...result);
    } else if (!firstError) {
      firstError = result.reason;
    }
  }

  if (images.length === 0) {
    throw firstError instanceof Error ? firstError : new Error(String(firstError ?? 'Generation failed'));
  }
  if (images.length < total) {
    console.warn(`[BxAI] Batch partially succeeded: ${images.length}/${total} images.`);
  }
  return images;
}

async function generateWithImagen(
  options: GenerateImageOptions,
  numberOfImages: number
): Promise<ImagePayload[]> {
  const ai = getGeminiClient();

  if (options.referenceImage) {
    console.warn('[BxAI] Imagen models do not support reference images. The reference will be ignored. Use a Gemini model for reference-based generation.');
  }
  console.log('[BxAI] Generating with Imagen model:', options.model, '| count:', numberOfImages, '| seed:', options.seed ?? 'none', '| aspectRatio:', options.aspectRatio ?? '(default)');

  const response = await throttledAICall(() =>
    ai.models.generateImages({
      model: options.model,
      prompt: options.prompt,
      config: {
        numberOfImages,
        ...(options.aspectRatio && { aspectRatio: options.aspectRatio }),
        ...(options.seed !== undefined && { seed: options.seed }),
      },
    })
  );

  console.log('[BxAI] Imagen response received, images:', response.generatedImages?.length ?? 0);

  const generated = response.generatedImages;
  if (!generated || generated.length === 0) {
    throw new Error('Imagen returned no images. Try a different prompt.');
  }

  const images: ImagePayload[] = [];
  for (const item of generated) {
    if (!item.image?.imageBytes) continue;
    const base64 = item.image.imageBytes;
    const mimeType = 'image/png' as ImagePayload['mimeType'];
    const dimensions = await getImageDimensions(base64, mimeType);
    images.push({ base64, mimeType, width: dimensions.width, height: dimensions.height });
  }

  if (images.length === 0) {
    throw new Error('Imagen returned only empty images.');
  }

  console.log('[BxAI] Imagen generated', images.length, 'image(s):', images[0].width, 'x', images[0].height);
  return images;
}

async function generateWithGemini(options: GenerateImageOptions): Promise<ImagePayload> {
  const ai = getGeminiClient();

  const hasRef = !!options.referenceImage;
  console.log('[BxAI] Generating with Gemini model:', options.model, '| seed:', options.seed ?? 'none', '| aspectRatio:', options.aspectRatio ?? '(default)', '| hasRef:', hasRef, '| prompt:', options.prompt.slice(0, 80));

  // Build contents: if a reference image is provided, send it alongside the prompt
  const contents = hasRef
    ? [
        {
          inlineData: {
            mimeType: options.referenceImage!.mimeType,
            data: options.referenceImage!.base64,
          },
        },
        options.prompt,
      ]
    : options.prompt;

  const response = await ai.models.generateContent({
    model: options.model,
    contents,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      ...(options.seed !== undefined && { seed: options.seed }),
      ...(options.aspectRatio && {
        imageConfig: { aspectRatio: options.aspectRatio },
      }),
    },
  });

  // Debug logging
  console.log('[BxAI] Candidates:', response.candidates?.length ?? 0);
  console.log('[BxAI] Prompt feedback:', JSON.stringify(response.promptFeedback ?? null));

  // Check for safety blocks
  if (response.promptFeedback?.blockReason) {
    throw new Error(
      `Prompt blocked by safety filters: ${response.promptFeedback.blockReason}. Try rephrasing.`
    );
  }

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates returned. The prompt may have been filtered.');
  }

  const candidate = response.candidates[0];
  console.log('[BxAI] Finish reason:', candidate.finishReason, '| Parts:', candidate.content?.parts?.length ?? 0);

  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Blocked by safety filters. Try a different prompt.');
  }

  if (candidate.finishReason === 'OTHER' && (!candidate.content?.parts || candidate.content.parts.length === 0)) {
    throw new Error(
      `Model "${options.model}" returned no content (finish: OTHER). This model may not support image generation. Try switching to a different model in the node properties.`
    );
  }

  const parts = candidate.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error(`No content. Finish reason: ${candidate.finishReason || 'unknown'}.`);
  }

  for (const part of parts) {
    if (part.inlineData) {
      const base64 = part.inlineData.data as string;
      const mimeType = (part.inlineData.mimeType || 'image/png') as ImagePayload['mimeType'];
      const dimensions = await getImageDimensions(base64, mimeType);

      console.log('[BxAI] Image generated:', dimensions.width, 'x', dimensions.height);

      return { base64, mimeType, width: dimensions.width, height: dimensions.height };
    }
  }

  const textContent = parts.map((p) => p.text).filter(Boolean).join(' ');
  throw new Error(`No image in response. Model said: "${textContent.slice(0, 200) || '(empty)'}"`);
}
