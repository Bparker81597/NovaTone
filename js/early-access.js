const navLinks = document.querySelectorAll('.site-nav a[href^="#"], .button[href^="#"], .brand[href^="#"]');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const revealItems = document.querySelectorAll('.reveal');
const waveBars = document.querySelectorAll('.wave-bar');
const applicationForm = document.querySelector('#application-form');
const formFeedback = document.querySelector('#form-feedback');
const successPanel = document.querySelector('#success-panel');
const demoSharingButtons = document.querySelectorAll('#demo-sharing .option-pill');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let demoSharing = 'Yes';

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

if (!reduceMotion && waveBars.length) {
  const animateWaveform = () => {
    waveBars.forEach((bar) => {
      const base = Number(bar.dataset.base || 50);
      const variance = Math.floor(Math.random() * 26) - 13;
      const nextHeight = Math.max(18, Math.min(96, base + variance));
      bar.style.height = `${nextHeight}%`;
    });
  };

  animateWaveform();
  window.setInterval(animateWaveform, 520);
} else {
  waveBars.forEach((bar) => {
    const base = Number(bar.dataset.base || 50);
    bar.style.height = `${base}%`;
  });
}

demoSharingButtons.forEach((button) => {
  button.addEventListener('click', () => {
    demoSharingButtons.forEach((entry) => entry.classList.remove('is-selected'));
    button.classList.add('is-selected');
    demoSharing = button.dataset.value || 'Yes';
  });
});

function validateField(element) {
  const field = element.closest('.field');
  const value = element.type === 'checkbox' ? element.checked : element.value.trim();
  const isValid = element.checkValidity() && Boolean(value);

  field?.classList.toggle('is-invalid', !isValid);
  return isValid;
}

if (applicationForm && formFeedback && successPanel) {
  const requiredElements = applicationForm.querySelectorAll('input[required], textarea[required], select[required]');

  requiredElements.forEach((element) => {
    element.addEventListener('blur', () => {
      validateField(element);
    });
  });

  applicationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    let valid = true;

    requiredElements.forEach((element) => {
      if (!validateField(element)) {
        valid = false;
      }
    });

    const consent = applicationForm.querySelector('#consent');
    if (!consent?.checked) {
      valid = false;
    }

    if (!valid) {
      formFeedback.textContent = 'Please complete the required fields so we can understand your creative perspective clearly.';
      formFeedback.classList.add('is-error');
      return;
    }

    const payload = {
      creatorName: applicationForm.querySelector('#creator-name')?.value.trim(),
      email: applicationForm.querySelector('#email')?.value.trim(),
      location: applicationForm.querySelector('#location')?.value.trim(),
      creatorType: applicationForm.querySelector('#creator-type')?.value,
      experience: applicationForm.querySelector('#experience')?.value.trim(),
      musicType: applicationForm.querySelector('#music-type')?.value.trim(),
      portfolioLink: applicationForm.querySelector('#portfolio-link')?.value.trim(),
      unfinishedDemoSharing: demoSharing,
      identity: applicationForm.querySelector('#identity')?.value.trim(),
      helpfulFeedback: applicationForm.querySelector('#helpful-feedback')?.value.trim(),
      harmfulFeedback: applicationForm.querySelector('#harmful-feedback')?.value.trim(),
      aiConcerns: applicationForm.querySelector('#ai-concerns')?.value.trim(),
      trust: applicationForm.querySelector('#trust')?.value.trim(),
      consent: true,
      submittedAt: new Date().toISOString(),
    };

    console.log('NovaTone Early Artist Test Application', payload);

    formFeedback.textContent = '';
    formFeedback.classList.remove('is-error');
    applicationForm.reset();
    demoSharing = 'Yes';
    demoSharingButtons.forEach((entry) => {
      entry.classList.toggle('is-selected', entry.dataset.value === 'Yes');
    });
    applicationForm.querySelectorAll('.field').forEach((field) => field.classList.remove('is-invalid'));
    successPanel.classList.add('is-visible');
    successPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  });
}
