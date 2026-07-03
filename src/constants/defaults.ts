export const GEMINI_MODELS = [
  { id: 'gemini-3.1-flash-image-preview', label: 'Nano Banana 2 (3.1 Flash)' },
  { id: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro (3 Pro)' },
  { id: 'gemini-2.5-flash-image', label: 'Nano Banana (2.5 Flash)' },
  { id: 'imagen-3.0-generate-002', label: 'Imagen 3' },
  { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3 Fast' },
] as const;

export const DEFAULT_MODEL = GEMINI_MODELS[0].id;

export const VEO_MODELS = [
  { id: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast' },
  { id: 'veo-3.1-generate-preview', label: 'Veo 3.1' },
  { id: 'veo-3.0-fast-generate-001', label: 'Veo 3 Fast' },
  { id: 'veo-3.0-generate-001', label: 'Veo 3' },
  { id: 'veo-2.0-generate-001', label: 'Veo 2' },
] as const;

export const DEFAULT_VIDEO_MODEL = VEO_MODELS[0].id;

export const VIDEO_ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 Landscape' },
  { id: '9:16', label: '9:16 Portrait' },
] as const;

export const VIDEO_RESOLUTIONS = [
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p (16:9 only)' },
] as const;

/** Max variations a single Generate node can fan out per input. */
export const MAX_BATCH_COUNT = 8;

/** Concurrency options for parallel AI requests. */
export const CONCURRENCY_OPTIONS = [1, 2, 4, 6, 8, 12, 16] as const;
export const DEFAULT_CONCURRENCY = 4;

/** Safety valve: max items a single batch can expand to in one run. */
export const MAX_BATCH_ITEMS = 64;

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
