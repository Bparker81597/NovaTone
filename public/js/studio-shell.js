import { getCreatorProfile } from "../firebase/creator-profile.js";

const body = document.body;
const toggle = document.querySelector("[data-studio-toggle]");
const closeButtons = document.querySelectorAll("[data-studio-close]");
const progressBars = document.querySelectorAll("[data-progress]");

function setSidebar(open) {
  body.classList.toggle("studio-sidebar-open", open);
}

function hydrateProfileShell(profile) {
  document.querySelectorAll("[data-profile-avatar]").forEach((image) => {
    image.src = profile.avatarUrl || "assets/branding/novatone-logo.png";
    image.onerror = () => {
      image.src = "assets/branding/novatone-logo.png";
    };
  });

  document.querySelectorAll("[data-profile-name]").forEach((element) => {
    element.textContent = profile.displayName || "NovaTone Creator";
  });

  document.querySelectorAll("[data-profile-meta]").forEach((element) => {
    element.textContent = profile.handle || profile.roleLabel || "Creator Profile";
  });
}

async function initProfileShell() {
  try {
    const profile = await getCreatorProfile();
    hydrateProfileShell(profile);
  } catch (error) {
    console.warn("NovaTone studio shell profile hydration skipped:", error);
  }
}

toggle?.addEventListener("click", () => {
  setSidebar(!body.classList.contains("studio-sidebar-open"));
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => setSidebar(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setSidebar(false);
  }
});

progressBars.forEach((bar) => {
  const value = bar.dataset.progress;
  requestAnimationFrame(() => {
    bar.style.width = `${value}%`;
  });
});

initProfileShell();
