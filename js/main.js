const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const menuToggle = document.querySelector('.nt-menu-toggle');
const mobileNav = document.querySelector('.nt-nav');
const revealItems = document.querySelectorAll('.reveal');
const interactiveCards = document.querySelectorAll('.interactive-card');
const allWaveBars = document.querySelectorAll('.wave-bar, .nt-page-wave-bars span, .nt-mini-wave span');
const ambientNodes = document.querySelectorAll('.ambient');
const samePageLinks = document.querySelectorAll('a[href^="#"], .button[href*="#"], .nt-cta[href*="#"]');

function closeMenu() {
  mobileNav?.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

samePageLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href || !href.includes('#')) {
      return;
    }

    const [path, hash] = href.split('#');
    if (path && path.length > 0 && !location.pathname.endsWith(path)) {
      return;
    }

    if (!hash) {
      return;
    }

    const target = document.getElementById(hash);
    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    closeMenu();
  });
});

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) {
      closeMenu();
    }
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
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

if (!reduceMotion) {
  interactiveCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 768) {
        return;
      }

      const rect = card.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const rotateY = ((offsetX / rect.width) - 0.5) * 7;
      const rotateX = ((offsetY / rect.height) - 0.5) * -7;

      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

if (!reduceMotion && allWaveBars.length) {
  const animateWaveforms = () => {
    allWaveBars.forEach((bar, index) => {
      const base = Number(bar.dataset.base || 50);
      const variance = Math.round(Math.sin(Date.now() / 540 + index * 0.6) * 10);
      const nextHeight = Math.max(18, Math.min(96, base + variance));
      bar.style.height = `${nextHeight}%`;
    });
  };

  animateWaveforms();
  window.setInterval(animateWaveforms, 520);
} else {
  allWaveBars.forEach((bar) => {
    const base = Number(bar.dataset.base || 50);
    bar.style.height = `${base}%`;
  });
}

if (!reduceMotion && ambientNodes.length) {
  window.addEventListener('pointermove', (event) => {
    const xRatio = (event.clientX / window.innerWidth) - 0.5;
    const yRatio = (event.clientY / window.innerHeight) - 0.5;

    ambientNodes.forEach((node, index) => {
      const strength = index === 0 ? 18 : 12;
      const x = xRatio * strength * (index % 2 === 0 ? 1 : -1);
      const y = yRatio * strength;
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  });
}

const optionRows = document.querySelectorAll('.option-row');
optionRows.forEach((row) => {
  const buttons = row.querySelectorAll('.option-pill');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((entry) => entry.classList.remove('is-selected'));
      button.classList.add('is-selected');
    });
  });
});
