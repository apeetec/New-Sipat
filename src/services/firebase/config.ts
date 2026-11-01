import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseClientState {
  isConfigured: boolean;
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

let firebaseState: FirebaseClientState = {
  isConfigured: false,
  app: null,
  auth: null,
  db: null,
};

export function initFirebase(): FirebaseClientState {
  if (firebaseState.isConfigured) {
    return firebaseState;
  }

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && projectId) {
    try {
      const config = {
        apiKey,
        authDomain: `${projectId}.firebaseapp.com`,
        projectId,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      };

      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      const auth = getAuth(app);
      const db = getFirestore(app);

      firebaseState = {
        isConfigured: true,
        app,
        auth,
        db,
      };
      console.info('[Firebase] Connected to real Firebase project:', projectId);
    } catch (err) {
      console.warn('[Firebase] Failed to initialize Firebase SDK, falling back to local adapter:', err);
    }
  }

  return firebaseState;
}

export function getFirebase(): FirebaseClientState {
  return firebaseState;
}
