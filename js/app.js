/**
 * InfraMindTech — Main Application Script
 * Intelligent Infrastructure. Secure Future.
 */

(function () {
  'use strict';

  /* ---- Theme (Dark Mode) ---- */
  const THEME_KEY = 'imt-theme';
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      }
    }
  }

  setTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---- Sticky Navbar ---- */
  const navbar = document.querySelector('.navbar-imt');

  function handleNavbarScroll() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  /* ---- Mobile Navigation ---- */
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileOverlay = document.getElementById('mobileNavOverlay');
  const mobileNavClose = document.getElementById('mobileNavClose');

  function openMobileNav() {
    mobileNav?.classList.add('active');
    mobileOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    mobileNav?.classList.remove('active');
    mobileOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  navToggle?.addEventListener('click', openMobileNav);
  mobileNavClose?.addEventListener('click', closeMobileNav);
  mobileOverlay?.addEventListener('click', closeMobileNav);

  mobileNav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  /* ---- Back to Top ---- */
  const backToTop = document.getElementById('backToTop');

  function handleBackToTop() {
    if (!backToTop) return;
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }

  window.addEventListener('scroll', handleBackToTop, { passive: true });
  handleBackToTop();

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---- Statistics Counter ---- */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => {
    counterObserver.observe(el);
  });

  /* ---- FAQ Accordion ---- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isActive = item.classList.contains('active');

      document.querySelectorAll('.faq-item.active').forEach(active => {
        active.classList.remove('active');
      });

      if (!isActive) item.classList.add('active');
    });
  });

  /* ---- Contact Form ---- */
  const contactForm = document.getElementById('contactForm');

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Message Sent!';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      contactForm.reset();
    }, 3000);
  });

  /* ---- Active Nav Link ---- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links-imt a, .mobile-nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ---- AOS Init ---- */
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }

  /* ---- GSAP Hero Animations ---- */
  const heroSection = document.querySelector('.hero');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealHeroContent() {
    if (!heroSection) return;
    gsap.set(
      '.hero-badge, .hero-title, .hero-subtitle, .hero-tags .hero-tag, .hero-cta .btn-imt, .hero-stats .hero-stat, .hero-main-card, .hero-float-card',
      { clearProps: 'all' }
    );
  }

  if (heroSection && typeof gsap !== 'undefined' && !prefersReducedMotion) {
    const heroTl = gsap.timeline({
      defaults: { ease: 'power3.out', duration: 0.6 },
      onComplete: revealHeroContent
    });

    const fadeUp = { opacity: 0, y: 24 };
    const fadeIn = { opacity: 1, y: 0 };

    heroTl
      .fromTo('.hero-badge', fadeUp, { ...fadeIn, duration: 0.5 })
      .fromTo('.hero-title', { opacity: 0, y: 30 }, { ...fadeIn, duration: 0.7 }, '-=0.25')
      .fromTo('.hero-subtitle', fadeUp, fadeIn, '-=0.45')
      .fromTo('.hero-tags .hero-tag', fadeUp, fadeIn, { stagger: 0.08, duration: 0.45 }, '-=0.35')
      .fromTo('.hero-cta .btn-imt', fadeUp, fadeIn, { stagger: 0.1, duration: 0.45 }, '-=0.25')
      .fromTo('.hero-stats .hero-stat', fadeUp, fadeIn, { stagger: 0.1, duration: 0.45 }, '-=0.25');

    if (document.querySelector('.hero-main-card')) {
      heroTl
        .fromTo('.hero-main-card', { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.8 }, '-=0.4')
        .fromTo('.hero-float-card', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, stagger: 0.15, duration: 0.5 }, '-=0.5');
    }

    heroTl.eventCallback('onInterrupt', revealHeroContent);

    setTimeout(revealHeroContent, 4000);

    gsap.to('.hero-shape-1', {
      x: 30, y: -20, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut'
    });
    gsap.to('.hero-shape-2', {
      x: -20, y: 30, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut'
    });
  }

  /* ---- Smooth anchor scroll for same-page links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
