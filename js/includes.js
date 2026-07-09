/**
 * InfraMindTech — Shared Header & Footer Loader
 */
(function () {
  'use strict';

  const PAGE_MAP = {
    'index.html': 'home',
    '': 'home',
    'services.html': 'services',
    'products.html': 'products',
    'about.html': 'about',
    'contact.html': 'contact'
  };

  function getCurrentPage() {
    const file = window.location.pathname.split('/').pop() || 'index.html';
    return document.body.dataset.page || PAGE_MAP[file] || '';
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

  function getBasePath() {
    const path = window.location.pathname;
    if (path.endsWith('/')) return path;
    const lastSlash = path.lastIndexOf('/');
    return lastSlash >= 0 ? path.substring(0, lastSlash + 1) : '/';
  }

  async function loadPartial(url) {
    const res = await fetch(getBasePath() + url);
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
