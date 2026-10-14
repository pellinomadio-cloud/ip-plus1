// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyChZ9dV_y7HBS62ctJF0zJcgWeX9Kl7E9s",
  authDomain: "iq-plus-734dd.firebaseapp.com",
  projectId: "iq-plus-734dd",
  storageBucket: "iq-plus-734dd.firebasestorage.app",
  messagingSenderId: "351920016419",
  appId: "1:351920016419:web:58b106e4dc32d747b53596",
  measurementId: "G-TLVLE8X73L"
};

// Initialize Firebase app safely (prevent multiple initialization in dev)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Firebase Analytics safely if supported in the browser
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn('Analytics initialization failed:', err);
      }
    }
  }).catch(() => {
    // Analytics not supported in this environment
  });
}
