/**
 * Injected into site preview iframe — click-to-edit overlays
 */
(function () {
  'use strict';

  if (window.self === window.top) return;

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

  function post(payload) {
    window.parent.postMessage(Object.assign({ source: 'cms-preview' }, payload), '*');
  }

  function labelFor(el) {
    return el.getAttribute('data-cms-label') || el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 40) || 'Content';
  }

  function bindClick(el, payloadFn) {
    el.classList.add('cms-editable');
    el.addEventListener('mouseenter', function () {
      if (activeEl !== el) el.classList.add('cms-edit-highlight');
    });
    el.addEventListener('mouseleave', function () {
      el.classList.remove('cms-edit-highlight');
    });
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (activeEl) activeEl.classList.remove('cms-edit-active');
      activeEl = el;
      el.classList.add('cms-edit-active');
      el.classList.remove('cms-edit-highlight');
      post(payloadFn(el));
    });
  }

  function init() {
    var css = document.createElement('style');
    css.textContent = [
      'body.cms-edit-mode { cursor: default; }',
      '.cms-editable.cms-edit-highlight { outline: 2px dashed #2563EB !important; outline-offset: 3px !important; cursor: pointer !important; }',
      '.cms-editable.cms-edit-active { outline: 2px solid #2563EB !important; outline-offset: 3px !important; background: rgba(37,99,235,0.07) !important; }',
      'body.cms-edit-mode a.cms-editable { pointer-events: auto; }'
    ].join('\n');
    document.head.appendChild(css);
    document.body.classList.add('cms-edit-mode');

    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var key = el.getAttribute('data-cms');
      if (!key || key.endsWith('.pageTitle')) return;
      bindClick(el, function () {
        return { editType: 'text', key: key, label: labelFor(el), value: el.textContent };
      });
    });

    document.querySelectorAll('[data-cms-html]').forEach(function (el) {
      bindClick(el, function (target) {
        return { editType: 'html', key: target.getAttribute('data-cms-html'), label: labelFor(target), value: target.innerHTML };
      });
    });

    document.querySelectorAll('[data-cms-href]').forEach(function (el) {
      bindClick(el, function (target) {
        return { editType: 'text', key: target.getAttribute('data-cms-href'), label: 'Link URL', value: target.getAttribute('href') || '' };
      });
    });

    document.querySelectorAll('[data-cms-hero-title]').forEach(function (el) {
      bindClick(el, function () {
        return { editType: 'hero', label: 'Hero Title' };
      });
    });

    document.querySelectorAll('[data-cms-page-title]').forEach(function (el) {
      bindClick(el, function (target) {
        return { editType: 'pageTitle', section: target.getAttribute('data-cms-page-title'), label: 'Page Title' };
      });
    });

    document.querySelectorAll('[data-nav]').forEach(function (el) {
      var nav = el.dataset.nav;
      if (!NAV_KEYS[nav]) return;
      bindClick(el, function () {
        return { editType: 'text', key: NAV_KEYS[nav], label: 'Nav: ' + nav, value: el.textContent };
      });
    });

    document.querySelectorAll('[data-cms-service]').forEach(function (el, i) {
      bindClick(el, function () {
        return { editType: 'service', index: i, label: 'Service card ' + (i + 1) };
      });
    });

    document.querySelectorAll('[data-cms-testimonial]').forEach(function (el, i) {
      bindClick(el, function () {
        return { editType: 'testimonial', index: i, label: 'Testimonial ' + (i + 1) };
      });
    });

    document.querySelectorAll('[data-cms-faq]').forEach(function (el, i) {
      bindClick(el, function () {
        return { editType: 'faq', index: i, label: 'FAQ ' + (i + 1) };
      });
    });

    document.querySelectorAll('#products .product-card').forEach(function (el, i) {
      bindClick(el, function () {
        return { editType: 'product', index: i, label: 'Product ' + (i + 1) };
      });
    });

    document.querySelectorAll('[data-cms-logo-icon], [data-cms-logo], [data-cms-hero-image]').forEach(function (el) {
      bindClick(el, function (target) {
        var key = 'media.logoIcon';
        if (target.hasAttribute('data-cms-logo')) key = 'media.logo';
        if (target.hasAttribute('data-cms-hero-image')) key = 'media.heroImage';
        return { editType: 'text', key: key, label: 'Image URL', value: target.getAttribute('src') || '' };
      });
    });

    document.querySelectorAll('.nav-actions-imt .btn-imt-primary, .mobile-nav-cta .btn-imt-primary').forEach(function (el) {
      bindClick(el, function () {
        return { editType: 'cta', label: 'Header CTA Button' };
      });
    });

    post({ type: 'cms-ready' });

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a || a.classList.contains('cms-editable')) return;
      e.preventDefault();
      e.stopPropagation();
      var href = a.getAttribute('href') || '';
      if (href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        post({ type: 'cms-navigate', href: href });
      }
    }, true);

    document.addEventListener('submit', function (e) {
      e.preventDefault();
    }, true);
  }

  window.addEventListener('message', function (e) {
    var data = e.data || {};
    if (data.type === 'cms-update-dom') applyDomUpdates(data.updates || []);
    if (data.type === 'cms-reload-edit') init();
  });

  function applyDomUpdates(updates) {
    updates.forEach(function (u) {
      if (u.editType === 'hero' && u.fields) {
        var hero = document.querySelector('[data-cms-hero-title]');
        if (hero) {
          hero.innerHTML = (u.fields.before || '') + '<span class="gradient-text">' + (u.fields.highlight || '') + '</span>' + (u.fields.after || '');
        }
        return;
      }
      if (u.editType === 'pageTitle' && u.fields && u.section) {
        var h1 = document.querySelector('[data-cms-page-title="' + u.section + '"]');
        if (h1) {
          h1.innerHTML = (u.fields.before || '') + '<span class="text-gradient">' + (u.fields.highlight || '') + '</span>' + (u.fields.after || '');
        }
        return;
      }
      if (u.key) {
        document.querySelectorAll('[data-cms="' + u.key + '"]').forEach(function (el) {
          el.textContent = u.value;
        });
        document.querySelectorAll('[data-cms-html="' + u.key + '"]').forEach(function (el) {
          el.innerHTML = u.value;
        });
        document.querySelectorAll('[data-cms-href="' + u.key + '"]').forEach(function (el) {
          el.setAttribute('href', u.value);
        });
        if (u.key === 'media.logoIcon' || u.key === 'media.logo' || u.key === 'media.heroImage') {
          document.querySelectorAll('[data-cms-logo-icon], [data-cms-logo], [data-cms-hero-image]').forEach(function (img) {
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
          var fields = {
            text: tc.querySelector('[data-cms-t-text]'),
            name: tc.querySelector('[data-cms-t-name]'),
            role: tc.querySelector('[data-cms-t-role]'),
            initials: tc.querySelector('[data-cms-t-initials]')
          };
          if (fields.text) fields.text.textContent = '"' + (u.item.text || '') + '"';
          if (fields.name) fields.name.textContent = u.item.name || '';
          if (fields.role) fields.role.textContent = u.item.role || '';
          if (fields.initials) fields.initials.textContent = u.item.initials || '';
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
        var pc = document.querySelectorAll('#products .product-card')[u.index];
        if (pc) {
          var badge = pc.querySelector('.product-badge');
          var title = pc.querySelector('.product-card-header h3');
          var desc = pc.querySelector('.product-card-header p');
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 600);
    });
  } else {
    setTimeout(init, 600);
  }
})();
