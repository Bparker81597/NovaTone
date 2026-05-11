import { generateAnalysis } from "./feedback-engine.js";
import { mountWaveform, startWaveAnimation, updateWaveformSeed } from "./waveform.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const menuToggle = document.querySelector(".nt-menu-toggle");
const mobileNav = document.querySelector(".nt-nav");
const revealItems = document.querySelectorAll(".reveal");

const heroWave = document.querySelector("#studio-hero-wave");
const previewWave = document.querySelector("#studio-preview-wave");
const energyWave = document.querySelector("#studio-energy-wave");

const dropzone = document.querySelector("#studio-dropzone");
const fileInput = document.querySelector("#studio-file-input");
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

const feedbackSection = document.querySelector(".studio-feedback-section");
const feedbackCard = document.querySelector("#studio-feedback-card");
const helpfulButtons = document.querySelectorAll("#helpful-tags .studio-tag");
const feedbackNote = document.querySelector("#studio-feedback-note");
const submitFeedbackButton = document.querySelector("#submit-feedback");

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

function resetAnalysisViews() {
  analysisPanel?.classList.remove("is-visible");
  feedbackSection?.classList.remove("is-visible");
  loadingPanel?.classList.remove("is-visible");
  feedbackNote.textContent = "";
}

function handleFile(file) {
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
  dropzone.classList.add("is-uploading");
  resetAnalysisViews();
  uploadFill.style.width = "0%";
  uploadPercent.textContent = "0%";
  uploadNote.textContent = `Welcoming ${file.name} into the studio...`;

  let progress = 0;
  const timer = window.setInterval(() => {
    progress = Math.min(progress + 8 + Math.floor(Math.random() * 12), 100);
    uploadFill.style.width = `${progress}%`;
    uploadPercent.textContent = `${progress}%`;

    if (progress >= 100) {
      window.clearInterval(timer);
      dropzone.classList.remove("is-uploading");
      uploadNote.textContent = `${file.name} is ready. NovaTone can now listen for emotion, space, and intent.`;
      updateWaveformSeed(previewWave, `${file.name}-${file.size}`, { bars: 22, min: 26, max: 90 });

      if (!reduceMotion) {
        startWaveAnimation(previewWave, { variance: 10, speed: 480 });
      }
    }
  }, 170);
}

function initUpload() {
  fileInput?.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    handleFile(file);
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

  dropzone.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer?.files || [];
    handleFile(file);
  });
}

function readStudioState() {
  return {
    inspiration: document.querySelector("#track-inspiration")?.value.trim() || "",
    identity: document.querySelector("#track-identity")?.value.trim() || "",
    inspirations: document.querySelector("#track-inspirations")?.value.trim() || "",
    selectedMoods: studioState.selectedMoods,
    primaryMood: studioState.selectedMoods[0] || "cinematic",
    stage: studioState.stage,
    fileName: studioState.uploadedFile?.name || "Untitled idea",
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
  feedbackNote.textContent = result.accuracyPrompt;
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

  window.setTimeout(() => {
    window.clearInterval(phraseTimer);
    const result = generateAnalysis(payload);
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

function initFeedbackResponse() {
  helpfulButtons.forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("is-selected");
    });
  });

  submitFeedbackButton?.addEventListener("click", () => {
    if (!studioState.latestAnalysis) {
      feedbackNote.textContent = "Run an analysis first so you can respond to something real.";
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
      feedbackNote.textContent = "Choose how accurate the analysis felt before submitting studio feedback.";
      return;
    }

    console.log("NovaTone creator studio feedback:", payload);
    feedbackNote.textContent = "Studio feedback captured. This is the layer that helps NovaTone become more artist-aware.";
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
  initMenu();
  initReveal();
  initSmoothScroll();
  initWaveforms();
  initSelections();
  initUpload();
  initAnalysis();
  initFeedbackResponse();
}

init();
