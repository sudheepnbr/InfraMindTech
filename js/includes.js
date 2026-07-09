/**
 * InfraMindTech — Shared Header & Footer Loader
 */
(function () {
  'use strict';

  const PAGE_NAMES = ['about', 'services', 'products', 'contact'];

  function getCurrentPage() {
    if (document.body.dataset.page) return document.body.dataset.page;

    const segments = window.location.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || '';

    if (!last || last === 'index.html' || last === 'InfraMindTech') return 'home';
    if (PAGE_NAMES.includes(last)) return last;
    if (last === 'index.html' && segments.length >= 2 && PAGE_NAMES.includes(segments[segments.length - 2])) {
      return segments[segments.length - 2];
    }

    return '';
  }

  function setActiveNav() {
    const page = getCurrentPage();
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.classList.toggle('active', link.dataset.nav === page);
    });
  }

  function initNavbarState() {
    const page = getCurrentPage();
    const navbar = document.getElementById('mainNavbar');
    if (navbar && page !== 'home') {
      navbar.classList.add('scrolled');
    }
    if (page !== 'home') {
      document.body.classList.add('page-inner');
    }
  }

  function getSiteRoot() {
    return window.SITE_ROOT || '/';
  }

  async function loadPartial(url) {
    const res = await fetch(getSiteRoot() + url);
    if (!res.ok) throw new Error('Failed to load ' + url);
    return res.text();
  }

  async function loadIncludes() {
    const headerEl = document.getElementById('site-header');
    const footerEl = document.getElementById('site-footer');
    if (!headerEl || !footerEl) return;

    try {
      const [header, footer] = await Promise.all([
        loadPartial('partials/header.html'),
        loadPartial('partials/footer.html')
      ]);
      headerEl.innerHTML = header;
      footerEl.innerHTML = footer;
      setActiveNav();
      initNavbarState();
      document.dispatchEvent(new CustomEvent('includesLoaded'));
    } catch (err) {
      console.warn('Includes load failed:', err);
      document.dispatchEvent(new CustomEvent('includesLoaded'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadIncludes);
  } else {
    loadIncludes();
  }
})();
