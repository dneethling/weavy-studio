import { create } from 'zustand';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const ALLOWED_EMAILS = ['darren@dcai.co.za'];

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initialize: () => () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  loading: true,
  error: null,
  initialized: false,

  initialize: () => {
    if (get().initialized) return () => {};

    set({ initialized: true });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if email is in the allowlist
        if (user.email && ALLOWED_EMAILS.includes(user.email)) {
          set({ user, loading: false, error: null });
        } else {
          // Not authorized — sign them out
          await firebaseSignOut(auth);
          set({
            user: null,
            loading: false,
            error: `Access denied. ${user.email} is not authorized to use BxAI Studio.`,
          });
        }
      } else {
        set({ user: null, loading: false });
      }
    });

    return unsubscribe;
  },

  signIn: async () => {
    set({ error: null });
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Don't show error for popup-closed-by-user
      if (!message.includes('popup-closed-by-user')) {
        set({ error: message });
      }
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
