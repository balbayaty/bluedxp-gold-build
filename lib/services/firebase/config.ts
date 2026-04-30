/**
 * Firebase Configuration
 *
 * Source: chemcheck-ai/lib/firebase.ts
 * Adapted for Hazalyze Platform
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, DocumentData } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  User,
  NextOrObserver,
  onAuthStateChanged,
} from "firebase/auth";

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase with error handling
let app;
let db;
let storage;
let auth;

// Mock implementations for development
const createMockFirestore = () => ({
  collection: () => ({
    addDoc: async (data: DocumentData) => {
      console.log("Mock Firestore add document:", data);
      return { id: `mock-doc-${Date.now()}`, ...data };
    },
    doc: (id: string) => ({
      get: async () => ({
        exists: true,
        data: () => ({ id, name: "Mock Document", createdAt: new Date() }),
        id,
      }),
      set: async (data: DocumentData) => {
        console.log(`Mock Firestore set document ${id}:`, data);
        return true;
      },
      update: async (data: DocumentData) => {
        console.log(`Mock Firestore update document ${id}:`, data);
        return true;
      },
      delete: async () => {
        console.log(`Mock Firestore delete document ${id}`);
        return true;
      },
    }),
  }),
});

const createMockStorage = () => ({
  ref: (path: string) => ({
    put: async (file: File | Blob) => {
      console.log(`Mock Storage put file to ${path}:`, file);
      return {
        ref: {
          getDownloadURL: async () => `https://mock-storage-url.com/${path}`,
        },
      };
    },
    child: (childPath: string) => ({
      put: async (file: File | Blob) => {
        return {
          ref: {
            getDownloadURL: async () =>
              `https://mock-storage-url.com/${path}/${childPath}`,
          },
        };
      },
    }),
    delete: async () => true,
    getDownloadURL: async () => `https://mock-storage-url.com/${path}`,
  }),
});

// Create mock auth implementation
const createMockAuth = () => ({
  signInWithEmailAndPassword: async () => ({
    user: { uid: "test-user-id", email: "test@example.com" },
  }),
  createUserWithEmailAndPassword: async () => ({
    user: { uid: "test-user-id", email: "test@example.com" },
  }),
  signOut: async () => true,
  onAuthStateChanged: (callback: NextOrObserver<User | null>) => {
    if (typeof callback === "function") callback(null);
    else if (callback.next) callback.next(null);
    return () => {};
  },
  currentUser: null,
});

// Check if Firebase config is valid (has API key)
const hasValidConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined' && firebaseConfig.apiKey !== '';

// Handle initialization
if (hasValidConfig) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    try {
      db = getFirestore(app);
    } catch (dbError) {
      console.warn("Firebase Firestore initialization warning:", dbError);
      db = createMockFirestore();
    }

    try {
      storage = getStorage(app);
    } catch (storageError) {
      console.warn("Firebase Storage initialization warning:", storageError);
      storage = createMockStorage();
    }

    try {
      auth = getAuth(app);
    } catch (authError) {
      console.warn("Firebase auth initialization warning:", authError);
      auth = createMockAuth();
    }
  } catch (error) {
    console.warn("Firebase initialization warning (using mocks):", error);
    db = createMockFirestore();
    storage = createMockStorage();
    auth = createMockAuth();
  }
} else {
  // No valid Firebase config - use mocks silently
  console.log("[Firebase] No valid config found, using mock implementations");
  db = createMockFirestore();
  storage = createMockStorage();
  auth = createMockAuth();
}

export { app, db, storage, auth };
