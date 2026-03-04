import type { HandleDataType } from '../types/nodes';

export interface HandleDefinition {
  id: string;
  dataType: HandleDataType;
  label: string;
}

export interface NodeDefinition {
  type: string;
  label: string;
  category: 'input' | 'ai' | 'processing' | 'output' | 'text' | 'utility';
  icon: string;
  color: string;
  inputs: HandleDefinition[];
  outputs: HandleDefinition[];
  defaultData: Record<string, unknown>;
}

export const NODE_DEFINITIONS: Record<string, NodeDefinition> = {
  textPrompt: {
    type: 'textPrompt',
    label: 'Text Prompt',
    category: 'input',
    icon: 'Type',
    color: 'bg-blue-600',
    inputs: [],
    outputs: [{ id: 'text-out', dataType: 'text', label: 'Text' }],
    defaultData: { text: '' },
  },
  imageImport: {
    type: 'imageImport',
    label: 'Import Image',
    category: 'input',
    icon: 'Upload',
    color: 'bg-indigo-600',
    inputs: [],
    outputs: [{ id: 'image-out', dataType: 'image', label: 'Image' }],
    defaultData: { importedImage: undefined, fileName: '' },
  },
  imageGenerate: {
    type: 'imageGenerate',
    label: 'Generate Image',
    category: 'ai',
    icon: 'Sparkles',
    color: 'bg-purple-600',
    inputs: [
      { id: 'prompt-in', dataType: 'text', label: 'Prompt' },
      { id: 'image-in', dataType: 'image', label: 'Reference Image' },
    ],
    outputs: [{ id: 'image-out', dataType: 'image', label: 'Image' }],
    defaultData: {
      model: 'gemini-3.1-flash-image-preview',
      aspectRatio: '1:1',
      useGlobalModel: true,
      seed: 0,
      randomSeed: true,
    },
  },
  imageEdit: {
    type: 'imageEdit',
    label: 'Edit Image',
    category: 'ai',
    icon: 'Pencil',
    color: 'bg-amber-600',
    inputs: [
      { id: 'image-in', dataType: 'image', label: 'Source Image' },
      { id: 'prompt-in', dataType: 'text', label: 'Edit Prompt' },
    ],
    outputs: [{ id: 'image-out', dataType: 'image', label: 'Image' }],
    defaultData: {
      model: 'gemini-3.1-flash-image-preview',
      useGlobalModel: true,
      editInstruction: '',
    },
  },
  blur: {
    type: 'blur',
    label: 'Blur',
    category: 'processing',
    icon: 'Droplets',
    color: 'bg-sky-600',
    inputs: [{ id: 'image-in', dataType: 'image', label: 'Image' }],
    outputs: [{ id: 'image-out', dataType: 'image', label: 'Image' }],
    defaultData: { blurType: 'gaussian', radius: 5 },
  },
  resize: {
    type: 'resize',
    label: 'Resize',
    category: 'processing',
    icon: 'Maximize2',
    color: 'bg-sky-600',
    inputs: [{ id: 'image-in', dataType: 'image', label: 'Image' }],
    outputs: [{ id: 'image-out', dataType: 'image', label: 'Image' }],
    defaultData: { targetWidth: 1024, targetHeight: 1024, maintainAspectRatio: true },
  },
  crop: {
    type: 'crop',
    label: 'Crop',
    category: 'processing',
    icon: 'Crop',
    color: 'bg-sky-600',
    inputs: [{ id: 'image-in', dataType: 'image', label: 'Image' }],
    outputs: [{ id: 'image-out', dataType: 'image', label: 'Image' }],
    defaultData: { cropX: 0, cropY: 0, cropWidth: 512, cropHeight: 512 },
  },
  invert: {
    type: 'invert',
    label: 'Invert',
    category: 'processing',
    icon: 'SunMoon',
    color: 'bg-sky-600',
    inputs: [{ id: 'image-in', dataType: 'image', label: 'Image' }],
    outputs: [{ id: 'image-out', dataType: 'image', label: 'Image' }],
    defaultData: {},
  },
  compose: {
    type: 'compose',
    label: 'Compose Layers',
    category: 'processing',
    icon: 'Layers',
    color: 'bg-cyan-600',
    inputs: [
      { id: 'layer-1', dataType: 'image', label: 'Layer 1' },
      { id: 'layer-2', dataType: 'image', label: 'Layer 2' },
    ],
    outputs: [{ id: 'image-out', dataType: 'image', label: 'Image' }],
    defaultData: {
      width: 1024,
      height: 1024,
      backgroundColor: '#000000',
      layers: [],
    },
  },
  promptConcat: {
    type: 'promptConcat',
    label: 'Prompt Concatenator',
    category: 'text',
    icon: 'Link2',
    color: 'bg-blue-500',
    inputs: [
      { id: 'text-in-1', dataType: 'text', label: 'Text 1' },
      { id: 'text-in-2', dataType: 'text', label: 'Text 2' },
    ],
    outputs: [{ id: 'text-out', dataType: 'text', label: 'Text' }],
    defaultData: { separator: ', ' },
  },
  stickyNote: {
    type: 'stickyNote',
    label: 'Sticky Note',
    category: 'utility',
    icon: 'StickyNote',
    color: 'bg-yellow-600',
    inputs: [],
    outputs: [],
    defaultData: { noteText: '', noteColor: '#fef08a' },
  },
  imageDisplay: {
    type: 'imageDisplay',
    label: 'Display Image',
    category: 'output',
    icon: 'Image',
    color: 'bg-green-600',
    inputs: [{ id: 'image-in', dataType: 'image', label: 'Image' }],
    outputs: [],
    defaultData: { label: 'Output' },
  },
};

export const NODE_CATEGORIES = [
  { id: 'input', label: 'Input', types: ['textPrompt', 'imageImport'] },
  { id: 'ai', label: 'AI Models', types: ['imageGenerate', 'imageEdit'] },
  { id: 'processing', label: 'Processing', types: ['blur', 'resize', 'crop', 'invert', 'compose'] },
  { id: 'text', label: 'Text Tools', types: ['promptConcat'] },
  { id: 'output', label: 'Output', types: ['imageDisplay'] },
  { id: 'utility', label: 'Utility', types: ['stickyNote'] },
] as const;
