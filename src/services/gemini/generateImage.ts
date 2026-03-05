import { getGeminiClient } from './client';
import { getImageDimensions } from '../imageProcessing/imageConversion';
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
    return generateWithImagen(options);
  }
  return generateWithGemini(options);
}

async function generateWithImagen(options: GenerateImageOptions): Promise<ImagePayload> {
  const ai = getGeminiClient();

  if (options.referenceImage) {
    console.warn('[BxAI] Imagen models do not support reference images. The reference will be ignored. Use a Gemini model for reference-based generation.');
  }
  console.log('[BxAI] Generating with Imagen model:', options.model, '| seed:', options.seed ?? 'none', '| aspectRatio:', options.aspectRatio ?? '(default)');

  const response = await ai.models.generateImages({
    model: options.model,
    prompt: options.prompt,
    config: {
      numberOfImages: 1,
      ...(options.aspectRatio && { aspectRatio: options.aspectRatio }),
      ...(options.seed !== undefined && { seed: options.seed }),
    },
  });

  console.log('[BxAI] Imagen response received, images:', response.generatedImages?.length ?? 0);

  const generated = response.generatedImages;
  if (!generated || generated.length === 0) {
    throw new Error('Imagen returned no images. Try a different prompt.');
  }

  const imageData = generated[0].image;
  if (!imageData?.imageBytes) {
    throw new Error('Imagen returned an empty image.');
  }

  const base64 = imageData.imageBytes;
  const mimeType = 'image/png' as ImagePayload['mimeType'];
  const dimensions = await getImageDimensions(base64, mimeType);

  console.log('[BxAI] Imagen image generated:', dimensions.width, 'x', dimensions.height);

  return {
    base64,
    mimeType,
    width: dimensions.width,
    height: dimensions.height,
  };
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
