import { create } from 'zustand';
import type { ImagePayload } from '../types/nodes';
import { nanoid } from 'nanoid';

export interface GalleryImage {
  id: string;
  image: ImagePayload;
  sourceNodeId: string;
  sourceNodeLabel: string;
  timestamp: number;
}

interface GalleryState {
  images: GalleryImage[];
  addImage: (image: ImagePayload, sourceNodeId: string, sourceNodeLabel: string) => void;
  removeImage: (id: string) => void;
  clearGallery: () => void;
}

export const useGalleryStore = create<GalleryState>()((set, get) => ({
  images: [],

  addImage: (image, sourceNodeId, sourceNodeLabel) => {
    const entry: GalleryImage = {
      id: nanoid(8),
      image,
      sourceNodeId,
      sourceNodeLabel,
      timestamp: Date.now(),
    };
    set({ images: [entry, ...get().images] });
  },

  removeImage: (id) => {
    set({ images: get().images.filter((img) => img.id !== id) });
  },

  clearGallery: () => {
    set({ images: [] });
  },
}));
