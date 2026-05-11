const defaultConfig = {
  apiKey: "AIzaSyC6jKCyPpOem_BqYsfYSNdMphKwI5XfF4s",
  authDomain: "novatone-cd3ea.firebaseapp.com",
  projectId: "novatone-cd3ea",
  storageBucket: "novatone-cd3ea.firebasestorage.app",
  messagingSenderId: "18692178854",
  appId: "1:18692178854:web:ec63db54d3f9a6a7790567",
  measurementId: "G-7XGWSDCYDB",
};

export const firebaseConfig = window.__NOVATONE_FIREBASE_CONFIG__ || defaultConfig;

export function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig &&
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}
