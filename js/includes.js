/**
 * InfraMindTech — Shared Header & Footer Loader
 */
(function () {
  'use strict';

  const PAGE_NAMES = ['about', 'services', 'products', 'contact'];

  const NAV_ROUTES = {
    home: '',
    solutions: '#solutions',
    services: 'services/',
    products: 'products/',
    industries: '#industries',
    resources: '#faq',
    about: 'about/',
    contact: 'contact/'
  };

  function getSiteRoot() {
    return window.SITE_ROOT || '/';
  }

  function resolveSiteUrl(path) {
    const root = getSiteRoot();
    if (!path) return root;
    if (path.startsWith('#')) return root + path;
    return root + path.replace(/^\//, '');
  }

  function fixSiteLinks() {
    document.querySelectorAll('[data-nav]').forEach(link => {
      const route = NAV_ROUTES[link.dataset.nav];
      if (route !== undefined) link.href = resolveSiteUrl(route);
    });

    document.querySelectorAll('.navbar-brand-imt, .footer-brand-link').forEach(link => {
      link.href = getSiteRoot();
    });

    document.querySelectorAll('.footer-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === 'services/' || href === 'products/') {
        link.href = resolveSiteUrl(href);
      }
    });

    document.querySelectorAll('.nav-actions-imt .btn-imt-primary, .mobile-nav-cta .btn-imt-primary').forEach(btn => {
      const link = btn.getAttribute('href');
      if (link && !link.startsWith('http') && !link.startsWith('#')) {
        btn.href = resolveSiteUrl(link);
      }
    });

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) return;
      if (href === './' || href === '../' || href === 'index.html') {
        link.href = getSiteRoot();
        return;
      }
      if (/^(services|products|about|contact)\/?$/.test(href)) {
        link.href = resolveSiteUrl(href.endsWith('/') ? href : href + '/');
      }
    });
  }

  window.fixSiteLinks = fixSiteLinks;
  window.resolveSiteUrl = resolveSiteUrl;

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
      fixSiteLinks();
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
