/**
 * InfraMindTech — CMS Content Loader
 * Loads editable content from data/content.json via API
 */
(function () {
  'use strict';

  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => {
      if (acc === undefined || acc === null) return undefined;
      if (/^\d+$/.test(key)) return acc[parseInt(key, 10)];
      return acc[key];
    }, obj);
  }

  const PAGE_TITLE_PREFIXES = {
    about: 'About ',
    services: 'Our ',
    products: 'InfraMind ',
    solutions: 'Tailored ',
    industries: 'Serving Diverse ',
    resources: 'Help & ',
    contact: 'Get in '
  };

  function renderPageTitle(h1, section, data) {
    if (!h1 || !data) return;

    if (data.pageTitleHighlight) {
      h1.innerHTML =
        `${data.pageTitleBefore || ''}<span class="text-gradient">${data.pageTitleHighlight}</span>${data.pageTitleAfter || ''}`;
      return;
    }

    const title = data.pageTitle || '';
    const prefix = data.pageTitleBefore || PAGE_TITLE_PREFIXES[section] || '';
    if (prefix && title.startsWith(prefix)) {
      h1.innerHTML = `${prefix}<span class="text-gradient">${title.slice(prefix.length)}</span>`;
      return;
    }

    if (title) h1.textContent = title;
  }

  function applyPageTitles(content) {
    ['about', 'services', 'products', 'solutions', 'industries', 'resources', 'contact'].forEach(section => {
      const data = content[section];
      if (!data) return;

      const titled = document.querySelector(`[data-cms-page-title="${section}"]`);
      if (titled) {
        renderPageTitle(titled, section, data);
        return;
      }

      const legacy = document.querySelector(`[data-cms="${section}.pageTitle"]`);
      if (legacy) {
        const h1 = legacy.closest('h1');
        if (h1) renderPageTitle(h1, section, data);
      }
    });
  }

  function applyContent(content) {
    applyPageTitles(content);

    document.querySelectorAll('[data-cms]').forEach(el => {
      const key = el.getAttribute('data-cms');
      if (key && key.endsWith('.pageTitle')) return;
      const val = getNestedValue(content, key);
      if (val !== undefined) el.textContent = val;
    });

    document.querySelectorAll('[data-cms-html]').forEach(el => {
      const val = getNestedValue(content, el.getAttribute('data-cms-html'));
      if (val !== undefined) el.innerHTML = val;
    });

    const heroTitle = document.querySelector('[data-cms-hero-title]');
    if (heroTitle && content.home) {
      const h = content.home;
      heroTitle.innerHTML =
        `${h.heroTitleBefore || ''}<span class="gradient-text">${h.heroTitleHighlight || ''}</span>${h.heroTitleAfter || ''}`;
    }

    document.querySelectorAll('[data-cms-list]').forEach(container => {
      const key = container.getAttribute('data-cms-list');
      const items = getNestedValue(content, key);
      const template = container.querySelector('[data-cms-template]');
      if (!items || !template) return;

      const tpl = template.cloneNode(true);
      tpl.removeAttribute('data-cms-template');
      tpl.style.display = '';
      container.querySelectorAll(':scope > *:not([data-cms-template])').forEach(n => n.remove());

      items.forEach((item, i) => {
        const node = tpl.cloneNode(true);
        node.querySelectorAll('[data-cms-item]').forEach(field => {
          const fieldKey = field.getAttribute('data-cms-item');
          if (item[fieldKey] !== undefined) {
            if (field.tagName === 'IMG') field.src = item[fieldKey];
            else field.textContent = item[fieldKey];
          }
        });
        node.querySelectorAll('[data-cms-item-html]').forEach(field => {
          const fieldKey = field.getAttribute('data-cms-item-html');
          if (item[fieldKey] !== undefined) field.innerHTML = item[fieldKey];
        });
        container.appendChild(node);
      });
    });

    document.querySelectorAll('[data-cms-service]').forEach((card, i) => {
      const svc = content.services_list?.[i];
      if (!svc) return;
      const title = card.querySelector('[data-cms-service-title]');
      const desc = card.querySelector('[data-cms-service-desc]');
      if (title) title.textContent = svc.title;
      if (desc) desc.textContent = svc.description;
    });

    document.querySelectorAll('[data-cms-testimonial]').forEach((card, i) => {
      const t = content.testimonials?.[i];
      if (!t) return;
      const text = card.querySelector('[data-cms-t-text]');
      const name = card.querySelector('[data-cms-t-name]');
      const role = card.querySelector('[data-cms-t-role]');
      const avatar = card.querySelector('[data-cms-t-initials]');
      if (text) text.textContent = '"' + t.text + '"';
      if (name) name.textContent = t.name;
      if (role) role.textContent = t.role;
      if (avatar) avatar.textContent = t.initials;
    });

    document.querySelectorAll('[data-cms-faq]').forEach((item, i) => {
      const f = content.faq?.[i];
      if (!f) return;
      const q = item.querySelector('[data-cms-faq-q]');
      const a = item.querySelector('[data-cms-faq-a]');
      if (q) q.childNodes[0].textContent = f.question + ' ';
      if (a) a.textContent = f.answer;
    });

    if (content.site) {
      document.querySelectorAll('meta[name="description"]').forEach(m => {
        if (content.site.metaDescription) m.content = content.site.metaDescription;
      });
    }

    if (content.header) {
      const h = content.header;
      const navLabelMap = {
        home: 'navHome',
        solutions: 'navSolutions',
        services: 'navServices',
        products: 'navProducts',
        industries: 'navIndustries',
        resources: 'navResources',
        about: 'navAbout',
        contact: 'navContact'
      };
      document.querySelectorAll('[data-nav]').forEach(link => {
        const labelKey = navLabelMap[link.dataset.nav];
        if (labelKey && h[labelKey]) link.textContent = h[labelKey];
      });
      document.querySelectorAll('.nav-actions-imt .btn-imt-primary, .mobile-nav-cta .btn-imt-primary').forEach(btn => {
        if (h.ctaButton) btn.textContent = h.ctaButton;
        if (h.ctaLink && window.resolveSiteUrl) btn.href = window.resolveSiteUrl(h.ctaLink);
      });
      document.querySelectorAll('.brand-icon i').forEach(icon => {
        if (!h.logoIcon) return;
        const cls = h.logoIcon.startsWith('fa-') ? h.logoIcon : 'fa-' + h.logoIcon;
        icon.className = cls.startsWith('fa-solid') || cls.startsWith('fa-brands') ? cls : 'fa-solid ' + cls;
      });
    }

    if (content.footer) {
      const f = content.footer;
      const footerDesc = document.querySelector('[data-cms="footer.description"]');
      if (footerDesc && f.description) footerDesc.textContent = f.description;
      document.querySelectorAll('[data-cms-href]').forEach(a => {
        const key = a.getAttribute('data-cms-href');
        const val = getNestedValue(content, key);
        if (val) a.href = val;
      });
      const socialMap = { linkedin: '.footer-social a[aria-label="LinkedIn"]', twitter: '.footer-social a[aria-label="Twitter"]', facebook: '.footer-social a[aria-label="Facebook"]', youtube: '.footer-social a[aria-label="YouTube"]' };
      Object.entries(socialMap).forEach(([key, sel]) => {
        document.querySelectorAll(sel).forEach(a => { if (f[key]) a.href = f[key]; });
      });
    }

    if (content.media) {
      const m = content.media;
      if (m.favicon) {
        let link = document.querySelector('link[rel="icon"]');
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = m.favicon;
      }
      if (m.logo) {
        document.querySelectorAll('[data-cms-logo]').forEach(img => {
          img.src = m.logo;
          img.style.display = 'block';
        });
        document.querySelectorAll('.brand-icon').forEach(el => { el.style.display = 'none'; });
      }
      if (m.logoIcon) {
        document.querySelectorAll('[data-cms-logo-icon]').forEach(img => {
          img.src = m.logoIcon;
          img.style.display = 'block';
        });
      }
      if (m.heroImage) {
        document.querySelectorAll('[data-cms-hero-image]').forEach(img => { img.src = m.heroImage; img.style.display = 'block'; });
      }
      if (m.heroVideo) {
        document.querySelectorAll('[data-cms-hero-video]').forEach(v => { v.src = m.heroVideo; v.style.display = 'block'; });
      }
    }

    if (window.fixSiteLinks) window.fixSiteLinks();
  }

  function getContentApiUrl() {
    var host = window.location.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'inframindtech.onrender.com'
    ) {
      return '/api/content';
    }
    return 'https://inframindtech.onrender.com/api/content';
  }

  function loadContent() {
    fetch(getContentApiUrl())
      .then(r => r.json())
      .then(applyContent)
      .catch(() => {
        fetch('data/content.json')
          .then(r => r.json())
          .then(applyContent)
          .catch(() => {});
      });
  }

  function bootContent() {
    if (document.getElementById('site-header')) {
      document.addEventListener('includesLoaded', loadContent, { once: true });
    } else {
      loadContent();
    }
  }

  bootContent();
})();
