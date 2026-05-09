const navLinks = document.querySelectorAll('.site-nav a[href^="#"], .button[href^="#"], .brand[href^="#"]');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const interactiveCards = document.querySelectorAll('.interactive-card');
const waveformBars = document.querySelectorAll('.wave-bar');
const revealItems = document.querySelectorAll('.reveal');
const earlyAccessForm = document.querySelector('#early-access-form');
const formNote = document.querySelector('#form-note');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
