import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { auth, db, hasFirebaseConfig } from "../js/firebase-config.js";

const GUEST_STORAGE_KEY = "novatone_guest_id";

function generateGuestId() {
  if (window.crypto?.randomUUID) {
    return `novatone_guest_${window.crypto.randomUUID().slice(0, 8)}`;
  }

  return `novatone_guest_${Math.random().toString(36).slice(2, 10)}`;
}

function readTimestamp(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = readTimestamp(value);

  if (!date) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function countValues(values) {
  return values.reduce((map, value) => {
    if (!value) {
      return map;
    }

    map.set(value, (map.get(value) || 0) + 1);
    return map;
  }, new Map());
}

function topEntries(values, limit = 3) {
  return [...countValues(values).entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([value]) => value);
}

function joinPatternLanguage(values) {
  if (!values.length) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function sessionPatternSummary(sessions) {
  if (!sessions.length) {
    return {
      countLabel: "No saved sessions yet",
      body: "Your Creative Memory starts with your first vibe check.",
    };
  }

  const commonVibes = topEntries(
    sessions.flatMap((session) => session.selectedVibeTags || []),
    2
  ).map((entry) => `${entry} mood`);

  const commonTraits = topEntries(
    sessions.flatMap((session) => session.identityTraits || []),
    2
  );

  const patternTerms = [...commonVibes, ...commonTraits].slice(0, 3);
  const countLabel = `${sessions.length} saved ${sessions.length === 1 ? "session" : "sessions"}`;

  if (!patternTerms.length) {
    return {
      countLabel,
      body: "Based on your saved sessions, NovaTone is beginning to notice the emotional shape of your sound journey.",
    };
  }

  return {
    countLabel,
    body: `Based on your saved sessions, NovaTone is beginning to notice: ${joinPatternLanguage(patternTerms)}.`,
  };
}

function createHistoryCard(session) {
  const article = document.createElement("article");
  article.className = "nt-card interactive-card memory-card";

  const traits = (session.identityTraits || []).slice(0, 3);
  const vibeTags = session.selectedVibeTags || [];
  const rating = session.creatorFeedbackRating || "No accuracy note yet";

  const head = document.createElement("div");
  head.className = "memory-card-head";

  const titleWrap = document.createElement("div");
  const label = document.createElement("p");
  label.className = "studio-analysis-label";
  label.textContent = "Saved Vibe Check";
  const title = document.createElement("h3");
  title.textContent = session.trackTitle || "Untitled Session";
  titleWrap.append(label, title);

  const date = document.createElement("span");
  date.className = "memory-date";
  date.textContent = formatDate(session.createdAt);

  const status = document.createElement("span");
  const isReviewed = session.reviewStatus === "reviewed";
  status.className = `memory-status ${isReviewed ? "is-reviewed" : "is-pending"}`;
  status.textContent = isReviewed ? "Reviewed" : "Not Reviewed";

  const headMeta = document.createElement("div");
  headMeta.className = "memory-head-meta";
  headMeta.append(status, date);
  head.append(titleWrap, headMeta);

  const chipRow = document.createElement("div");
  chipRow.className = "memory-chip-row";
  vibeTags.forEach((tag) => {
    const chip = document.createElement("span");
    chip.textContent = tag;
    chipRow.appendChild(chip);
  });

  const summary = document.createElement("p");
  summary.className = "memory-summary";
  summary.textContent = session.vibeSummary || "A saved identity snapshot lives here.";

  const meta = document.createElement("div");
  meta.className = "memory-meta";

  const traitsBlock = document.createElement("div");
  const traitsLabel = document.createElement("p");
  traitsLabel.className = "memory-meta-label";
  traitsLabel.textContent = "Top identity traits";
  const traitsText = document.createElement("p");
  traitsText.textContent = traits.length ? traits.join(" • ") : "Still taking shape";
  traitsBlock.append(traitsLabel, traitsText);

  const ratingBlock = document.createElement("div");
  const ratingLabel = document.createElement("p");
  ratingLabel.className = "memory-meta-label";
  ratingLabel.textContent = "Accuracy note";
  const ratingText = document.createElement("p");
  ratingText.textContent = rating;
  ratingBlock.append(ratingLabel, ratingText);

  meta.append(traitsBlock, ratingBlock);
  article.append(head, chipRow, summary, meta);

  return article;
}

export function getCreatorId() {
  if (auth?.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  try {
    const existingId = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (existingId) {
      return existingId;
    }

    const guestId = generateGuestId();
    window.localStorage.setItem(GUEST_STORAGE_KEY, guestId);
    return guestId;
  } catch (error) {
    console.warn("NovaTone guest id fallback in use:", error);
    return "novatone_guest_fallback";
  }
}

export async function saveVibeSession(sessionData) {
  if (!db || !hasFirebaseConfig()) {
    throw new Error("Firebase is not configured.");
  }

  // Development note: tighten Firestore rules further before public launch.
  const creatorId = sessionData.creatorId || getCreatorId();
  const isExistingSession = Boolean(sessionData.sessionId);
  const docRef = isExistingSession
    ? doc(db, "vibeSessions", sessionData.sessionId)
    : doc(collection(db, "vibeSessions"));
  const payload = {
    ...sessionData,
    sessionId: docRef.id,
    creatorId,
    updatedAt: serverTimestamp(),
  };

  if (!isExistingSession) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(docRef, payload, { merge: true });

  return docRef.id;
}

export async function getCreatorSessions(creatorId = getCreatorId()) {
  if (!db || !hasFirebaseConfig()) {
    return [];
  }

  const baseRef = collection(db, "vibeSessions");

  try {
    const snapshot = await getDocs(
      query(baseRef, where("creatorId", "==", creatorId), orderBy("createdAt", "desc"))
    );

    return snapshot.docs.map((doc) => ({
      sessionId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.warn("NovaTone session history used fallback query:", error);
    const snapshot = await getDocs(query(baseRef, where("creatorId", "==", creatorId)));

    return snapshot.docs
      .map((doc) => ({
        sessionId: doc.id,
        ...doc.data(),
      }))
      .sort((left, right) => {
        const leftTime = readTimestamp(left.createdAt)?.getTime() || 0;
        const rightTime = readTimestamp(right.createdAt)?.getTime() || 0;
        return rightTime - leftTime;
      });
  }
}

export async function renderSessionHistory(containerId) {
  const historyGrid = document.getElementById(containerId);
  const summaryCount = document.getElementById("creative-memory-count");
  const summaryBody = document.getElementById("creative-memory-pattern-text");
  const emptyState = document.getElementById("creative-memory-empty");

  if (!historyGrid) {
    return [];
  }

  historyGrid.innerHTML = "";

  if (!hasFirebaseConfig()) {
    if (summaryCount) {
      summaryCount.textContent = "Creative Memory is offline";
    }

    if (summaryBody) {
      summaryBody.textContent = "Add Firebase configuration to start saving and revisiting vibe checks.";
    }

    if (emptyState) {
      emptyState.hidden = false;
    }

    return [];
  }

  const sessions = await getCreatorSessions(getCreatorId());
  const summary = sessionPatternSummary(sessions);

  if (summaryCount) {
    summaryCount.textContent = summary.countLabel;
  }

  if (summaryBody) {
    summaryBody.textContent = summary.body;
  }

  if (!sessions.length) {
    if (emptyState) {
      emptyState.hidden = false;
    }

    return [];
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  sessions.forEach((session) => {
    historyGrid.appendChild(createHistoryCard(session));
  });

  return sessions;
}
