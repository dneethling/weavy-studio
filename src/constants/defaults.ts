export const GEMINI_MODELS = [
  { id: 'gemini-3.1-flash-image-preview', label: 'Nano Banana 2 (3.1 Flash)' },
  { id: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro (3 Pro)' },
  { id: 'gemini-2.5-flash-image', label: 'Nano Banana (2.5 Flash)' },
  { id: 'imagen-3.0-generate-002', label: 'Imagen 3' },
  { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3 Fast' },
] as const;

export const DEFAULT_MODEL = GEMINI_MODELS[0].id;

export const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square' },
  { id: '16:9', label: '16:9 Landscape' },
  { id: '9:16', label: '9:16 Portrait' },
  { id: '4:3', label: '4:3 Standard' },
  { id: '3:4', label: '3:4 Portrait' },
  { id: '3:2', label: '3:2 Photo' },
  { id: '2:3', label: '2:3 Photo Portrait' },
] as const;

export const BLEND_MODES: GlobalCompositeOperation[] = [
  'source-over',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
];

export const BLUR_TYPES = [
  { id: 'gaussian', label: 'Gaussian Blur' },
  { id: 'box', label: 'Box Blur' },
] as const;

export const RESIZE_PRESETS = [
  { id: 'custom', label: 'Custom' },
  { id: '512x512', label: '512 x 512' },
  { id: '768x768', label: '768 x 768' },
  { id: '1024x1024', label: '1024 x 1024' },
  { id: '1536x1536', label: '1536 x 1536' },
  { id: '2048x2048', label: '2048 x 2048' },
  { id: '1920x1080', label: '1920 x 1080 (HD)' },
  { id: '3840x2160', label: '3840 x 2160 (4K)' },
] as const;
