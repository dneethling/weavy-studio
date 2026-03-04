import { getGeminiClient } from './client';
import { getImageDimensions } from '../imageProcessing/imageConversion';
import type { ImagePayload } from '../../types/nodes';

interface EditImageOptions {
  sourceImage: ImagePayload;
  instruction: string;
  model: string;
}

export async function editImage(options: EditImageOptions): Promise<ImagePayload> {
  const ai = getGeminiClient();

  console.log('[Weavy] Editing image with model:', options.model, '| instruction:', options.instruction.slice(0, 80));

  const response = await ai.models.generateContent({
    model: options.model,
    contents: [
      {
        inlineData: {
          mimeType: options.sourceImage.mimeType,
          data: options.sourceImage.base64,
        },
      },
      { text: options.instruction },
    ],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  console.log('[Weavy] Edit response - candidates:', response.candidates?.length ?? 'undefined');
  console.log('[Weavy] Prompt feedback:', JSON.stringify(response.promptFeedback ?? null));

  if (response.promptFeedback?.blockReason) {
    throw new Error(
      `Edit prompt was blocked by safety filters: ${response.promptFeedback.blockReason}. Try rephrasing.`
    );
  }

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error(
      'Gemini returned no candidates for image edit. The prompt may have been filtered.'
    );
  }

  const candidate = response.candidates[0];

  if (candidate.finishReason === 'SAFETY') {
    throw new Error(
      'Image editing was blocked by safety filters. Try a different instruction.'
    );
  }

  const parts = candidate.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error(
      `No content in edit response. Finish reason: ${candidate.finishReason || 'unknown'}.`
    );
  }

  for (const part of parts) {
    if (part.inlineData) {
      const base64 = part.inlineData.data as string;
      const mimeType = (part.inlineData.mimeType || 'image/png') as ImagePayload['mimeType'];

      const dimensions = await getImageDimensions(base64, mimeType);

      console.log('[Weavy] Edited image:', dimensions.width, 'x', dimensions.height);

      return {
        base64,
        mimeType,
        width: dimensions.width,
        height: dimensions.height,
      };
    }
  }

  const textContent = parts.map((p) => p.text).filter(Boolean).join(' ');
  throw new Error(
    `Image editing produced no image. Model said: "${textContent.slice(0, 200) || '(empty)'}"`
  );
}
