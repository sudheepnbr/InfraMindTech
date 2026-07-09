/**
 * Visual edit mode — runs inside site preview (iframe or ?cms-edit=1)
 */
(function () {
  'use strict';

  if (window.self === window.top && !/[?&]cms-edit=1/.test(window.location.search)) return;

  var NAV_KEYS = {
    home: 'header.navHome',
    solutions: 'header.navSolutions',
    services: 'header.navServices',
    products: 'header.navProducts',
    industries: 'header.navIndustries',
    resources: 'header.navResources',
    about: 'header.navAbout',
    contact: 'header.navContact'
  };

  var activeEl = null;
  var bound = false;

  function notify(payload) {
    var msg = Object.assign({ source: 'cms-preview' }, payload);
    if (msg.editType && !msg.type) msg.type = 'cms-select';
    try {
      if (window.parent.openCmsEdit) window.parent.openCmsEdit(msg);
    } catch (e) {}
    try {
      window.parent.postMessage(msg, '*');
    } catch (e2) {}
  }

  function labelFor(el) {
    return el.getAttribute('data-cms-label') || el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 40) || 'Content';
  }

  function markEditable(el) {
    if (el) el.classList.add('cms-editable');
  }

  function resolveTarget(el) {
    if (!el || el.closest('#cms-edit-styles')) return null;

    var imgEl = el.closest('img[data-cms-logo-icon], img[data-cms-logo], img[data-cms-hero-image]');
    if (imgEl) {
      var ikey = 'media.logoIcon';
      if (imgEl.hasAttribute('data-cms-logo')) ikey = 'media.logo';
      if (imgEl.hasAttribute('data-cms-hero-image')) ikey = 'media.heroImage';
      return {
        el: imgEl,
        payload: { editType: 'image', key: ikey, label: 'Image / Logo', value: imgEl.getAttribute('src') || '' }
      };
    }

    var hero = el.closest('[data-cms-hero-title]');
    if (hero) return { el: hero, payload: { editType: 'hero', label: 'Hero Title' } };

    var pageTitle = el.closest('[data-cms-page-title]');
    if (pageTitle) {
      return {
        el: pageTitle,
        payload: { editType: 'pageTitle', section: pageTitle.getAttribute('data-cms-page-title'), label: 'Page Title' }
      };
    }

    var cms = el.closest('[data-cms]');
    if (cms) {
      var key = cms.getAttribute('data-cms');
      if (key && !key.endsWith('.pageTitle')) {
        var type = key.indexOf('media.') === 0 ? 'image' : 'text';
        var val = type === 'image' ? (cms.getAttribute('src') || cms.textContent) : cms.textContent;
        return { el: cms, payload: { editType: type, key: key, label: labelFor(cms), value: val } };
      }
    }

    var htmlEl = el.closest('[data-cms-html]');
    if (htmlEl) {
      return { el: htmlEl, payload: { editType: 'html', key: htmlEl.getAttribute('data-cms-html'), label: labelFor(htmlEl), value: htmlEl.innerHTML } };
    }

    var hrefEl = el.closest('[data-cms-href]');
    if (hrefEl) {
      return { el: hrefEl, payload: { editType: 'text', key: hrefEl.getAttribute('data-cms-href'), label: 'Link URL', value: hrefEl.getAttribute('href') || '' } };
    }

    var nav = el.closest('[data-nav]');
    if (nav && NAV_KEYS[nav.dataset.nav]) {
      return { el: nav, payload: { editType: 'text', key: NAV_KEYS[nav.dataset.nav], label: 'Nav: ' + nav.dataset.nav, value: nav.textContent } };
    }

    var svcTitle = el.closest('[data-cms-service-title]');
    if (svcTitle) {
      var card = svcTitle.closest('[data-cms-service]');
      var si = card ? Array.prototype.indexOf.call(document.querySelectorAll('[data-cms-service]'), card) : 0;
      return { el: svcTitle, payload: { editType: 'service', index: si, label: 'Service title' } };
    }

    var svcDesc = el.closest('[data-cms-service-desc]');
    if (svcDesc) {
      var card2 = svcDesc.closest('[data-cms-service]');
      var si2 = card2 ? Array.prototype.indexOf.call(document.querySelectorAll('[data-cms-service]'), card2) : 0;
      return { el: svcDesc, payload: { editType: 'service', index: si2, label: 'Service description' } };
    }

    var service = el.closest('[data-cms-service]');
    if (service) {
      var sidx = Array.prototype.indexOf.call(document.querySelectorAll('[data-cms-service]'), service);
      return { el: service, payload: { editType: 'service', index: sidx, label: 'Service card ' + (sidx + 1) } };
    }

    var testimonial = el.closest('[data-cms-testimonial]');
    if (testimonial) {
      var ti = Array.prototype.indexOf.call(document.querySelectorAll('[data-cms-testimonial]'), testimonial);
      return { el: testimonial, payload: { editType: 'testimonial', index: ti, label: 'Testimonial ' + (ti + 1) } };
    }

    var faq = el.closest('[data-cms-faq]');
    if (faq) {
      var fi = Array.prototype.indexOf.call(document.querySelectorAll('[data-cms-faq]'), faq);
      return { el: faq, payload: { editType: 'faq', index: fi, label: 'FAQ ' + (fi + 1) } };
    }

    var product = el.closest('[data-cms-product]');
    if (product) {
      var pi = Array.prototype.indexOf.call(document.querySelectorAll('[data-cms-product]'), product);
      return { el: product, payload: { editType: 'product', index: pi, label: 'Product ' + (pi + 1) } };
    }

    var cta = el.closest('.nav-actions-imt .btn-imt-primary, .mobile-nav-cta .btn-imt-primary');
    if (cta) return { el: cta, payload: { editType: 'cta', label: 'Header CTA Button' } };

    var heroVisual = el.closest('.hero-visual, .hero-float-text, .hero-main-card');
    if (heroVisual) {
      var cmsChild = heroVisual.querySelector('[data-cms]');
      if (cmsChild) {
        var ck = cmsChild.getAttribute('data-cms');
        return { el: cmsChild, payload: { editType: 'text', key: ck, label: labelFor(cmsChild), value: cmsChild.textContent } };
      }
    }

    return null;
  }

  function scanEditable() {
    var sel = [
      '[data-cms]', '[data-cms-html]', '[data-cms-href]', '[data-cms-hero-title]',
      '[data-cms-page-title]', '[data-nav]', '[data-cms-service]', '[data-cms-service-title]',
      '[data-cms-service-desc]', '[data-cms-testimonial]', '[data-cms-faq]', '[data-cms-product]',
      'img[data-cms-logo-icon]', 'img[data-cms-logo]', 'img[data-cms-hero-image]',
      '.nav-actions-imt .btn-imt-primary', '.mobile-nav-cta .btn-imt-primary'
    ].join(',');
    document.querySelectorAll(sel).forEach(markEditable);
  }

  function disableBlockingLayers() {
    document.querySelectorAll('.mobile-nav-overlay, .mobile-nav').forEach(function (el) {
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    });
    document.querySelectorAll('[data-aos]').forEach(function (el) {
      el.removeAttribute('data-aos');
      el.classList.remove('aos-animate');
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.pointerEvents = 'auto';
    });
    if (typeof gsap !== 'undefined') {
      gsap.set('.hero-title, .hero-subtitle, .hero-main-card, .hero-float-card, .hero-tags .hero-tag, .hero-cta .btn-imt, .hero-stats .hero-stat', {
        opacity: 1, x: 0, y: 0, scale: 1, clearProps: 'all'
      });
    }
  }

  function bindEditMode() {
    if (bound) {
      scanEditable();
      disableBlockingLayers();
      return;
    }
    bound = true;

    if (!document.getElementById('cms-edit-styles')) {
      var css = document.createElement('style');
      css.id = 'cms-edit-styles';
      css.textContent = [
        'body.cms-edit-mode { cursor: default; }',
        'body.cms-edit-mode .hero-bg-shapes, body.cms-edit-mode .hero-grid, body.cms-edit-mode .hero-shape { pointer-events: none !important; }',
        'body.cms-edit-mode .hero-content, body.cms-edit-mode .hero-visual, body.cms-edit-mode .hero-main-card, body.cms-edit-mode .hero-float-card { pointer-events: auto !important; position: relative; z-index: 5; }',
        'body.cms-edit-mode .cms-editable, body.cms-edit-mode [data-cms], body.cms-edit-mode [data-cms-hero-title], body.cms-edit-mode img[data-cms-logo-icon] { cursor: pointer !important; }',
        '.cms-editable.cms-edit-highlight, [data-cms].cms-edit-highlight, img.cms-edit-highlight { outline: 2px dashed #2563EB !important; outline-offset: 3px !important; cursor: pointer !important; }',
        '.cms-editable.cms-edit-active, [data-cms].cms-edit-active, img.cms-edit-active { outline: 2px solid #2563EB !important; outline-offset: 3px !important; box-shadow: 0 0 0 4px rgba(37,99,235,0.15) !important; }',
        'body.cms-edit-mode img[data-cms-logo-icon]::after { content: "Click to change image"; }'
      ].join('\n');
      document.head.appendChild(css);
    }

    document.body.classList.add('cms-edit-mode');
    disableBlockingLayers();
    scanEditable();

    document.documentElement.addEventListener('mouseover', function (e) {
      var hit = resolveTarget(e.target);
      document.querySelectorAll('.cms-edit-highlight').forEach(function (n) {
        if (n !== activeEl) n.classList.remove('cms-edit-highlight');
      });
      if (hit && hit.el !== activeEl) {
        markEditable(hit.el);
        hit.el.classList.add('cms-edit-highlight');
      }
    }, true);

    document.documentElement.addEventListener('click', function (e) {
      var hit = resolveTarget(e.target);
      if (hit) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (activeEl) activeEl.classList.remove('cms-edit-active');
        activeEl = hit.el;
        markEditable(hit.el);
        hit.el.classList.add('cms-edit-active');
        hit.el.classList.remove('cms-edit-highlight');
        notify(hit.payload);
        return;
      }

      var a = e.target.closest('a');
      if (a) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var href = a.getAttribute('href') || '';
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          notify({ type: 'cms-navigate', href: href });
        }
      }
    }, true);

    document.addEventListener('submit', function (e) { e.preventDefault(); }, true);

    notify({ type: 'cms-ready' });
  }

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'cms-update-dom') applyDomUpdates(e.data.updates || []);
    if (e.data && e.data.type === 'cms-reload-content' && e.data.content) {
      if (window.applyCmsContent) window.applyCmsContent(e.data.content);
      else bindEditMode();
    }
  });

  function applyDomUpdates(updates) {
    updates.forEach(function (u) {
      if (u.editType === 'hero' && u.fields) {
        var hero = document.querySelector('[data-cms-hero-title]');
        if (hero) hero.innerHTML = (u.fields.before || '') + '<span class="gradient-text">' + (u.fields.highlight || '') + '</span>' + (u.fields.after || '');
        return;
      }
      if (u.editType === 'pageTitle' && u.fields && u.section) {
        var h1 = document.querySelector('[data-cms-page-title="' + u.section + '"]');
        if (h1) h1.innerHTML = (u.fields.before || '') + '<span class="text-gradient">' + (u.fields.highlight || '') + '</span>' + (u.fields.after || '');
        return;
      }
      if (u.key) {
        document.querySelectorAll('[data-cms="' + u.key + '"]').forEach(function (el) {
          if (el.tagName === 'IMG') el.src = u.value;
          else el.textContent = u.value;
        });
        document.querySelectorAll('[data-cms-html="' + u.key + '"]').forEach(function (el) { el.innerHTML = u.value; });
        document.querySelectorAll('[data-cms-href="' + u.key + '"]').forEach(function (el) { el.setAttribute('href', u.value); });
        if (u.key.indexOf('media.') === 0 || u.editType === 'image') {
          document.querySelectorAll('img[data-cms-logo-icon], img[data-cms-logo], img[data-cms-hero-image]').forEach(function (img) {
            if (u.key === 'media.logoIcon' && img.hasAttribute('data-cms-logo-icon')) img.src = u.value;
            if (u.key === 'media.logo' && img.hasAttribute('data-cms-logo')) img.src = u.value;
            if (u.key === 'media.heroImage' && img.hasAttribute('data-cms-hero-image')) img.src = u.value;
          });
        }
      }
      if (u.editType === 'service' && u.item) {
        var card = document.querySelectorAll('[data-cms-service]')[u.index];
        if (card) {
          var t = card.querySelector('[data-cms-service-title]');
          var d = card.querySelector('[data-cms-service-desc]');
          if (t) t.textContent = u.item.title || '';
          if (d) d.textContent = u.item.description || '';
        }
      }
      if (u.editType === 'testimonial' && u.item) {
        var tc = document.querySelectorAll('[data-cms-testimonial]')[u.index];
        if (tc) {
          var text = tc.querySelector('[data-cms-t-text]');
          var name = tc.querySelector('[data-cms-t-name]');
          var role = tc.querySelector('[data-cms-t-role]');
          var initials = tc.querySelector('[data-cms-t-initials]');
          if (text) text.textContent = '"' + (u.item.text || '') + '"';
          if (name) name.textContent = u.item.name || '';
          if (role) role.textContent = u.item.role || '';
          if (initials) initials.textContent = u.item.initials || '';
        }
      }
      if (u.editType === 'faq' && u.item) {
        var faq = document.querySelectorAll('[data-cms-faq]')[u.index];
        if (faq) {
          var q = faq.querySelector('[data-cms-faq-q]');
          var a = faq.querySelector('[data-cms-faq-a]');
          if (q && q.childNodes[0]) q.childNodes[0].textContent = (u.item.question || '') + ' ';
          if (a) a.textContent = u.item.answer || '';
        }
      }
      if (u.editType === 'product' && u.item) {
        var pc = document.querySelectorAll('[data-cms-product]')[u.index];
        if (pc) {
          var badge = pc.querySelector('[data-cms-product-badge]');
          var title = pc.querySelector('[data-cms-product-title]');
          var desc = pc.querySelector('[data-cms-product-desc]');
          if (badge) badge.textContent = u.item.badge || '';
          if (title) title.textContent = u.item.title || '';
          if (desc) desc.textContent = u.item.description || '';
        }
      }
      if (u.editType === 'cta' && u.fields) {
        document.querySelectorAll('.nav-actions-imt .btn-imt-primary, .mobile-nav-cta .btn-imt-primary').forEach(function (btn) {
          if (u.fields.text) btn.textContent = u.fields.text;
          if (u.fields.link) btn.href = u.fields.link;
        });
      }
    });
    scanEditable();
  }

  function boot() {
    bindEditMode();
    setTimeout(bindEditMode, 1200);
    setTimeout(bindEditMode, 2500);
  }

  document.addEventListener('includesLoaded', function () { setTimeout(boot, 300); });
  document.addEventListener('cmsContentApplied', function () { bindEditMode(); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 500); });
  } else {
    setTimeout(boot, 500);
  }
})();
