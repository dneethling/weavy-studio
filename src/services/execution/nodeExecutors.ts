import type { Node } from '@xyflow/react';
import { generateImage } from '../gemini/generateImage';
import { editImage } from '../gemini/editImage';
import { compositeImages } from '../imageProcessing/compositing';
import { blurImage, resizeImage, cropImage, invertImage } from '../imageProcessing/filters';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { ImagePayload, ComposeData } from '../../types/nodes';

type NodeExecutor = (
  node: Node,
  inputs: Record<string, unknown>
) => Promise<unknown>;

/**
 * Resolves which model to use for an AI node.
 * If useGlobalModel is true (default), uses the global model from settings.
 * Otherwise uses the per-node model override.
 */
function resolveModel(data: Record<string, unknown>): string {
  const useGlobal = data.useGlobalModel !== false;
  if (useGlobal) {
    return useSettingsStore.getState().globalModel;
  }
  return data.model as string;
}

export const nodeExecutors: Record<string, NodeExecutor> = {
  textPrompt: async (node) => {
    return (node.data as { text: string }).text;
  },

  imageImport: async (node) => {
    const data = node.data as Record<string, unknown>;
    const imported = data.importedImage as ImagePayload | undefined;
    if (!imported) throw new Error('No image imported. Click the node and upload an image file.');
    return imported;
  },

  imageGenerate: async (node, inputs) => {
    const prompt = inputs['prompt-in'] as string;
    if (!prompt) throw new Error('No prompt connected to Generate Image node.');

    const data = node.data as Record<string, unknown>;
    const model = resolveModel(data);

    // Resolve seed: random mode generates a new seed each run, fixed uses the stored value
    const isRandomSeed = data.randomSeed !== false; // default true
    const seed = isRandomSeed
      ? Math.floor(Math.random() * 2147483647)
      : (data.seed as number) || 0;

    // Optional reference image (e.g. from Import Image node)
    const referenceImage = inputs['image-in'] as ImagePayload | undefined;

    console.log('[Weavy] imageGenerate using model:', model, '| useGlobal:', data.useGlobalModel !== false, '| seed:', seed, '(random:', isRandomSeed, ')', '| hasRef:', !!referenceImage);

    return generateImage({
      prompt,
      model,
      aspectRatio: (data.aspectRatio as string) || '1:1',
      seed,
      referenceImage,
    });
  },

  imageEdit: async (node, inputs) => {
    const sourceImage = inputs['image-in'] as ImagePayload;
    if (!sourceImage) throw new Error('No source image connected to Edit Image node.');

    const data = node.data as Record<string, unknown>;
    const model = resolveModel(data);
    const instruction =
      (inputs['prompt-in'] as string) || (data.editInstruction as string);
    if (!instruction) throw new Error('No edit instruction provided.');

    console.log('[Weavy] imageEdit using model:', model, '| useGlobal:', data.useGlobalModel !== false);

    return editImage({
      sourceImage,
      instruction,
      model,
    });
  },

  imageDisplay: async (_node, inputs) => {
    return inputs['image-in'] as ImagePayload;
  },

  blur: async (node, inputs) => {
    const sourceImage = inputs['image-in'] as ImagePayload;
    if (!sourceImage) throw new Error('No image connected to Blur node.');

    const data = node.data as Record<string, unknown>;
    const radius = (data.radius as number) || 5;

    console.log('[Weavy] Applying blur, radius:', radius);
    return blurImage(sourceImage, radius);
  },

  resize: async (node, inputs) => {
    const sourceImage = inputs['image-in'] as ImagePayload;
    if (!sourceImage) throw new Error('No image connected to Resize node.');

    const data = node.data as Record<string, unknown>;
    const targetWidth = (data.targetWidth as number) || 1024;
    const targetHeight = (data.targetHeight as number) || 1024;
    const maintainAspectRatio = data.maintainAspectRatio !== false;

    console.log('[Weavy] Resizing to:', targetWidth, 'x', targetHeight, '| keepRatio:', maintainAspectRatio);
    return resizeImage(sourceImage, targetWidth, targetHeight, maintainAspectRatio);
  },

  crop: async (node, inputs) => {
    const sourceImage = inputs['image-in'] as ImagePayload;
    if (!sourceImage) throw new Error('No image connected to Crop node.');

    const data = node.data as Record<string, unknown>;
    const x = (data.cropX as number) || 0;
    const y = (data.cropY as number) || 0;
    const w = (data.cropWidth as number) || 512;
    const h = (data.cropHeight as number) || 512;

    console.log('[Weavy] Cropping:', x, y, w, h);
    return cropImage(sourceImage, x, y, w, h);
  },

  invert: async (_node, inputs) => {
    const sourceImage = inputs['image-in'] as ImagePayload;
    if (!sourceImage) throw new Error('No image connected to Invert node.');

    console.log('[Weavy] Inverting colors');
    return invertImage(sourceImage);
  },

  promptConcat: async (node, inputs) => {
    const text1 = (inputs['text-in-1'] as string) || '';
    const text2 = (inputs['text-in-2'] as string) || '';
    const data = node.data as Record<string, unknown>;
    const separator = (data.separator as string) ?? ', ';

    const parts = [text1, text2].filter(Boolean);
    return parts.join(separator);
  },

  stickyNote: async () => {
    // Sticky notes don't produce output — they're just annotations
    return undefined;
  },

  compose: async (node, inputs) => {
    const data = node.data as unknown as ComposeData;

    const layers: Array<{ image: ImagePayload; config: ComposeData['layers'][0] }> = [];

    // Auto-map connected inputs to layers
    const connectedInputs = Object.entries(inputs).filter(
      ([key]) => key.startsWith('layer-')
    );

    for (let i = 0; i < connectedInputs.length; i++) {
      const [handleId, image] = connectedInputs[i];
      if (image) {
        const config = data.layers[i] || {
          sourceHandle: handleId,
          x: 0,
          y: 0,
          width: data.width,
          height: data.height,
          opacity: 1,
          blendMode: 'source-over' as GlobalCompositeOperation,
        };
        layers.push({ image: image as ImagePayload, config });
      }
    }

    return compositeImages({
      width: data.width,
      height: data.height,
      backgroundColor: data.backgroundColor,
      layers,
    });
  },
};
