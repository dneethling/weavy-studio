import { create } from 'zustand';
import type { MediaPayload } from '../types/nodes';
import { nanoid } from 'nanoid';

export interface GalleryItem {
  id: string;
  media: MediaPayload;
  sourceNodeId: string;
  sourceNodeLabel: string;
  timestamp: number;
}

interface GalleryState {
  items: GalleryItem[];
  addMedia: (media: MediaPayload, sourceNodeId: string, sourceNodeLabel: string) => void;
  removeItem: (id: string) => void;
  clearGallery: () => void;
}

export const useGalleryStore = create<GalleryState>()((set, get) => ({
  items: [],

  addMedia: (media, sourceNodeId, sourceNodeLabel) => {
    const entry: GalleryItem = {
      id: nanoid(8),
      media,
      sourceNodeId,
      sourceNodeLabel,
      timestamp: Date.now(),
    };
    set({ items: [entry, ...get().items] });
  },

  removeItem: (id) => {
    set({ items: get().items.filter((item) => item.id !== id) });
  },

  clearGallery: () => {
    set({ items: [] });
  },
}));
