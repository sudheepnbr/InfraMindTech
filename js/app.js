/**
 * InfraMindTech — Main Application Script
 */

(function () {
  'use strict';

  function initApp() {
  const cmsPreview = window.self !== window.top || window.CMS_EDIT_MODE || /[?&]cms-edit=1/.test(window.location.search);

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

  if (cmsPreview) {
    document.querySelectorAll('[data-aos]').forEach(el => {
      el.removeAttribute('data-aos');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    if (typeof gsap !== 'undefined') {
      gsap.set('.hero-title, .hero-subtitle, .hero-main-card, .hero-float-card, .hero-tags .hero-tag, .hero-cta .btn-imt, .hero-stats .hero-stat', { opacity: 1, x: 0, y: 0, scale: 1, clearProps: 'all' });
    }
  }

  /* ---- AOS Init ---- */
  if (!cmsPreview && typeof AOS !== 'undefined') {
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

  if (!cmsPreview && heroSection && typeof gsap !== 'undefined' && !prefersReducedMotion) {
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

  /* ---- Page navigation & transitions ---- */
  function isHomePage() {
    return document.body.dataset.page === 'home';
  }

  document.querySelectorAll('[data-nav], .navbar-brand-imt').forEach(link => {
    link.addEventListener('click', () => closeMobileNav());
  });

  if (!isHomePage()) {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.body.classList.add('page-enter');
  }

  if (isHomePage() && window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  } /* end initApp */

  function initHeroSlider() {
    var slider = document.querySelector('[data-cms-hero-slider]');
    if (!slider) return;
    var track = slider.querySelector('.hero-slider-track');
    if (!track) return;
    var slides = Array.prototype.filter.call(track.children, function (el) {
      return !el.hasAttribute('data-cms-template');
    });
    if (!slides.length) return;

    var index = 0;
    var dotsWrap = slider.querySelector('.hero-slider-dots');
    var prevBtn = slider.querySelector('.hero-slider-btn.prev');
    var nextBtn = slider.querySelector('.hero-slider-btn.next');
    var timer = null;

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      if (dotsWrap) {
        dotsWrap.querySelectorAll('button').forEach(function (btn, bi) {
          btn.classList.toggle('active', bi === index);
        });
      }
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        if (i === 0) btn.classList.add('active');
        btn.addEventListener('click', function () {
          goTo(i);
          restart();
        });
        dotsWrap.appendChild(btn);
      });
    }

    if (prevBtn) prevBtn.onclick = function () { goTo(index - 1); restart(); };
    if (nextBtn) nextBtn.onclick = function () { goTo(index + 1); restart(); };

    function restart() {
      clearInterval(timer);
      if (slides.length > 1) {
        timer = setInterval(function () { goTo(index + 1); }, 5000);
      }
    }

    goTo(0);
    restart();
  }

  function initVideoMarquee() {
    var track = document.querySelector('.hero-video-marquee .marquee-track');
    if (!track) return;
    var cards = Array.prototype.filter.call(track.children, function (el) {
      return !el.hasAttribute('data-cms-template');
    });
    if (!cards.length) return;

    // Remove previous clones
    track.querySelectorAll('[data-marquee-clone]').forEach(function (n) { n.remove(); });

    // Duplicate for seamless loop
    cards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('data-marquee-clone', '1');
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    // Auto YouTube thumbs if missing
    track.querySelectorAll('.marquee-card').forEach(function (card) {
      var href = card.getAttribute('href') || '';
      var img = card.querySelector('img');
      var m = href.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
      if (m && img && (!img.getAttribute('src') || img.getAttribute('src').indexOf('hero-datacenter') >= 0)) {
        img.src = 'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg';
      }
    });
  }

  window.initHeroSlider = initHeroSlider;
  window.initVideoMarquee = initVideoMarquee;

  function boot() {
    if (document.getElementById('site-header')) {
      document.addEventListener('includesLoaded', initApp, { once: true });
    } else {
      initApp();
    }
    document.addEventListener('cmsContentApplied', function () {
      initHeroSlider();
      initVideoMarquee();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
