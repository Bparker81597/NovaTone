import { generateAnalysis } from "./feedback-engine.js";
import { mountWaveform, startWaveAnimation, updateWaveformSeed } from "./waveform.js";
import { isFirebaseReady, initFirebaseAnalytics } from "./firebase-client.js";
import {
  getCreatorId,
  getCreatorSessions,
  renderSessionHistory,
  saveVibeSession,
} from "../firebase/session-memory.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const menuToggle = document.querySelector(".nt-menu-toggle");
const mobileNav = document.querySelector(".nt-nav");
const revealItems = document.querySelectorAll(".reveal");

const heroWave = document.querySelector("#studio-hero-wave");
const previewWave = document.querySelector("#studio-preview-wave");
const energyWave = document.querySelector("#studio-energy-wave");

const dropzone = document.querySelector("#studio-dropzone");
const fileInput = document.querySelector("#studio-file-input");
const trackTitleInput = document.querySelector("#track-title");
const uploadFill = document.querySelector("#studio-upload-fill");
const uploadPercent = document.querySelector("#studio-upload-percent");
const uploadNote = document.querySelector("#studio-upload-note");

const vibeButtons = document.querySelectorAll(".studio-tag[data-vibe]");
const stageButtons = document.querySelectorAll("#track-stage .option-pill");
const analyzeButton = document.querySelector("#analyze-button");
const loadingPanel = document.querySelector("#studio-loading");
const loadingText = document.querySelector("#studio-loading-text");

const analysisPanel = document.querySelector("#studio-analysis");
const summaryList = document.querySelector("#vibe-summary");
const energyCaption = document.querySelector("#studio-energy-caption");
const traitList = document.querySelector("#studio-traits");
const arrangementInsight = document.querySelector("#arrangement-insight");
const identityInsight = document.querySelector("#identity-insight");
const producerInsight = document.querySelector("#producer-insight");
const nextStepSuggestion = document.querySelector("#next-step-suggestion");

const feedbackSection = document.querySelector(".studio-feedback-section");
const feedbackCard = document.querySelector("#studio-feedback-card");
const helpfulButtons = document.querySelectorAll("#helpful-tags .studio-tag");
const feedbackNote = document.querySelector("#studio-feedback-note");
const submitFeedbackButton = document.querySelector("#submit-feedback");
const saveSessionButton = document.querySelector("#save-session");
const createNewSessionButton = document.querySelector("#create-new-session");
const reviewStatus = document.querySelector("#studio-review-status");

const loadingMessages = [
  "Listening for emotional textures...",
  "Reading creative energy...",
  "Mapping atmosphere and tension...",
  "Discovering identity patterns...",
  "Building vibe profile..."
];

const studioState = {
  uploadedFile: null,
  selectedMoods: ["cinematic"],
  stage: "unfinished",
  latestAnalysis: null,
  sessionId: null,
  hasSavedSession: false,
  audioFeatures: null,
  previousSessions: [],
};

function closeMenu() {
  mobileNav?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

function initMenu() {
  if (!menuToggle || !mobileNav) {
    return;
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });
}

function initReveal() {
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function initWaveforms() {
  mountWaveform(heroWave, { bars: 30, min: 18, max: 92, seed: "creator-studio-hero" });
  mountWaveform(previewWave, { bars: 22, min: 26, max: 86, seed: "creator-preview" });
  mountWaveform(energyWave, { bars: 12, min: 24, max: 84, seed: "creator-energy" });

  if (!reduceMotion) {
    startWaveAnimation(heroWave, { variance: 14, speed: 440 });
    startWaveAnimation(previewWave, { variance: 10, speed: 500 });
    startWaveAnimation(energyWave, { variance: 8, speed: 540 });
  }
}

function initSelections() {
  vibeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("is-selected");

      const selected = [...vibeButtons]
        .filter((entry) => entry.classList.contains("is-selected"))
        .map((entry) => entry.dataset.vibe);

      studioState.selectedMoods = selected.length ? selected : ["cinematic"];

      if (!selected.length) {
        button.classList.add("is-selected");
        studioState.selectedMoods = ["cinematic"];
      }
    });
  });

  stageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      stageButtons.forEach((entry) => entry.classList.remove("is-selected"));
      button.classList.add("is-selected");
      studioState.stage = button.dataset.value || "unfinished";
    });
  });

  ["#accuracy-row", "#inspiration-row"].forEach((selector) => {
    const buttons = document.querySelectorAll(`${selector} .option-pill`);
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((entry) => entry.classList.remove("is-selected"));
        button.classList.add("is-selected");
      });
    });
  });
}

function setReviewStatus(state) {
  if (!reviewStatus) {
    return;
  }

  reviewStatus.classList.remove("is-pending", "is-reviewed");

  if (state === "reviewed") {
    reviewStatus.textContent = "Reviewed";
    reviewStatus.classList.add("is-reviewed");
    return;
  }

  reviewStatus.textContent = "Not reviewed";
  reviewStatus.classList.add("is-pending");
}

function setFeedbackNote(message, tone = "success") {
  if (!feedbackNote) {
    return;
  }

  feedbackNote.textContent = message;
  feedbackNote.classList.remove("is-success", "is-error", "is-muted");

  if (tone) {
    feedbackNote.classList.add(`is-${tone}`);
  }
}

function resetAnalysisViews() {
  analysisPanel?.classList.remove("is-visible");
  feedbackSection?.classList.remove("is-visible");
  loadingPanel?.classList.remove("is-visible");
  setFeedbackNote("", "");
  studioState.latestAnalysis = null;
  studioState.sessionId = null;
  studioState.hasSavedSession = false;
  setReviewStatus("pending");
}

async function analyzeUploadedAudio(file) {
  if (!file) {
    return null;
  }

  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    const audioContext = new AudioContextCtor();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const sampleData = audioBuffer.getChannelData(0);
    const bucketCount = 22;
    const samplesPerBucket = Math.max(1, Math.floor(sampleData.length / bucketCount));
    const waveformBars = [];
    let totalAbs = 0;
    let zeroCrossings = 0;
    let weightedHigh = 0;
    let weightedLow = 0;

    for (let index = 1; index < sampleData.length; index += 1) {
      const current = sampleData[index];
      const previous = sampleData[index - 1];
      totalAbs += Math.abs(current);

      if ((current >= 0 && previous < 0) || (current < 0 && previous >= 0)) {
        zeroCrossings += 1;
      }

      weightedLow += Math.abs(current) * (1 - (index / sampleData.length));
      weightedHigh += Math.abs(current) * (index / sampleData.length);
    }

    for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
      const start = bucketIndex * samplesPerBucket;
      const end = Math.min(sampleData.length, start + samplesPerBucket);
      let sum = 0;

      for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
        sum += Math.abs(sampleData[sampleIndex]);
      }

      const average = end > start ? sum / (end - start) : 0;
      waveformBars.push(Math.round(Math.max(18, Math.min(96, average * 220 + 18))));
    }

    const averageLevel = totalAbs / Math.max(1, sampleData.length - 1);
    const peakLevel = sampleData.reduce((peak, value) => Math.max(peak, Math.abs(value)), 0);
    const brightness = weightedHigh / Math.max(weightedHigh + weightedLow, 0.0001);
    const features = {
      durationSeconds: Number(audioBuffer.duration.toFixed(2)),
      sampleRate: audioBuffer.sampleRate,
      channelCount: audioBuffer.numberOfChannels,
      averageLevel: Number(averageLevel.toFixed(4)),
      peakLevel: Number(peakLevel.toFixed(4)),
      zeroCrossingRate: Number((zeroCrossings / Math.max(sampleData.length - 1, 1)).toFixed(4)),
      brightness: Number(brightness.toFixed(4)),
      waveformBars,
      fileSize: file.size,
      mimeType: file.type,
    };

    await audioContext.close();
    return features;
  } catch (error) {
    console.warn("NovaTone audio analysis fallback in use:", error);
    return null;
  }
}

async function handleFile(file) {
  if (!file || !uploadFill || !uploadPercent || !uploadNote || !dropzone) {
    return;
  }

  const validType = file.type.includes("mpeg") || file.type.includes("wav") || /\.(mp3|wav)$/i.test(file.name);

  if (!validType) {
    uploadNote.textContent = "Use an MP3 or WAV so NovaTone can stay focused on the shape of the idea.";
    uploadFill.style.width = "0%";
    uploadPercent.textContent = "0%";
    return;
  }

  studioState.uploadedFile = file;
  studioState.audioFeatures = null;
  dropzone.classList.add("is-uploading");
  resetAnalysisViews();
  uploadFill.style.width = "0%";
  uploadPercent.textContent = "0%";
  uploadNote.textContent = `Welcoming ${file.name} into the studio...`;

  let progress = 0;
  const timer = window.setInterval(async () => {
    progress = Math.min(progress + 8 + Math.floor(Math.random() * 12), 100);
    uploadFill.style.width = `${progress}%`;
    uploadPercent.textContent = `${progress}%`;

    if (progress >= 100) {
      window.clearInterval(timer);
      dropzone.classList.remove("is-uploading");
      uploadNote.textContent = `${file.name} is ready. NovaTone can now listen for emotion, space, and intent.`;
      const audioFeatures = await analyzeUploadedAudio(file);
      studioState.audioFeatures = audioFeatures;

      if (audioFeatures?.waveformBars?.length) {
        updateWaveformSeed(previewWave, audioFeatures.waveformBars.join("-"), {
          bars: audioFeatures.waveformBars.length,
          min: 26,
          max: 92,
        });

        [...previewWave.querySelectorAll("span")].forEach((bar, index) => {
          const height = audioFeatures.waveformBars[index] || 50;
          bar.dataset.base = String(height);
          bar.style.height = `${height}%`;
        });
      } else {
        updateWaveformSeed(previewWave, `${file.name}-${file.size}`, { bars: 22, min: 26, max: 90 });
      }

      if (!reduceMotion) {
        startWaveAnimation(previewWave, { variance: 10, speed: 480 });
      }
    }
  }, 170);
}

function initUpload() {
  fileInput?.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    await handleFile(file);
  });

  if (!dropzone) {
    return;
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragover");
    });
  });

  dropzone.addEventListener("drop", async (event) => {
    const [file] = event.dataTransfer?.files || [];
    await handleFile(file);
  });
}

function readStudioState() {
  const trackTitle = trackTitleInput?.value.trim() || "";

  return {
    trackTitle,
    inspiration: document.querySelector("#track-inspiration")?.value.trim() || "",
    identity: document.querySelector("#track-identity")?.value.trim() || "",
    inspirations: document.querySelector("#track-inspirations")?.value.trim() || "",
    selectedMoods: studioState.selectedMoods,
    primaryMood: studioState.selectedMoods[0] || "cinematic",
    stage: studioState.stage,
    fileName: studioState.uploadedFile?.name || "Untitled idea",
    audioFeatures: studioState.audioFeatures,
  };
}

function deriveTrackTitle(payload) {
  if (payload.trackTitle) {
    return payload.trackTitle;
  }

  const fileName = payload.fileName || studioState.uploadedFile?.name || "Untitled Session";
  return fileName.replace(/\.[^/.]+$/, "") || "Untitled Session";
}

function buildSessionPayload(feedbackPayload) {
  const creativeIntent = readStudioState();
  const analysis = studioState.latestAnalysis;

  return {
    sessionId: studioState.sessionId || undefined,
    creatorId: getCreatorId(),
    trackTitle: deriveTrackTitle(creativeIntent),
    uploadedFileName: studioState.uploadedFile?.name || "Untitled Session",
    uploadedFileUrl: "",
    selectedVibeTags: creativeIntent.selectedMoods,
    creativeIntent: creativeIntent.inspiration,
    whatMakesItYou: creativeIntent.identity,
    currentStage: creativeIntent.stage,
    inspirations: creativeIntent.inspirations,
    reviewStatus: feedbackPayload.reviewStatus || "pending_review",
    audioFeatures: creativeIntent.audioFeatures || null,
    analysisResults: {
      vibeSummary: analysis.vibeSummary.join(" "),
      emotionalEnergy: analysis.emotionalEnergy,
      identityTraits: analysis.traits,
      arrangementInsight: analysis.arrangementInsight,
      artistIdentityInsight: analysis.identityInsight,
      producerInsight: analysis.producerInsight,
      nextStepSuggestion: analysis.nextStepSuggestion,
      energyCaption: analysis.energyCaption,
      energyBars: analysis.energyBars,
    },
    vibeSummary: analysis.vibeSummary[0] || "",
    emotionalEnergy: analysis.emotionalEnergy,
    identityTraits: analysis.traits,
    arrangementInsight: analysis.arrangementInsight,
    artistIdentityInsight: analysis.identityInsight,
    producerInsight: analysis.producerInsight,
    nextStepSuggestion: analysis.nextStepSuggestion,
    creatorFeedbackRating: feedbackPayload.accuracy,
    inspiredNewIdeas: feedbackPayload.inspiredNewIdeas === "Yes",
    helpfulTags: feedbackPayload.helpfulAreas,
    feltOffText: feedbackPayload.whatFeltOff,
  };
}

function renderAnalysis(result) {
  studioState.latestAnalysis = result;

  summaryList.innerHTML = "";
  traitList.innerHTML = "";

  result.vibeSummary.forEach((entry) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = entry;
    summaryList.appendChild(paragraph);
  });

  result.traits.forEach((entry) => {
    const tag = document.createElement("span");
    tag.textContent = entry;
    traitList.appendChild(tag);
  });

  arrangementInsight.textContent = result.arrangementInsight;
  identityInsight.textContent = result.identityInsight;
  producerInsight.textContent = result.producerInsight;
  nextStepSuggestion.textContent = result.nextStepSuggestion;
  energyCaption.textContent = result.energyCaption;

  updateWaveformSeed(energyWave, result.energyBars.join("-"), {
    bars: result.energyBars.length,
    min: 20,
    max: 94
  });

  [...energyWave.querySelectorAll("span")].forEach((bar, index) => {
    const height = result.energyBars[index] || 50;
    bar.dataset.base = String(height);
    bar.style.height = `${height}%`;
  });

  if (!reduceMotion) {
    startWaveAnimation(energyWave, { variance: 6, speed: 540 });
  }

  analysisPanel.classList.add("is-visible");
  feedbackSection?.classList.add("is-visible");
  setReviewStatus("pending");
  setFeedbackNote(
    isFirebaseReady()
      ? `${result.accuracyPrompt} Save the session or review it below to mark it as reviewed in Creative Memory.`
      : `${result.accuracyPrompt} We can still show the analysis here, but Creative Memory is offline until Firebase is available.`,
    isFirebaseReady() ? "muted" : "error"
  );
}

function runAnalysisSequence() {
  const payload = readStudioState();
  loadingPanel?.classList.add("is-visible");
  analysisPanel?.classList.remove("is-visible");
  analyzeButton.disabled = true;

  let phraseIndex = 0;
  loadingText.textContent = loadingMessages[0];

  const phraseTimer = window.setInterval(() => {
    phraseIndex = (phraseIndex + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[phraseIndex];
  }, 720);

  window.setTimeout(async () => {
    window.clearInterval(phraseTimer);

    if (isFirebaseReady()) {
      try {
        studioState.previousSessions = await getCreatorSessions(getCreatorId());
      } catch (error) {
        console.warn("NovaTone previous session lookup failed:", error);
      }
    }

    const result = generateAnalysis(payload, {
      previousSessions: studioState.previousSessions,
    });
    console.log("NovaTone creator studio analysis input:", payload);
    console.log("NovaTone creator studio analysis output:", result);

    renderAnalysis(result);
    loadingPanel?.classList.remove("is-visible");
    analyzeButton.disabled = false;
    feedbackCard?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, reduceMotion ? 300 : 3400);
}

function initAnalysis() {
  analyzeButton?.addEventListener("click", () => {
    if (!studioState.uploadedFile) {
      uploadNote.textContent = "Start by bringing a beat, demo, or unfinished idea into the studio first.";
      return;
    }

    runAnalysisSequence();
  });
}

function selectedSingleValue(containerSelector) {
  return document.querySelector(`${containerSelector} .option-pill.is-selected`)?.dataset.value || "";
}

async function persistSession(feedbackPayload) {
  const sessionData = buildSessionPayload(feedbackPayload);
  const sessionId = await saveVibeSession(sessionData);
  studioState.sessionId = sessionId;
  studioState.hasSavedSession = true;
  studioState.previousSessions = await renderSessionHistory("creative-memory-history");
  return sessionId;
}

function clearFormSelections() {
  document.querySelector("#track-inspiration").value = "";
  document.querySelector("#track-identity").value = "";
  document.querySelector("#track-inspirations").value = "";
  document.querySelector("#feedback-off").value = "";
  trackTitleInput.value = "";
  if (fileInput) {
    fileInput.value = "";
  }

  helpfulButtons.forEach((button) => button.classList.remove("is-selected"));
  document.querySelectorAll("#accuracy-row .option-pill, #inspiration-row .option-pill").forEach((button) => {
    button.classList.remove("is-selected");
  });

  vibeButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.vibe === "cinematic");
  });

  stageButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.value === "unfinished");
  });

  studioState.selectedMoods = ["cinematic"];
  studioState.stage = "unfinished";
  studioState.uploadedFile = null;
  studioState.audioFeatures = null;
  uploadFill.style.width = "0%";
  uploadPercent.textContent = "0%";
  uploadNote.textContent = "No audio loaded yet. NovaTone will begin by listening for mood, pacing, and emotional shape.";
  updateWaveformSeed(previewWave, "creator-preview-reset", { bars: 22, min: 26, max: 86 });
  resetAnalysisViews();
}

function initFeedbackResponse() {
  helpfulButtons.forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("is-selected");
    });
  });

  saveSessionButton?.addEventListener("click", async () => {
    if (!studioState.latestAnalysis) {
      setFeedbackNote("Run an analysis first so there is something real to save.", "error");
      return;
    }

    if (!isFirebaseReady()) {
      setFeedbackNote("Firebase is not configured, so this session cannot be saved yet.", "error");
      return;
    }

    try {
      const sessionId = await persistSession({
        accuracy: "",
        inspiredNewIdeas: "",
        helpfulAreas: [],
        whatFeltOff: "",
        reviewStatus: "pending_review",
      });
      setReviewStatus("pending");
      console.log("NovaTone creator studio session saved without review:", {
        sessionId,
        reviewStatus: "pending_review",
      });
      setFeedbackNote("Session saved to Creative Memory. Review status is still not reviewed.", "success");
    } catch (error) {
      console.error("NovaTone creator studio save-only error:", error);
      setFeedbackNote("We couldn’t save this session right now.", "error");
    }
  });

  submitFeedbackButton?.addEventListener("click", async () => {
    if (!studioState.latestAnalysis) {
      setFeedbackNote("Run an analysis first so you can respond to something real.", "error");
      return;
    }

    const payload = {
      analysisMood: readStudioState().primaryMood,
      accuracy: selectedSingleValue("#accuracy-row"),
      inspiredNewIdeas: selectedSingleValue("#inspiration-row"),
      helpfulAreas: [...helpfulButtons]
        .filter((button) => button.classList.contains("is-selected"))
        .map((button) => button.dataset.helpful),
      whatFeltOff: document.querySelector("#feedback-off")?.value.trim() || "",
      analysisSnapshot: studioState.latestAnalysis,
    };

    if (!payload.accuracy) {
      setFeedbackNote("Choose how accurate the analysis felt before submitting studio feedback.", "error");
      return;
    }

    if (!isFirebaseReady()) {
      console.log("NovaTone creator studio vibe session (local-only):", {
        payload,
        session: buildSessionPayload({
          ...payload,
          reviewStatus: "reviewed",
        }),
      });
      setFeedbackNote(
        "We couldn’t save this session yet, but your analysis is still available on this page.",
        "error"
      );
      return;
    }

    try {
      const sessionId = await persistSession({
        ...payload,
        reviewStatus: "reviewed",
      });
      setReviewStatus("reviewed");
      console.log("NovaTone creator studio session memory saved:", {
        sessionId,
        reviewStatus: "reviewed",
      });
      setFeedbackNote("Session saved to Creative Memory and marked as reviewed.", "success");
    } catch (error) {
      console.error("NovaTone creator studio session memory save error:", error);
      setFeedbackNote(
        "We couldn’t save this session yet, but your analysis is still available on this page.",
        "error"
      );
    }
  });

  createNewSessionButton?.addEventListener("click", () => {
    clearFormSelections();
    setFeedbackNote("Ready for a new session.", "muted");
    dropzone?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href) {
        return;
      }

      const target = document.querySelector(href);
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      closeMenu();
    });
  });
}

function init() {
  initFirebaseAnalytics();
  initMenu();
  initReveal();
  initSmoothScroll();
  initWaveforms();
  initSelections();
  initUpload();
  initAnalysis();
  initFeedbackResponse();
  renderSessionHistory("creative-memory-history").then((sessions) => {
    studioState.previousSessions = sessions;
  }).catch((error) => {
    console.error("NovaTone Creative Memory render error:", error);
    setFeedbackNote("Creative Memory is not available yet, but the studio can still run analyses.", "error");
  });
  setReviewStatus("pending");
}

init();
