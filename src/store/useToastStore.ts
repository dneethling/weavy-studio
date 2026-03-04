import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = `toast-${++toastCounter}`;
    set({ toasts: [...get().toasts, { id, type, message }] });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 5000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
