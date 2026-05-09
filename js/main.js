const navLinks = document.querySelectorAll('.site-nav a[href^="#"], .button[href^="#"], .brand[href^="#"]');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const interactiveCards = document.querySelectorAll('.interactive-card');
const waveformBars = document.querySelectorAll('.wave-bar');
const revealItems = document.querySelectorAll('.reveal');
const earlyAccessForm = document.querySelector('#early-access-form');
const formNote = document.querySelector('#form-note');
const studioDropzone = document.querySelector('#studio-dropzone');
const studioFileInput = document.querySelector('#studio-file-input');
const studioUploadProgress = document.querySelector('#studio-upload-progress');
const studioUploadPercent = document.querySelector('#studio-upload-percent');
const studioFileCopy = document.querySelector('#studio-file-copy');
const studioWavePreview = document.querySelector('#studio-wave-preview');
const studioWaveBars = document.querySelectorAll('.studio-wave-bar');
const vibeTagButtons = document.querySelectorAll('.vibe-tag');
const trackStateButtons = document.querySelectorAll('.track-state');
const vibeAnalyzeButton = document.querySelector('#vibe-analyze-button');
const vibeLoading = document.querySelector('#vibe-loading');
const vibeLoadingText = document.querySelector('#vibe-loading-text');
const vibeResultsPreview = document.querySelector('#vibe-results-preview');
const previewVibeSummary = document.querySelector('#preview-vibe-summary');
const previewTraits = document.querySelector('#preview-traits');
const previewSupportiveInsight = document.querySelector('#preview-supportive-insight');
const previewEnergyBars = document.querySelectorAll('.preview-energy-bar');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loadingMessages = [
  'Mapping emotional textures...',
  'Reading energy transitions...',
  'Discovering creative patterns...',
  'Listening for artistic intent...',
  'Building creative identity profile...',
];
const vibeState = {
  uploadedFile: null,
  moods: ['cinematic'],
  trackState: 'unfinished',
};

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');

    if (!href || !href.startsWith('#')) {
      return;
    }

    const target = document.querySelector(href);

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

    siteNav?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    document.body.classList.toggle('menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

interactiveCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (window.innerWidth < 768 || reduceMotion) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const rotateY = ((offsetX / rect.width) - 0.5) * 10;
    const rotateX = ((offsetY / rect.height) - 0.5) * -10;

    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
  });
});

if (!reduceMotion && waveformBars.length) {
  const animateWaveform = () => {
    waveformBars.forEach((bar) => {
      const base = Number(bar.dataset.base || 50);
      const variance = Math.floor(Math.random() * 26) - 13;
      const nextHeight = Math.max(18, Math.min(96, base + variance));
      bar.style.height = `${nextHeight}%`;
    });
  };

  animateWaveform();
  window.setInterval(animateWaveform, 520);
} else {
  waveformBars.forEach((bar) => {
    const base = Number(bar.dataset.base || 50);
    bar.style.height = `${base}%`;
  });
}

if (!reduceMotion && studioWaveBars.length) {
  const animateStudioWaves = () => {
    studioWaveBars.forEach((bar) => {
      const base = Number(bar.dataset.base || 50);
      const variance = Math.floor(Math.random() * 22) - 11;
      const nextHeight = Math.max(18, Math.min(94, base + variance));
      bar.style.height = `${nextHeight}%`;
    });
  };

  animateStudioWaves();
  window.setInterval(animateStudioWaves, 540);
} else {
  studioWaveBars.forEach((bar) => {
    const base = Number(bar.dataset.base || 50);
    bar.style.height = `${base}%`;
  });
}

if (!reduceMotion && previewEnergyBars.length) {
  const animatePreviewEnergy = () => {
    previewEnergyBars.forEach((bar) => {
      const base = Number(bar.dataset.base || 50);
      const variance = Math.floor(Math.random() * 18) - 9;
      const nextHeight = Math.max(18, Math.min(94, base + variance));
      bar.style.height = `${nextHeight}%`;
    });
  };

  animatePreviewEnergy();
  window.setInterval(animatePreviewEnergy, 620);
} else {
  previewEnergyBars.forEach((bar) => {
    const base = Number(bar.dataset.base || 50);
    bar.style.height = `${base}%`;
  });
}

vibeTagButtons.forEach((button) => {
  button.addEventListener('click', () => {
    button.classList.toggle('is-selected');

    const selected = [...vibeTagButtons]
      .filter((entry) => entry.classList.contains('is-selected'))
      .map((entry) => entry.dataset.vibe);

    vibeState.moods = selected.length ? selected : ['cinematic'];

    if (!selected.length) {
      button.classList.add('is-selected');
      vibeState.moods = ['cinematic'];
    }
  });
});

trackStateButtons.forEach((button) => {
  button.addEventListener('click', () => {
    trackStateButtons.forEach((entry) => entry.classList.remove('is-selected'));
    button.classList.add('is-selected');
    vibeState.trackState = button.dataset.state || 'unfinished';
  });
});

function randomizeBars(bars, minimum, maximum) {
  bars.forEach((bar, index) => {
    const base = Number(bar.dataset.base || 50);
    const offset = Math.round(Math.sin(Date.now() / 600 + index) * 10);
    const nextHeight = Math.max(minimum, Math.min(maximum, base + offset));
    bar.style.height = `${nextHeight}%`;
  });
}

function handleStudioUpload(file) {
  if (!file || !studioUploadProgress || !studioUploadPercent || !studioFileCopy || !studioDropzone) {
    return;
  }

  const validType = file.type.includes('mpeg') || file.type.includes('wav') || /\.(mp3|wav)$/i.test(file.name);

  if (!validType) {
    studioFileCopy.textContent = 'Use an MP3 or WAV so the Vibe Check can stay focused on the shape of the idea.';
    studioUploadProgress.style.width = '0%';
    studioUploadPercent.textContent = '0%';
    return;
  }

  vibeState.uploadedFile = file;
  studioDropzone.classList.add('is-uploading');
  studioWavePreview?.classList.remove('is-visible');
  vibeResultsPreview?.classList.remove('is-visible');
  vibeLoading?.classList.remove('is-visible');
  studioFileCopy.textContent = `Welcoming ${file.name} into the room...`;
  studioUploadProgress.style.width = '0%';
  studioUploadPercent.textContent = '0%';

  let progress = 0;
  const timer = window.setInterval(() => {
    progress = Math.min(progress + 9 + Math.floor(Math.random() * 10), 100);
    studioUploadProgress.style.width = `${progress}%`;
    studioUploadPercent.textContent = `${progress}%`;

    if (progress >= 100) {
      window.clearInterval(timer);
      studioDropzone.classList.remove('is-uploading');
      studioFileCopy.textContent = `${file.name} is ready. NovaTone can now listen for mood, space, and emotional direction.`;
      studioWavePreview?.classList.add('is-visible');

      studioWaveBars.forEach((bar, index) => {
        const base = 30 + ((file.name.charCodeAt(index % file.name.length) + index * 7) % 54);
        bar.dataset.base = String(base);
        bar.style.height = `${base}%`;
      });

      if (!reduceMotion) {
        randomizeBars(studioWaveBars, 22, 94);
      }
    }
  }, 170);
}

if (studioFileInput) {
  studioFileInput.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    handleStudioUpload(file);
  });
}

if (studioDropzone) {
  ['dragenter', 'dragover'].forEach((eventName) => {
    studioDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      studioDropzone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    studioDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      studioDropzone.classList.remove('is-dragover');
    });
  });

  studioDropzone.addEventListener('drop', (event) => {
    const [file] = event.dataTransfer?.files || [];
    handleStudioUpload(file);
  });
}

function buildVibePreview() {
  const primaryMood = vibeState.moods[0] || 'cinematic';
  const inspiration = document.querySelector('#track-inspiration')?.value.trim() || '';
  const identity = document.querySelector('#track-identity')?.value.trim() || '';
  const references = document.querySelector('#track-inspirations')?.value.trim() || '';

  const summaries = {
    cinematic: 'Strong late-night cinematic energy with immersive spacing and reflective tension.',
    soulful: 'Soulful phrasing energy with warmth, patience, and emotional pull.',
    nostalgic: 'Memory-rich atmosphere with reflective movement and familiar emotional color.',
    dark: 'Dark, controlled pressure with texture doing real storytelling work.',
    uplifting: 'Forward motion with emotional lift and a sense of earned release.',
    dreamy: 'Floating atmosphere with softness, glow, and inward momentum.',
    experimental: 'Risk-friendly movement with a clear instinct for surprising turns.',
    aggressive: 'Direct, performance-ready energy with strong pockets and intent.',
    atmospheric: 'Wide atmospheric framing with room for mood and subtle transitions.',
  };

  const traits = [...new Set([
    primaryMood,
    vibeState.trackState === 'just an idea' ? 'seed-stage identity' : vibeState.trackState,
    identity.length > 60 ? 'self-aware direction' : 'instinctive identity',
    references ? 'story-aware influences' : 'original center',
  ])].slice(0, 4);

  const insights = {
    cinematic: 'Your sound leans toward emotional atmosphere and spacious transitions rather than overwhelming complexity.',
    soulful: 'Your strongest instinct seems to be letting warmth and feeling lead before anything flashy takes over.',
    nostalgic: 'There is a reflective emotional pull here that feels lived-in instead of borrowed.',
    dark: 'You appear to trust tension, shadow, and restraint in a way that gives the idea its own gravity.',
    uplifting: 'The energy feels like it wants to carry the listener somewhere brighter without losing sincerity.',
    dreamy: 'Your direction seems to value softness, drift, and immersion more than obvious force.',
    experimental: 'The identity here feels strongest when the track takes a risk without losing its emotional center.',
    aggressive: 'The pressure in the idea feels controlled, which gives the energy more personality than simple loudness.',
    atmospheric: 'The sense of space is doing real emotional work, not just decorating the record.',
  };

  previewVibeSummary.textContent = inspiration.length > 40
    ? `${summaries[primaryMood]} The story behind it already feels present in the way the mood lands.`
    : summaries[primaryMood];

  previewSupportiveInsight.textContent = identity.length > 70
    ? `${insights[primaryMood]} The way you described what makes it yours suggests strong creative self-awareness.`
    : insights[primaryMood];

  if (previewTraits) {
    previewTraits.innerHTML = '';
    traits.forEach((trait) => {
      const element = document.createElement('span');
      element.textContent = trait;
      previewTraits.appendChild(element);
    });
  }

  previewEnergyBars.forEach((bar, index) => {
    const baseSeed = 36 + ((primaryMood.charCodeAt(index % primaryMood.length) + index * 9) % 46);
    bar.dataset.base = String(baseSeed);
    bar.style.height = `${baseSeed}%`;
  });
}

if (vibeAnalyzeButton && vibeLoading && vibeLoadingText && vibeResultsPreview) {
  vibeAnalyzeButton.addEventListener('click', () => {
    if (!vibeState.uploadedFile) {
      studioFileCopy.textContent = 'Start by bringing a beat, demo, or rough idea into the space first.';
      return;
    }

    vibeResultsPreview.classList.remove('is-visible');
    vibeLoading.classList.add('is-visible');
    vibeAnalyzeButton.disabled = true;

    let index = 0;
    vibeLoadingText.textContent = loadingMessages[0];

    const rotate = window.setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      vibeLoadingText.textContent = loadingMessages[index];
    }, 720);

    window.setTimeout(() => {
      window.clearInterval(rotate);
      buildVibePreview();
      vibeLoading.classList.remove('is-visible');
      vibeResultsPreview.classList.add('is-visible');
      vibeAnalyzeButton.disabled = false;

      vibeResultsPreview.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }, reduceMotion ? 300 : 3400);
  });
}

if (earlyAccessForm && formNote) {
  earlyAccessForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const emailInput = earlyAccessForm.querySelector('input[name="email"]');
    const roleInput = earlyAccessForm.querySelector('select[name="role"]');
    const email = emailInput ? emailInput.value.trim() : '';
    const role = roleInput ? roleInput.value : 'Artist';

    if (!email) {
      formNote.textContent = 'Add an email so we know where to send early-access updates.';
      formNote.classList.remove('is-success');
      return;
    }

    formNote.textContent = `Saved for the NovaTone early-access list: ${role.toLowerCase()} updates will be shaped around real creator feedback.`;
    formNote.classList.add('is-success');
    earlyAccessForm.reset();
  });
}
