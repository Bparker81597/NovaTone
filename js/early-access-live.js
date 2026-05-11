import {
  isFirebaseReady,
  initFirebaseAnalytics,
  saveEarlyAccessApplication,
} from "./firebase-client.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const applicationForm = document.querySelector("#application-form");
const formFeedback = document.querySelector("#form-feedback");
const successPanel = document.querySelector("#success-panel");

function getSelectedOptionValue(containerId) {
  return document.querySelector(`#${containerId} .option-pill.is-selected`)?.dataset.value || "";
}

function setFeedback(message, success = false) {
  if (!formFeedback) {
    return;
  }

  formFeedback.textContent = message;
  formFeedback.classList.toggle("is-success", success);
}

function resetSelectionRow(containerId, defaultValue) {
  const buttons = document.querySelectorAll(`#${containerId} .option-pill`);
  buttons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.value === defaultValue);
  });
}

function buildPayload() {
  const formData = new FormData(applicationForm);
  return {
    creatorName: (formData.get("creatorName") || "").toString().trim(),
    email: (formData.get("email") || "").toString().trim(),
    location: (formData.get("location") || "").toString().trim(),
    creatorType: (formData.get("creatorType") || "").toString().trim(),
    experience: (formData.get("experience") || "").toString().trim(),
    musicType: (formData.get("musicType") || "").toString().trim(),
    portfolioLink: (formData.get("portfolioLink") || "").toString().trim(),
    demoSharing: getSelectedOptionValue("demo-sharing"),
    identity: (formData.get("identity") || "").toString().trim(),
    helpfulFeedback: (formData.get("helpfulFeedback") || "").toString().trim(),
    harmfulFeedback: (formData.get("harmfulFeedback") || "").toString().trim(),
    aiConcerns: (formData.get("aiConcerns") || "").toString().trim(),
    trust: (formData.get("trust") || "").toString().trim(),
    consent: Boolean(formData.get("consent")),
  };
}

function validatePayload(payload) {
  const missingRequired = [
    payload.creatorName,
    payload.email,
    payload.location,
    payload.creatorType,
    payload.experience,
    payload.musicType,
    payload.identity,
    payload.helpfulFeedback,
    payload.harmfulFeedback,
    payload.aiConcerns,
    payload.trust,
  ].some((value) => !value);

  if (missingRequired) {
    return "Fill in the required fields so we can understand your creative background clearly.";
  }

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
  if (!emailIsValid) {
    return "Use a valid email so we can follow up if you are selected for testing.";
  }

  if (!payload.consent) {
    return "Confirm that you understand this is an early test experience before submitting.";
  }

  return "";
}

if (applicationForm) {
  initFirebaseAnalytics();

  if (!isFirebaseReady()) {
    setFeedback("Firebase is not configured yet. Add your Firebase web config in js/firebase-config.js to store real tester applications.", false);
  }

  applicationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = buildPayload();
    const validationMessage = validatePayload(payload);

    if (validationMessage) {
      setFeedback(validationMessage, false);
      successPanel?.classList.remove("is-visible");
      return;
    }

    if (!isFirebaseReady()) {
      console.log("NovaTone early access application (local-only):", payload);
      setFeedback("Firebase is not configured yet, so this application was logged locally only.", false);
      successPanel?.classList.remove("is-visible");
      return;
    }

    try {
      const applicationId = await saveEarlyAccessApplication(payload);
      console.log("NovaTone early access application saved:", { applicationId, payload });
      setFeedback("Application saved to Firebase. Early testing is now collecting real submissions.", true);
      successPanel?.classList.add("is-visible");
      applicationForm.reset();
      resetSelectionRow("demo-sharing", "Yes");
      successPanel?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    } catch (error) {
      console.error("NovaTone early access application error:", error);
      setFeedback("The application could not be saved right now. Check the Firebase config and Firestore rules, then try again.", false);
      successPanel?.classList.remove("is-visible");
    }
  });
}
