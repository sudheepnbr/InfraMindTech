/**
 * InfraMindTech — Main Application Script
 */

(function () {
  'use strict';

  function initApp() {
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

  /* ---- Active Nav handled by includes.js ---- */

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
      '.hero-title, .hero-subtitle, .hero-tags .hero-tag, .hero-cta .btn-imt, .hero-stats .hero-stat, .hero-main-card, .hero-float-card',
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
      .fromTo('.hero-title', { opacity: 0, y: 30 }, { ...fadeIn, duration: 0.7 })
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

  /* ---- Smooth scroll navigation ---- */
  const NAV_SECTIONS = window.NAV_ROUTES || {
    home: '#home',
    solutions: '#solutions',
    services: '#services',
    products: '#products',
    industries: '#industries',
    resources: '#faq',
    about: '#about',
    contact: '#contact'
  };

  function getNavOffset() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--navbar-height');
    return parseInt(value, 10) || 64;
  }

  function scrollToSection(selector, smooth) {
    const el = document.querySelector(selector);
    if (!el) return false;
    const top = el.getBoundingClientRect().top + window.scrollY - getNavOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: smooth === false ? 'auto' : 'smooth' });
    return true;
  }

  function isHomePage() {
    return document.body.dataset.page === 'home';
  }

  function setActiveNavItem(navKey) {
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.classList.toggle('active', link.dataset.nav === navKey);
    });
  }

  function goToHomeSection(section, smooth) {
    const root = window.SITE_ROOT || '/';
    if (isHomePage()) {
      scrollToSection(section, smooth);
      history.pushState(null, '', section);
      const navKey = Object.keys(NAV_SECTIONS).find(key => NAV_SECTIONS[key] === section) || 'home';
      setActiveNavItem(navKey);
      return;
    }
    window.location.href = window.resolveSiteUrl
      ? window.resolveSiteUrl(section)
      : root + (section.startsWith('#') ? section : '#' + section);
  }

  function handleNavClick(e) {
    const navKey = this.dataset.nav;
    if (!navKey || !NAV_SECTIONS[navKey]) return;

    e.preventDefault();
    closeMobileNav();
    goToHomeSection(NAV_SECTIONS[navKey], true);
  }

  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', handleNavClick);
  });

  document.querySelectorAll('.nav-actions-imt .btn-imt-primary, .mobile-nav-cta .btn-imt-primary').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const href = btn.getAttribute('href') || '';
      if (!href.includes('#contact')) return;
      e.preventDefault();
      closeMobileNav();
      goToHomeSection('#contact', true);
    });
  });

  document.querySelectorAll('.navbar-brand-imt').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileNav();
      goToHomeSection('#home', true);
    });
  });

  if (isHomePage()) {
    if (window.location.hash) {
      setTimeout(() => scrollToSection(window.location.hash, true), 150);
    }

    const spySections = Object.entries(NAV_SECTIONS)
      .map(([nav, selector]) => ({ nav, el: document.querySelector(selector) }))
      .filter(item => item.el);

    if (spySections.length) {
      const spyObserver = new IntersectionObserver((entries) => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const match = spySections.find(item => item.el === visible[0].target);
        if (match) setActiveNavItem(match.nav);
      }, {
        rootMargin: `-${getNavOffset() + 8}px 0px -55% 0px`,
        threshold: [0.1, 0.35, 0.6]
      });

      spySections.forEach(item => spyObserver.observe(item.el));
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    if (anchor.dataset.nav || anchor.classList.contains('navbar-brand-imt')) return;
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      if (!isHomePage()) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      scrollToSection(targetId, true);
      history.pushState(null, '', targetId);
    });
  });

  } /* end initApp */

  function boot() {
    if (document.getElementById('site-header')) {
      document.addEventListener('includesLoaded', initApp, { once: true });
    } else {
      initApp();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
