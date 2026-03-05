import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDXtm3vhoDLpgi7j5ZWbaezkoWTfqqvvds',
  authDomain: 'bxai-studio.firebaseapp.com',
  projectId: 'bxai-studio',
  storageBucket: 'bxai-studio.firebasestorage.app',
  messagingSenderId: '121097678879',
  appId: '1:121097678879:web:f3d1237c2fc4996c7de52a',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
