import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: '***REDACTED_API_KEY***',
  authDomain: 'bxai-studio.firebaseapp.com',
  projectId: 'bxai-studio',
  storageBucket: '***REDACTED***',
  messagingSenderId: '***REDACTED***',
  appId: '1:***REDACTED***:web:***REDACTED***',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
