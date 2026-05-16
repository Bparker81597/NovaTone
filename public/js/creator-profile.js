import { initFirebaseAnalytics } from "./firebase-client.js";
import { getCreatorSessions } from "../firebase/session-memory.js";
import {
  createDefaultProfile,
  DEFAULT_AVATAR_URL,
  getCreatorProfile,
  saveCreatorProfile,
} from "../firebase/creator-profile.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const body = document.body;
const sidebarToggle = document.querySelector("[data-studio-toggle]");
const saveButton = document.querySelector("#profile-save");
const resetButton = document.querySelector("#profile-reset");
const feedbackNote = document.querySelector("#profile-feedback-note");
const form = document.querySelector("#profile-form");
const avatarFileInput = document.querySelector("#profile-avatar-file");

const preview = {
  avatar: document.querySelector("#profile-preview-avatar"),
  role: document.querySelector("#profile-preview-role"),
  name: document.querySelector("#profile-preview-name"),
  bio: document.querySelector("#profile-preview-bio"),
  visibility: document.querySelector("#profile-visibility-chip"),
  messaging: document.querySelector("#profile-message-chip"),
  saveStatus: document.querySelector("#profile-save-status"),
  creatorId: document.querySelector("#profile-creator-id"),
  sessionCount: document.querySelector("#profile-session-count"),
  reviewedCount: document.querySelector("#profile-reviewed-count"),
  primaryVibe: document.querySelector("#profile-primary-vibe"),
  sessionStatus: document.querySelector("#profile-session-status"),
  socialPreview: document.querySelector("#profile-social-preview"),
  focusValue: document.querySelector("#profile-focus-value"),
  traitValue: document.querySelector("#profile-trait-value"),
  energyValue: document.querySelector("#profile-energy-value"),
  updatedValue: document.querySelector("#profile-updated-value"),
  visualizer: document.querySelector("#profile-visualizer"),
  projectPreview: document.querySelector("#profile-project-preview"),
};

const state = {
  profile: createDefaultProfile(),
  savedProfile: createDefaultProfile(),
  sessions: [],
  isDirty: false,
};

function initSidebarToggle() {
  sidebarToggle?.addEventListener("click", () => {
    body.classList.toggle("studio-sidebar-open");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      body.classList.remove("studio-sidebar-open");
    }
  });
}

const fieldMap = {
  displayName: "#profile-display-name",
  handle: "#profile-handle",
  roleLabel: "#profile-role-label",
  bio: "#profile-bio",
  location: "#profile-location",
  genres: "#profile-genres",
  websiteUrl: "#profile-website-url",
  instagramUrl: "#profile-instagram-url",
  soundcloudUrl: "#profile-soundcloud-url",
  publicPortfolio: "#profile-public-portfolio",
  allowMessages: "#profile-allow-messages",
};

function formatDate(value) {
  if (!value) {
    return "Now";
  }

  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function setFeedback(message, tone = "muted") {
  if (!feedbackNote) {
    return;
  }

  feedbackNote.textContent = message;
  feedbackNote.classList.remove("is-success", "is-error", "is-muted");
  feedbackNote.classList.add(`is-${tone}`);
}

function setSaveStatusLabel() {
  preview.saveStatus.textContent = state.isDirty ? "Unsaved Changes" : "Saved";
  preview.saveStatus.classList.toggle("is-primary", state.isDirty);
}

function profileValue(name) {
  const selector = fieldMap[name];
  const element = document.querySelector(selector);
  if (!element) {
    return "";
  }

  if (element.type === "checkbox") {
    return element.checked;
  }

  return element.value.trim();
}

function readFeaturedProjects() {
  return [1, 2, 3].map((index) => ({
    title: document.querySelector(`#project-${index}-title`)?.value.trim() || "",
    meta: document.querySelector(`#project-${index}-meta`)?.value.trim() || "",
    description: document.querySelector(`#project-${index}-description`)?.value.trim() || "",
  }));
}

function readProfileFromForm() {
  return {
    ...state.profile,
    displayName: profileValue("displayName"),
    handle: profileValue("handle"),
    roleLabel: profileValue("roleLabel"),
    bio: profileValue("bio"),
    location: profileValue("location"),
    genres: profileValue("genres"),
    avatarUrl: state.profile.avatarUrl || DEFAULT_AVATAR_URL,
    websiteUrl: profileValue("websiteUrl"),
    instagramUrl: profileValue("instagramUrl"),
    soundcloudUrl: profileValue("soundcloudUrl"),
    publicPortfolio: Boolean(profileValue("publicPortfolio")),
    allowMessages: Boolean(profileValue("allowMessages")),
    featuredProjects: readFeaturedProjects(),
  };
}

function writeProfileToForm(profile) {
  Object.entries(fieldMap).forEach(([key, selector]) => {
    const element = document.querySelector(selector);
    if (!element) {
      return;
    }

    if (element.type === "checkbox") {
      element.checked = Boolean(profile[key]);
      return;
    }

    element.value = profile[key] || "";
  });

  (profile.featuredProjects || []).forEach((project, index) => {
    const position = index + 1;
    const title = document.querySelector(`#project-${position}-title`);
    const meta = document.querySelector(`#project-${position}-meta`);
    const description = document.querySelector(`#project-${position}-description`);

    if (title) {
      title.value = project.title || "";
    }
    if (meta) {
      meta.value = project.meta || "";
    }
    if (description) {
      description.value = project.description || "";
    }
  });
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

function topEntry(values, fallback) {
  const ranked = [...countValues(values).entries()].sort((left, right) => right[1] - left[1]);
  return ranked[0]?.[0] || fallback;
}

function averageEnergy(sessions) {
  if (!sessions.length) {
    return 0;
  }
  return Math.round(
    sessions.reduce((sum, session) => sum + (session.emotionalEnergy || session.analysisResults?.emotionalEnergy || 0), 0) / sessions.length
  );
}

function renderSocialPreview(profile) {
  const links = [
    { label: "Website", value: profile.websiteUrl },
    { label: "Instagram", value: profile.instagramUrl },
    { label: "SoundCloud", value: profile.soundcloudUrl },
  ];

  preview.socialPreview.innerHTML = "";
  links.forEach((link) => {
    const chip = document.createElement("a");
    chip.className = "studio-chip";
    chip.textContent = link.value ? link.label : `${link.label} Pending`;
    if (link.value) {
      chip.href = link.value;
      chip.target = "_blank";
      chip.rel = "noreferrer";
    }
    preview.socialPreview.appendChild(chip);
  });
}

function renderProjects(profile) {
  preview.projectPreview.innerHTML = "";
  (profile.featuredProjects || []).forEach((project, index) => {
    const article = document.createElement("article");
    article.className = "studio-project-card";
    article.innerHTML = `
      <div class="studio-project-cover"></div>
      <div class="studio-project-copy">
        <h3>${project.title || `Project ${index + 1}`}</h3>
        <p>${project.meta || "Release / Format"}</p>
      </div>
    `;
    preview.projectPreview.appendChild(article);
  });
}

function renderVisualizerFromSessions(sessions) {
  if (!preview.visualizer) {
    return;
  }

  const bars = sessions[0]?.analysisResults?.energyBars || sessions[0]?.audioFeatures?.waveformBars;
  if (!Array.isArray(bars) || !bars.length) {
    return;
  }

  preview.visualizer.innerHTML = "";
  bars.slice(0, 22).forEach((value) => {
    const bar = document.createElement("span");
    bar.style.height = `${Math.max(20, Math.min(100, value))}%`;
    preview.visualizer.appendChild(bar);
  });
}

function renderStats(profile, sessions) {
  const reviewedSessions = sessions.filter((session) => session.reviewStatus === "reviewed");
  const primaryVibe = topEntry(
    sessions.flatMap((session) => session.selectedVibeTags || []),
    profile.genres ? profile.genres.split(",")[0].trim() : "Not set"
  );
  const topTrait = topEntry(
    sessions.flatMap((session) => session.identityTraits || session.analysisResults?.identityTraits || []),
    "Emerging"
  );

  preview.creatorId.textContent = profile.creatorId || "Guest";
  preview.sessionCount.textContent = String(sessions.length);
  preview.reviewedCount.textContent = String(reviewedSessions.length);
  preview.primaryVibe.textContent = primaryVibe || "Not set";
  preview.sessionStatus.textContent = sessions.length ? "Session-backed" : "No sessions yet";
  preview.focusValue.textContent = primaryVibe || "Building";
  preview.traitValue.textContent = topTrait;
  preview.energyValue.textContent = String(averageEnergy(sessions));
  preview.updatedValue.textContent = formatDate(profile.updatedAt || profile.createdAt);
}

function renderPreview() {
  const profile = state.profile;
  preview.avatar.src = profile.avatarUrl || DEFAULT_AVATAR_URL;
  preview.avatar.onerror = () => {
    preview.avatar.src = DEFAULT_AVATAR_URL;
  };
  preview.role.textContent = profile.roleLabel || "Creator Profile";
  preview.name.textContent = profile.displayName || "NovaTone Creator";
  preview.bio.textContent = profile.bio || "Shape a public-facing creator identity that still feels artist-first.";
  preview.visibility.textContent = profile.publicPortfolio ? "Public Portfolio" : "Private Portfolio";
  preview.messaging.textContent = profile.allowMessages ? "Messages On" : "Messages Off";
  renderSocialPreview(profile);
  renderProjects(profile);
  renderVisualizerFromSessions(state.sessions);
  renderStats(profile, state.sessions);
  setSaveStatusLabel();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Avatar upload failed."));
    reader.readAsDataURL(file);
  });
}

function updateDirtyState() {
  const nextProfile = readProfileFromForm();
  state.profile = nextProfile;
  state.isDirty = JSON.stringify(nextProfile) !== JSON.stringify(state.savedProfile);
  renderPreview();
}

async function saveProfile() {
  state.profile = readProfileFromForm();
  const originalButtonText = saveButton?.textContent || "Save Profile";

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
  }

  try {
    const result = await saveCreatorProfile(state.profile, state.profile.creatorId);
    state.savedProfile = JSON.parse(JSON.stringify(state.profile));
    state.isDirty = false;
    setSaveStatusLabel();
    renderPreview();
    setFeedback(
      result.source === "firebase"
        ? "Profile saved to Firebase."
        : "Firebase is unavailable, so the profile was saved locally in this browser.",
      "success"
    );
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = originalButtonText;
    }
  }
}

function resetProfile() {
  state.profile = JSON.parse(JSON.stringify(state.savedProfile));
  state.isDirty = false;
  writeProfileToForm(state.profile);
  if (avatarFileInput) {
    avatarFileInput.value = "";
  }
  renderPreview();
  setFeedback("Profile reset to the last saved version.", "muted");
}

function bindForm() {
  form?.addEventListener("input", () => {
    updateDirtyState();
  });

  avatarFileInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback("Upload an image file for the avatar.", "error");
      return;
    }

    try {
      state.profile.avatarUrl = await readFileAsDataUrl(file);
      state.isDirty = JSON.stringify(state.profile) !== JSON.stringify(state.savedProfile);
      renderPreview();
      setFeedback("Avatar updated locally. Save the profile to keep it.", "muted");
    } catch (error) {
      console.error("NovaTone avatar upload error:", error);
      setFeedback("Avatar could not be loaded.", "error");
    }
  });

  saveButton?.addEventListener("click", async () => {
    try {
      await saveProfile();
    } catch (error) {
      console.error("NovaTone profile save error:", error);
      setFeedback("Profile could not be saved right now.", "error");
    }
  });

  resetButton?.addEventListener("click", () => {
    resetProfile();
  });
}

async function init() {
  await initFirebaseAnalytics();
  initSidebarToggle();
  const [profile, sessions] = await Promise.all([
    getCreatorProfile(),
    getCreatorSessions(),
  ]);

  state.profile = {
    ...createDefaultProfile(),
    ...profile,
  };
  state.savedProfile = JSON.parse(JSON.stringify(state.profile));
  state.sessions = sessions;
  state.isDirty = false;

  writeProfileToForm(state.profile);
  bindForm();
  renderPreview();
  setFeedback(
    sessions.length
      ? "Profile loaded with live session context."
      : "Profile loaded. Save a few vibe sessions to deepen the profile signals.",
    "muted"
  );

  if (!reduceMotion) {
    document.querySelector(".studio-page-head")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

init().catch((error) => {
  console.error("NovaTone profile page init error:", error);
  setFeedback("Profile data could not be loaded right now.", "error");
});
