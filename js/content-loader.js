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
    if (!content.stats_band && content.home) {
      var legacy = [];
      for (var i = 1; i <= 4; i++) {
        var value = content.home['statsBand' + i + 'Value'];
        var label = content.home['statsBand' + i + 'Label'];
        if (value || label) legacy.push({ value: value || '', label: label || '' });
      }
      if (legacy.length) content.stats_band = legacy;
    }

    applyPageTitles(content);

    document.querySelectorAll('[data-cms]').forEach(el => {
      const key = el.getAttribute('data-cms');
      if (key && key.endsWith('.pageTitle')) return;
      if (key === 'site.companyName') return;
      const val = getNestedValue(content, key);
      if (val !== undefined) el.textContent = val;
    });

    if (content.site && content.site.companyName) {
      const name = content.site.companyName;
      document.querySelectorAll('[data-cms="site.companyName"]').forEach(el => {
        if (name.includes('Mind')) {
          const parts = name.split('Mind');
          el.innerHTML = `${parts[0]}<span class="brand-highlight">Mind</span>${parts[1] || ''}`;
        } else {
          el.textContent = name;
        }
      });
    }

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
      tpl.removeAttribute('style');
      tpl.style.display = '';
      tpl.classList.add('cms-list-item');
      container.querySelectorAll(':scope > *:not([data-cms-template])').forEach(n => n.remove());

      items.forEach((item, i) => {
        const node = tpl.cloneNode(true);
        node.setAttribute('data-cms-index', String(i));
        node.removeAttribute('data-aos');
        node.classList.remove('aos-init', 'aos-animate');
        node.style.opacity = '1';
        node.style.transform = 'none';
        node.style.display = '';

        if (item.icon) {
          const iconEl = node.querySelector('.card-icon i, .product-card-header i');
          if (iconEl) iconEl.className = item.icon;
        }

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
        if (item.url && (node.matches('a') || node.tagName === 'A')) {
          node.href = item.url;
        }
        node.querySelectorAll('[data-cms-item-href]').forEach(field => {
          const fieldKey = field.getAttribute('data-cms-item-href');
          if (item[fieldKey]) field.setAttribute('href', item[fieldKey]);
        });
        if (node.hasAttribute('data-cms-item-href')) {
          const hrefKey = node.getAttribute('data-cms-item-href');
          if (item[hrefKey]) node.setAttribute('href', item[hrefKey]);
        }

        const features = item.features;
        const featureList = node.querySelector('[data-cms-features], .product-features');
        if (featureList) {
          if (Array.isArray(features) && features.length) {
            featureList.innerHTML = features.map(function (f) {
              return '<li><i class="fa-solid fa-check"></i> ' + String(f) + '</li>';
            }).join('');
            featureList.style.display = '';
          } else {
            featureList.style.display = 'none';
          }
        }

        container.appendChild(node);
      });
    });

    function visibleCmsCards(selector) {
      return Array.from(document.querySelectorAll(selector)).filter(function (card) {
        return !card.hasAttribute('data-cms-template') && !card.closest('[data-cms-template]');
      });
    }

    visibleCmsCards('[data-cms-service]').forEach((card, i) => {
      const svc = content.services_list?.[i];
      if (!svc) return;
      const title = card.querySelector('[data-cms-service-title]');
      const desc = card.querySelector('[data-cms-service-desc]');
      if (title) title.textContent = svc.title;
      if (desc) desc.textContent = svc.description;
    });

    visibleCmsCards('[data-cms-product]').forEach((card, i) => {
      const p = content.products_list?.[i];
      if (!p) return;
      const badge = card.querySelector('[data-cms-product-badge]');
      const title = card.querySelector('[data-cms-product-title]');
      const desc = card.querySelector('[data-cms-product-desc]');
      if (badge) badge.textContent = p.badge;
      if (title) title.textContent = p.title;
      if (desc) desc.textContent = p.description;
    });

    visibleCmsCards('[data-cms-stat]').forEach((card, i) => {
      const st = content.stats_band?.[i];
      if (!st) return;
      const valEl = card.querySelector('[data-cms-stat-value]');
      const lblEl = card.querySelector('[data-cms-stat-label]');
      if (valEl) valEl.textContent = st.value;
      if (lblEl) lblEl.textContent = st.label;
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
        applyHeroVideo(m.heroVideo);
      }
    }

    if (window.fixSiteLinks) window.fixSiteLinks();
    document.dispatchEvent(new CustomEvent('cmsContentApplied'));
    if (typeof window.initHeroSlider === 'function') window.initHeroSlider();
    if (typeof window.initVideoMarquee === 'function') window.initVideoMarquee();
    if (typeof AOS !== 'undefined' && typeof AOS.refreshHard === 'function') {
      try { AOS.refreshHard(); } catch (e) {}
    } else if (typeof AOS !== 'undefined' && typeof AOS.refresh === 'function') {
      try { AOS.refresh(); } catch (e2) {}
    }
  }

  function parseHeroVideoUrl(url) {
    if (!url) return null;
    var raw = String(url).trim();
    var yt = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
    if (yt) {
      return {
        type: 'embed',
        src: 'https://www.youtube.com/embed/' + yt[1] + '?autoplay=1&mute=1&loop=1&playlist=' + yt[1] + '&controls=1&rel=0&modestbranding=1'
      };
    }
    var vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeo) {
      return {
        type: 'embed',
        src: 'https://player.vimeo.com/video/' + vimeo[1] + '?autoplay=1&muted=1&loop=1&background=0'
      };
    }
    return { type: 'file', src: raw };
  }

  function applyHeroVideo(url) {
    var parsed = parseHeroVideoUrl(url);
    document.querySelectorAll('[data-cms-hero-video-slot]').forEach(function (slot) {
      var video = slot.querySelector('[data-cms-hero-video]');
      var embed = slot.querySelector('[data-cms-hero-video-embed]');
      slot.classList.remove('has-video', 'video-type-file', 'video-type-embed');
      if (!parsed) {
        if (video) { video.removeAttribute('src'); video.load && video.load(); }
        if (embed) { embed.removeAttribute('src'); }
        return;
      }
      slot.classList.add('has-video');
      if (parsed.type === 'embed') {
        slot.classList.add('video-type-embed');
        if (video) { video.removeAttribute('src'); video.load && video.load(); }
        if (embed) embed.src = parsed.src;
      } else {
        slot.classList.add('video-type-file');
        if (embed) embed.removeAttribute('src');
        if (video) {
          video.src = parsed.src;
          video.load();
        }
      }
    });
  }

  window.applyHeroVideo = applyHeroVideo;
  window.parseHeroVideoUrl = parseHeroVideoUrl;

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

  function isRemoteApi() {
    return getContentApiUrl().indexOf('http') === 0;
  }

  function fetchContent() {
    var url = getContentApiUrl() + '?v=' + Date.now();
    var attempts = 0;
    var maxAttempts = isRemoteApi() ? 5 : 2;

    function tryApi() {
      attempts += 1;
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, isRemoteApi() ? 45000 : 20000);
      var opts = { cache: 'no-store', signal: controller.signal };
      if (isRemoteApi()) opts.mode = 'cors';

      return fetch(url, opts)
        .then(function (r) {
          clearTimeout(timeout);
          if (!r.ok) throw new Error('API ' + r.status);
          return r.json();
        })
        .catch(function () {
          clearTimeout(timeout);
          if (attempts < maxAttempts) {
            return new Promise(function (resolve) {
              setTimeout(resolve, 3000);
            }).then(tryApi);
          }
          throw new Error('API unavailable');
        });
    }

    return tryApi().catch(function () {
      if (isRemoteApi()) {
        console.warn('CMS API unavailable — showing cached site content. Refresh again in a moment.');
      }
      return fetch('data/content.json?v=' + Date.now(), { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('Static content unavailable');
          return r.json();
        });
    });
  }

  function loadContent() {
    fetchContent()
      .then(applyContent)
      .catch(function () {});
  }

  window.loadCmsContent = loadContent;
  window.applyCmsContent = applyContent;

  function bootContent() {
    if (document.getElementById('site-header')) {
      document.addEventListener('includesLoaded', loadContent, { once: true });
    } else {
      loadContent();
    }

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) loadContent();
    });
  }

  bootContent();
})();
