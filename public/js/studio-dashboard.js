const body = document.body;
const sidebar = document.querySelector("[data-studio-sidebar]");
const toggle = document.querySelector("[data-studio-toggle]");
const closeButtons = document.querySelectorAll("[data-studio-close]");
const progressBars = document.querySelectorAll("[data-progress]");

function setSidebar(open) {
  body.classList.toggle("studio-sidebar-open", open);
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
