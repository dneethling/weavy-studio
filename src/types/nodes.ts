import type { Node } from '@xyflow/react';

export type HandleDataType = 'text' | 'image';

export interface ImagePayload {
  base64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
}

// --- Per-node data shapes ---

export interface TextPromptData {
  text: string;
  [key: string]: unknown;
}

export interface ImageGenerateData {
  model: string;
  aspectRatio: string;
  useGlobalModel?: boolean;
  seed?: number;
  randomSeed?: boolean;
  outputImage?: ImagePayload;
  [key: string]: unknown;
}

export interface ImageEditData {
  model: string;
  editInstruction: string;
  useGlobalModel?: boolean;
  outputImage?: ImagePayload;
  [key: string]: unknown;
}

export interface ImageDisplayData {
  label: string;
  displayImage?: ImagePayload;
  [key: string]: unknown;
}

export interface ComposeData {
  width: number;
  height: number;
  backgroundColor: string;
  layers: Array<{
    sourceHandle: string;
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
    blendMode: GlobalCompositeOperation;
  }>;
  outputImage?: ImagePayload;
  [key: string]: unknown;
}

export interface ImageImportData {
  importedImage?: ImagePayload;
  fileName?: string;
  [key: string]: unknown;
}

export interface BlurData {
  blurType: 'gaussian' | 'box';
  radius: number;
  outputImage?: ImagePayload;
  [key: string]: unknown;
}

export interface ResizeData {
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;
  outputImage?: ImagePayload;
  [key: string]: unknown;
}

export interface CropData {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  outputImage?: ImagePayload;
  [key: string]: unknown;
}

export interface InvertData {
  outputImage?: ImagePayload;
  [key: string]: unknown;
}

export interface PromptConcatData {
  separator: string;
  [key: string]: unknown;
}

export interface StickyNoteData {
  noteText: string;
  noteColor: string;
  [key: string]: unknown;
}

export interface NumberData {
  value: number;
  min: number;
  max: number;
  step: number;
}

export interface SeedData {
  seed: number;
  randomize: boolean;
}

// --- Typed node aliases ---

export type TextPromptNode = Node<TextPromptData, 'textPrompt'>;
export type ImageGenerateNode = Node<ImageGenerateData, 'imageGenerate'>;
export type ImageEditNode = Node<ImageEditData, 'imageEdit'>;
export type ImageDisplayNode = Node<ImageDisplayData, 'imageDisplay'>;
export type ComposeNode = Node<ComposeData, 'compose'>;
export type ImageImportNode = Node<ImageImportData, 'imageImport'>;
export type BlurNode = Node<BlurData, 'blur'>;
export type ResizeNode = Node<ResizeData, 'resize'>;
export type CropNode = Node<CropData, 'crop'>;
export type InvertNode = Node<InvertData, 'invert'>;
export type PromptConcatNode = Node<PromptConcatData, 'promptConcat'>;
export type StickyNoteNode = Node<StickyNoteData, 'stickyNote'>;

export type WorkflowNode =
  | TextPromptNode
  | ImageGenerateNode
  | ImageEditNode
  | ImageDisplayNode
  | ComposeNode
  | ImageImportNode
  | BlurNode
  | ResizeNode
  | CropNode
  | InvertNode
  | PromptConcatNode
  | StickyNoteNode;
