// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.error('🔥 Firebase Configuration Error: Missing environment variables:', missingVars);
  console.error('📝 Please check your .env file or deployment platform environment variables.');
  console.error('💡 See .env.example for required variables.');
  
  // Create a fallback configuration to prevent app crash
  
  // Show user-friendly error in UI
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (root && missingVars.length > 0) {
      root.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #d32f2f; font-family: Arial, sans-serif;">
          <h2>Configuration Error</h2>
          <p>Missing Firebase configuration. Please contact the administrator.</p>
          <details style="margin-top: 1rem;">
            <summary>Technical Details</summary>
            <p>Missing environment variables: ${missingVars.join(', ')}</p>
          </details>
        </div>
      `;
    }
  });
  
  console.warn('Using fallback Firebase config to prevent app crash');
}

// Initialize Firebase
const app = initializeApp(missingVars.length > 0 ? {
  apiKey: "dummy",
  authDomain: "dummy.firebaseapp.com", 
  projectId: "dummy",
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:dummy"
} : firebaseConfig);

// Export auth synchronously for compatibility with react-firebase-hooks
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account', access_type: 'offline' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Compatibility getter (returns the already-initialized auth)
export const getAuthInstance = async () => ({ auth, googleProvider });

export const getFirestoreInstance = async () => {
  const mod = await import('firebase/firestore');
  return { firestore: mod.getFirestore(app), ...mod };
};

export const getStorageInstance = async () => {
  const mod = await import('firebase/storage');
  return { storage: mod.getStorage(app), ...mod };
};

// Lazy-load Analytics (optional)
export const getAnalyticsInstance = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const { getAnalytics } = await import('firebase/analytics');
    return getAnalytics(app);
  } catch {
    return null;
  }
};

export default app;
