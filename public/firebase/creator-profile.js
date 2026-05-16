import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { db, hasFirebaseConfig } from "../js/firebase-config.js";
import { getCreatorId } from "./session-memory.js";

const PROFILE_STORAGE_PREFIX = "novatone_creator_profile_";
export const DEFAULT_AVATAR_URL = "assets/branding/novatone-logo.png";

export function createDefaultProfile() {
  return {
    displayName: "NovaTone Creator",
    handle: "@novatone",
    roleLabel: "Creator Profile",
    bio: "Shape a public-facing creator identity that still feels artist-first.",
    location: "",
    genres: "",
    avatarUrl: DEFAULT_AVATAR_URL,
    websiteUrl: "",
    instagramUrl: "",
    soundcloudUrl: "",
    publicPortfolio: true,
    allowMessages: true,
    featuredProjects: [
      {
        title: "Neon Synthesis",
        meta: "LP / Electronic",
        description: "A forward-leaning body of work built around bright edges and emotional density.",
      },
      {
        title: "Static Fields",
        meta: "EP / Ambient",
        description: "A slower, more immersive release centered on texture and atmosphere.",
      },
      {
        title: "Kinetic Pulse",
        meta: "Single / Techno",
        description: "A focused release built for movement, pressure, and live energy.",
      },
    ],
  };
}

function storageKey(creatorId) {
  return `${PROFILE_STORAGE_PREFIX}${creatorId}`;
}

function readLocalProfile(creatorId) {
  try {
    const raw = window.localStorage.getItem(storageKey(creatorId));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("NovaTone local profile read fallback failed:", error);
    return null;
  }
}

function writeLocalProfile(creatorId, profile) {
  try {
    window.localStorage.setItem(storageKey(creatorId), JSON.stringify(profile));
  } catch (error) {
    console.warn("NovaTone local profile write fallback failed:", error);
  }
}

export async function getCreatorProfile(creatorId = getCreatorId()) {
  const localProfile = readLocalProfile(creatorId);

  if (!db || !hasFirebaseConfig()) {
    return {
      creatorId,
      ...createDefaultProfile(),
      ...(localProfile || {}),
    };
  }

  const profileRef = doc(db, "creatorProfiles", creatorId);
  const snapshot = await getDoc(profileRef);
  const profile = snapshot.exists()
    ? snapshot.data()
    : { ...createDefaultProfile(), creatorId };

  const mergedProfile = {
    creatorId,
    ...createDefaultProfile(),
    ...(localProfile || {}),
    ...profile,
  };

  writeLocalProfile(creatorId, mergedProfile);
  return mergedProfile;
}

export async function saveCreatorProfile(profile, creatorId = getCreatorId()) {
  const localPayload = {
    creatorId,
    ...createDefaultProfile(),
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  writeLocalProfile(creatorId, localPayload);

  if (!db || !hasFirebaseConfig()) {
    return {
      profileId: creatorId,
      source: "local",
    };
  }

  const payload = {
    ...localPayload,
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "creatorProfiles", creatorId), {
    ...payload,
    createdAt: profile.createdAt || serverTimestamp(),
  }, { merge: true });

  return {
    profileId: creatorId,
    source: "firebase",
  };
}
