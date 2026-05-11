import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  getAnalytics,
  isSupported as analyticsSupported,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { firebaseConfig, hasFirebaseConfig } from "./firebase-config.js";

let appInstance = null;
let dbInstance = null;
let analyticsInstance = null;
let analyticsInitPromise = null;

function ensureFirebase() {
  if (!hasFirebaseConfig()) {
    return null;
  }

  if (!appInstance) {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(appInstance);
  }

  return dbInstance;
}

export function isFirebaseReady() {
  return Boolean(ensureFirebase());
}

export function getFirebaseApp() {
  ensureFirebase();
  return appInstance;
}

export async function initFirebaseAnalytics() {
  const app = getFirebaseApp();

  if (!app || !firebaseConfig.measurementId) {
    return null;
  }

  if (analyticsInstance) {
    return analyticsInstance;
  }

  if (!analyticsInitPromise) {
    analyticsInitPromise = analyticsSupported()
      .then((supported) => {
        if (!supported) {
          return null;
        }

        analyticsInstance = getAnalytics(app);
        return analyticsInstance;
      })
      .catch((error) => {
        console.warn("NovaTone analytics init skipped:", error);
        return null;
      });
  }

  return analyticsInitPromise;
}

export async function saveEarlyAccessApplication(payload) {
  const db = ensureFirebase();
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const docRef = await addDoc(collection(db, "earlyAccessApplications"), {
    ...payload,
    source: "early-access-page",
    submittedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function createCreatorStudioSession(payload) {
  const db = ensureFirebase();
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const docRef = await addDoc(collection(db, "creatorStudioSessions"), {
    ...payload,
    source: "creator-studio",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function saveCreatorStudioFeedback(sessionId, payload) {
  const db = ensureFirebase();
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  const targetCollection = sessionId
    ? collection(db, "creatorStudioSessions", sessionId, "feedbackResponses")
    : collection(db, "creatorStudioFeedback");

  const docRef = await addDoc(targetCollection, {
    ...payload,
    sessionId: sessionId || null,
    submittedAt: serverTimestamp(),
  });

  return docRef.id;
}
