const intervals = new WeakMap();

function hashSeed(seed) {
  const value = String(seed || "novatone");
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function seededHeight(seed, index, min, max) {
  const range = max - min;
  const value = Math.sin((seed + index * 17) * 0.39) + Math.cos((seed + index * 13) * 0.21);
  const normalized = (value + 2) / 4;
  return Math.round(min + normalized * range);
}

export function mountWaveform(container, options = {}) {
  if (!container) {
    return [];
  }

  const {
    bars = 24,
    min = 22,
    max = 88,
    seed = "novatone",
    className = "wave-bar",
  } = options;

  container.innerHTML = "";
  const seedValue = hashSeed(seed);
  const waveBars = [];

  for (let index = 0; index < bars; index += 1) {
    const bar = document.createElement("span");
    const base = seededHeight(seedValue, index, min, max);
    bar.className = className;
    bar.dataset.base = String(base);
    bar.style.height = `${base}%`;
    container.appendChild(bar);
    waveBars.push(bar);
  }

  return waveBars;
}

export function startWaveAnimation(container, options = {}) {
  if (!container) {
    return;
  }

  stopWaveAnimation(container);

  const {
    variance = 12,
    speed = 520,
    floor = 16,
    ceiling = 96,
  } = options;

  const tick = () => {
    const bars = container.querySelectorAll("span");

    bars.forEach((bar, index) => {
      const base = Number(bar.dataset.base || 50);
      const offset = Math.sin((Date.now() / speed) + index * 0.65) * variance;
      const next = Math.max(floor, Math.min(ceiling, Math.round(base + offset)));
      bar.style.height = `${next}%`;
    });
  };

  tick();
  const intervalId = window.setInterval(tick, speed);
  intervals.set(container, intervalId);
}

export function stopWaveAnimation(container) {
  const intervalId = intervals.get(container);

  if (intervalId) {
    window.clearInterval(intervalId);
    intervals.delete(container);
  }
}

export function updateWaveformSeed(container, seed, options = {}) {
  mountWaveform(container, { ...options, seed });
}
