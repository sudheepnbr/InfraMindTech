/**
 * InfraMindTech — Visual CMS (click-to-edit live site preview)
 */
(function () {
  'use strict';

  var content = {};
  var dirty = false;
  var currentEdit = null;
  var previewReady = false;

  var PAGES = [
    { id: 'home', label: 'Home', url: '/', icon: 'fa-house' },
    { id: 'about', label: 'About', url: '/about/', icon: 'fa-building' },
    { id: 'services', label: 'Services', url: '/services/', icon: 'fa-cloud' },
    { id: 'products', label: 'Products', url: '/products/', icon: 'fa-box' },
    { id: 'solutions', label: 'Solutions', url: '/solutions/', icon: 'fa-lightbulb' },
    { id: 'industries', label: 'Industries', url: '/industries/', icon: 'fa-industry' },
    { id: 'resources', label: 'Resources', url: '/resources/', icon: 'fa-book' },
    { id: 'contact', label: 'Contact', url: '/contact/', icon: 'fa-envelope' }
  ];

  var FIELD_LABELS = {
    'site.companyName': 'Company Name',
    'site.tagline': 'Tagline',
    'site.logoTagline': 'Logo Tagline',
    'site.metaDescription': 'SEO Description',
    'site.phone': 'Phone',
    'site.phone2': 'Phone 2',
    'site.email': 'Email',
    'site.salesEmail': 'Sales Email',
    'site.address': 'Address',
    'site.city': 'City / Country',
    'site.hours': 'Business Hours (Weekdays)',
    'site.hoursSat': 'Business Hours (Saturday)',
    'site.copyright': 'Copyright',
    'footer.description': 'Footer Description',
    'home.heroSubtitle': 'Hero Subtitle',
    'home.ctaTitle': 'CTA Title',
    'home.ctaText': 'CTA Text'
  };

  var loginScreen = document.getElementById('loginScreen');
  var dashboard = document.getElementById('dashboard');
  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');
  var saveBtn = document.getElementById('saveBtn');
  var saveToast = document.getElementById('saveToast');
  var logoutBtn = document.getElementById('logoutBtn');
  var sitePreview = document.getElementById('sitePreview');
  var pageNav = document.getElementById('pageNav');
  var currentPageLabel = document.getElementById('currentPageLabel');
  var editDrawer = document.getElementById('editDrawer');
  var editDrawerTitle = document.getElementById('editDrawerTitle');
  var editDrawerBody = document.getElementById('editDrawerBody');
  var unsavedBadge = document.getElementById('unsavedBadge');
  var mediaBtn = document.getElementById('mediaBtn');
  var mediaModal = document.getElementById('mediaModal');
  var mediaModalBody = document.getElementById('mediaModalBody');
  var listModal = document.getElementById('listModal');
  var listModalBody = document.getElementById('listModalBody');
  var listModalTitle = document.getElementById('listModalTitle');
  var deleteEditBtn = document.getElementById('deleteEdit');

  var currentPage = PAGES[0];
  var currentListKey = null;

  var LIST_CONFIG = {
    services_list: {
      label: 'Services',
      editType: 'service',
      previewPage: 'services',
      fields: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', textarea: true },
        { key: 'icon', label: 'Icon class (e.g. fa-solid fa-cloud)' },
        { key: 'features', label: 'Features (one per line)', textarea: true, list: true }
      ],
      defaultItem: { title: 'New Service', description: 'Service description here.', icon: 'fa-solid fa-cloud', features: ['Feature one', 'Feature two', 'Feature three'] }
    },
    products_list: {
      label: 'Products',
      editType: 'product',
      previewPage: 'products',
      fields: [
        { key: 'title', label: 'Product Name' },
        { key: 'badge', label: 'Badge' },
        { key: 'description', label: 'Description', textarea: true },
        { key: 'features', label: 'Features (one per line)', textarea: true, list: true }
      ],
      defaultItem: { title: 'New Product', badge: 'Category', description: 'Product description here.', features: ['Feature one', 'Feature two', 'Feature three'] }
    },
    stats_band: {
      label: 'Stats',
      editType: 'stat',
      previewPage: 'home',
      fields: [
        { key: 'value', label: 'Number (e.g. 500+)' },
        { key: 'label', label: 'Label' }
      ],
      defaultItem: { value: '100+', label: 'New Stat' }
    },
    faq: {
      label: 'FAQs',
      editType: 'faq',
      previewPage: 'resources',
      fields: [
        { key: 'question', label: 'Question', textarea: true },
        { key: 'answer', label: 'Answer', textarea: true }
      ],
      defaultItem: { question: 'New question?', answer: 'Answer here.' }
    }
  };

  function getNested(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      if (acc == null) return undefined;
      if (/^\d+$/.test(key)) return acc[parseInt(key, 10)];
      return acc[key];
    }, obj);
  }

  function setNested(obj, path, value) {
    var keys = path.split('.');
    var cur = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      var k = keys[i];
      if (cur[k] == null) cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
  }

  function humanLabel(key) {
    return FIELD_LABELS[key] || key.replace(/\./g, ' › ').replace(/_/g, ' ');
  }

  async function api(url, options) {
    options = options || {};
    var res = await fetch(url, Object.assign({
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    }, options));
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function showLogin() {
    loginScreen.classList.remove('is-hidden');
    dashboard.classList.add('is-hidden');
    document.body.classList.remove('admin-logged-in');
    document.body.classList.add('admin-login');
  }

  function showDashboard() {
    loginScreen.classList.add('is-hidden');
    dashboard.classList.remove('is-hidden');
    document.body.classList.add('admin-logged-in');
    document.body.classList.remove('admin-login');
    loadContent().then(function () {
      buildPageNav();
      loadPreviewPage(currentPage);
    });
  }

  function setDirty(val) {
    dirty = val;
    unsavedBadge.classList.toggle('is-hidden', !dirty);
    saveBtn.classList.toggle('btn-save-pulse', dirty);
  }

  function showToast(msg) {
    saveToast.innerHTML = '<i class="fa-solid fa-check-circle"></i> ' + msg;
    saveToast.classList.remove('is-hidden');
    setTimeout(function () { saveToast.classList.add('is-hidden'); }, 3500);
  }

  async function loadContent() {
    content = await api('/api/content');
    setDirty(false);
  }

  function buildPageNav() {
    pageNav.innerHTML = PAGES.map(function (p) {
      return '<button type="button" class="nav-item' + (p.id === currentPage.id ? ' active' : '') + '" data-page="' + p.id + '">' +
        '<i class="fa-solid ' + p.icon + '"></i> ' + p.label + '</button>';
    }).join('');

    pageNav.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var page = PAGES.find(function (p) { return p.id === btn.dataset.page; });
        if (page) switchPage(page);
      });
    });
  }

  function switchPage(page) {
    currentPage = page;
    currentPageLabel.textContent = page.label;
    pageNav.querySelectorAll('.nav-item').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.page === page.id);
    });
    closeDrawer();
    loadPreviewPage(page);
  }

  function injectEditScript() {
    try {
      var doc = sitePreview.contentDocument;
      if (!doc || !doc.body) return;
      if (doc.getElementById('cms-edit-inject')) return;
      var script = doc.createElement('script');
      script.id = 'cms-edit-inject';
      script.src = '/admin/edit-inject.js?v=11';
      doc.body.appendChild(script);
    } catch (err) {
      console.warn('Cannot inject edit script:', err);
    }
  }

  function loadPreviewPage(page) {
    previewReady = false;
    sitePreview.src = page.url + (page.url.indexOf('?') >= 0 ? '&' : '?') + 'cms-edit=1';
  }

  sitePreview.addEventListener('load', function () {
    injectEditScript();
  });

  function resolvePageFromHref(href) {
    var path = (href || '').replace(/^\.\/?/, '/').split('?')[0].split('#')[0];
    if (path === '/' || path === '/index.html') return PAGES[0];
    return PAGES.find(function (p) {
      return p.url === path || p.url === path + '/' || path === p.url.replace(/\/$/, '');
    });
  }

  window.openCmsEdit = openEditDrawer;

  window.addEventListener('message', function (e) {
    var data = e.data || {};
    if (data.source !== 'cms-preview') return;
    if (data.type === 'cms-ready') previewReady = true;
    if (data.type === 'cms-select' || data.editType) openEditDrawer(data);
    if (data.type === 'cms-navigate') {
      var page = resolvePageFromHref(data.href);
      if (page) switchPage(page);
    }
  });

  function fieldHtml(id, label, value, rows) {
    var val = (value == null ? '' : String(value)).replace(/"/g, '&quot;');
    if (rows) {
      return '<div class="form-field"><label for="' + id + '">' + label + '</label><textarea id="' + id + '" rows="' + rows + '">' + (value == null ? '' : value) + '</textarea></div>';
    }
    return '<div class="form-field"><label for="' + id + '">' + label + '</label><input type="text" id="' + id + '" value="' + val + '"></div>';
  }

  function openEditDrawer(data) {
    currentEdit = data;
    editDrawerTitle.textContent = data.label || 'Edit content';
    var html = '';

    if (data.editType === 'text' || data.editType === 'html') {
      html = fieldHtml('editVal', humanLabel(data.key), data.value, data.editType === 'html' ? 5 : 2);
    } else if (data.editType === 'image') {
      html = fieldHtml('editVal', humanLabel(data.key), data.value, 1);
      html += '<img id="imgPreview" class="media-preview" alt="Preview" src="' + (data.value || '').replace(/"/g, '&quot;') + '">';
      html += '<button type="button" class="btn-secondary" id="uploadImgBtn" style="width:100%;margin-top:12px"><i class="fa-solid fa-upload"></i> Upload new image</button>';
      html += '<input type="file" id="imgFile" accept="image/*" hidden>';
    } else if (data.editType === 'hero') {
      var h = content.home || {};
      html = fieldHtml('heroBefore', 'Before highlight', h.heroTitleBefore || '', 1) +
        fieldHtml('heroHighlight', 'Highlighted text', h.heroTitleHighlight || '', 1) +
        fieldHtml('heroAfter', 'After highlight', h.heroTitleAfter || '', 1);
    } else if (data.editType === 'pageTitle') {
      var sec = content[data.section] || {};
      html = fieldHtml('ptBefore', 'Before highlight', sec.pageTitleBefore || '', 1) +
        fieldHtml('ptHighlight', 'Highlighted text', sec.pageTitleHighlight || '', 1) +
        fieldHtml('ptAfter', 'After highlight', sec.pageTitleAfter || '', 1);
    } else if (data.editType === 'service') {
      var svc = (content.services_list || [])[data.index] || {};
      html = fieldHtml('svcTitle', 'Title', svc.title || '', 1) +
        fieldHtml('svcDesc', 'Description', svc.description || '', 4);
    } else if (data.editType === 'testimonial') {
      var t = (content.testimonials || [])[data.index] || {};
      html = fieldHtml('tText', 'Quote', t.text || '', 4) +
        fieldHtml('tName', 'Name', t.name || '', 1) +
        fieldHtml('tRole', 'Role / Company', t.role || '', 1) +
        fieldHtml('tInit', 'Initials', t.initials || '', 1);
    } else if (data.editType === 'faq') {
      var f = (content.faq || [])[data.index] || {};
      html = fieldHtml('fQ', 'Question', f.question || '', 2) +
        fieldHtml('fA', 'Answer', f.answer || '', 4);
    } else if (data.editType === 'product') {
      var p = (content.products_list || [])[data.index] || {};
      html = fieldHtml('prodTitle', 'Product Name', p.title || '', 1) +
        fieldHtml('prodBadge', 'Badge', p.badge || '', 1) +
        fieldHtml('prodDesc', 'Description', p.description || '', 3);
    } else if (data.editType === 'stat') {
      var st = (content.stats_band || [])[data.index] || {};
      html = fieldHtml('statVal', 'Number', st.value || '', 1) +
        fieldHtml('statLabel', 'Label', st.label || '', 1);
    } else if (data.editType === 'heroVideo') {
      var hv = (content.media || {}).heroVideo || '';
      html = fieldHtml('heroVidUrl', 'Video URL (YouTube link or MP4 file URL)', hv, 1);
      html += '<div id="heroVidPreviewWrap" style="margin-top:12px">';
      if (/youtu\.?be|youtube\.com|vimeo\.com/i.test(hv)) {
        html += '<iframe id="heroVidPreviewEmbed" class="media-preview" style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
      } else {
        html += '<video id="heroVidPreview" class="media-preview" controls muted playsinline style="max-width:100%' + (hv ? '' : ';display:none') + '"></video>';
      }
      html += '</div>';
      html += '<button type="button" class="btn-secondary" id="uploadHeroVidBtn" style="width:100%;margin-top:12px"><i class="fa-solid fa-upload"></i> Upload video (MP4)</button>';
      html += '<input type="file" id="heroVidFile" accept="video/mp4,video/webm,video/*" hidden>';
      html += '<p class="section-hint" style="margin-top:12px">Works with YouTube links (e.g. youtube.com/watch?v=...) or uploaded MP4 files. Tip: 10-second loop, 16:9 ratio.</p>';
    } else if (data.editType === 'cta') {
      var hdr = content.header || {};
      html = fieldHtml('ctaText', 'Button text', hdr.ctaButton || '', 1) +
        fieldHtml('ctaLink', 'Button link', hdr.ctaLink || '', 1);
    }

    editDrawerBody.innerHTML = html;
    editDrawer.classList.remove('is-hidden');

    var canDelete = data.editType === 'service' || data.editType === 'product' || data.editType === 'testimonial' || data.editType === 'faq' || data.editType === 'stat';
    deleteEditBtn.classList.toggle('is-hidden', !canDelete || data.index === undefined);

    if (data.editType === 'heroVideo') {
      var previewVid = document.getElementById('heroVidPreview');
      var previewEmbed = document.getElementById('heroVidPreviewEmbed');
      var previewWrap = document.getElementById('heroVidPreviewWrap');
      var urlInput = document.getElementById('heroVidUrl');
      var fileInput = document.getElementById('heroVidFile');
      var uploadBtn = document.getElementById('uploadHeroVidBtn');

      function youtubeEmbed(url) {
        var m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
        return m ? ('https://www.youtube.com/embed/' + m[1] + '?rel=0') : null;
      }
      function vimeoEmbed(url) {
        var m = String(url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/i);
        return m ? ('https://player.vimeo.com/video/' + m[1]) : null;
      }
      function refreshHeroPreview() {
        if (!urlInput || !previewWrap) return;
        var url = urlInput.value.trim();
        var yt = youtubeEmbed(url);
        var vim = vimeoEmbed(url);
        if (yt || vim) {
          previewWrap.innerHTML = '<iframe id="heroVidPreviewEmbed" class="media-preview" src="' + (yt || vim) + '" style="width:100%;aspect-ratio:16/9;border:0;border-radius:8px" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
        } else if (url) {
          previewWrap.innerHTML = '<video id="heroVidPreview" class="media-preview" controls muted playsinline style="max-width:100%" src="' + url.replace(/"/g, '&quot;') + '"></video>';
        } else {
          previewWrap.innerHTML = '<video id="heroVidPreview" class="media-preview" controls muted playsinline style="max-width:100%;display:none"></video>';
        }
      }

      if (urlInput) {
        if (previewEmbed) {
          var emb = youtubeEmbed(urlInput.value) || vimeoEmbed(urlInput.value);
          if (emb) previewEmbed.src = emb;
        } else if (previewVid && urlInput.value) {
          previewVid.src = urlInput.value;
        }
        urlInput.addEventListener('input', refreshHeroPreview);
        urlInput.addEventListener('change', refreshHeroPreview);
      }
      if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function () { fileInput.click(); });
        fileInput.addEventListener('change', async function () {
          if (!fileInput.files || !fileInput.files[0]) return;
          var form = new FormData();
          form.append('file', fileInput.files[0]);
          uploadBtn.disabled = true;
          uploadBtn.textContent = 'Uploading…';
          try {
            var res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' });
            var data = await res.json();
            if (!res.ok) throw new Error(data.error);
            urlInput.value = data.url;
            refreshHeroPreview();
            showToast('Video uploaded — click Apply then Save All');
          } catch (err) {
            alert('Upload failed: ' + err.message);
          }
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload video (MP4)';
        });
      }
    }

    if (data.editType === 'image') {
      var urlInput = document.getElementById('editVal');
      var preview = document.getElementById('imgPreview');
      var fileInput = document.getElementById('imgFile');
      var uploadBtn = document.getElementById('uploadImgBtn');
      if (urlInput && preview) {
        urlInput.addEventListener('input', function () { preview.src = urlInput.value; });
      }
      if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function () { fileInput.click(); });
        fileInput.addEventListener('change', async function () {
          if (!fileInput.files || !fileInput.files[0]) return;
          var form = new FormData();
          form.append('file', fileInput.files[0]);
          uploadBtn.disabled = true;
          uploadBtn.textContent = 'Uploading…';
          try {
            var res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' });
            var up = await res.json();
            if (!res.ok) throw new Error(up.error || 'Upload failed');
            if (urlInput) urlInput.value = up.url;
            if (preview) preview.src = up.url;
          } catch (err) {
            alert('Upload failed: ' + err.message);
          }
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload new image';
        });
      }
    }
  }

  function closeDrawer() {
    editDrawer.classList.add('is-hidden');
    currentEdit = null;
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  function pushDom(update) {
    if (sitePreview.contentWindow) {
      sitePreview.contentWindow.postMessage({ type: 'cms-update-dom', updates: [update] }, '*');
    }
  }

  function applyCurrentEdit() {
    if (!currentEdit) return;
    var updates = [];

    if (currentEdit.editType === 'text' || currentEdit.editType === 'html' || currentEdit.editType === 'image') {
      var v = val('editVal');
      setNested(content, currentEdit.key, v);
      updates.push({ key: currentEdit.key, value: v, editType: currentEdit.editType === 'image' ? 'image' : currentEdit.editType });
    } else if (currentEdit.editType === 'hero') {
      if (!content.home) content.home = {};
      content.home.heroTitleBefore = val('heroBefore');
      content.home.heroTitleHighlight = val('heroHighlight');
      content.home.heroTitleAfter = val('heroAfter');
      content.home.pageTitle = content.home.heroTitleBefore + content.home.heroTitleHighlight + content.home.heroTitleAfter;
      updates.push({
        editType: 'hero',
        fields: { before: content.home.heroTitleBefore, highlight: content.home.heroTitleHighlight, after: content.home.heroTitleAfter }
      });
    } else if (currentEdit.editType === 'pageTitle') {
      var section = currentEdit.section;
      if (!content[section]) content[section] = {};
      content[section].pageTitleBefore = val('ptBefore');
      content[section].pageTitleHighlight = val('ptHighlight');
      content[section].pageTitleAfter = val('ptAfter');
      content[section].pageTitle = content[section].pageTitleBefore + content[section].pageTitleHighlight + content[section].pageTitleAfter;
      updates.push({
        editType: 'pageTitle',
        section: section,
        fields: { before: content[section].pageTitleBefore, highlight: content[section].pageTitleHighlight, after: content[section].pageTitleAfter }
      });
    } else if (currentEdit.editType === 'service') {
      if (!content.services_list) content.services_list = [];
      if (!content.services_list[currentEdit.index]) content.services_list[currentEdit.index] = {};
      content.services_list[currentEdit.index].title = val('svcTitle');
      content.services_list[currentEdit.index].description = val('svcDesc');
      updates.push({ editType: 'service', index: currentEdit.index, item: content.services_list[currentEdit.index] });
    } else if (currentEdit.editType === 'testimonial') {
      if (!content.testimonials) content.testimonials = [];
      if (!content.testimonials[currentEdit.index]) content.testimonials[currentEdit.index] = {};
      content.testimonials[currentEdit.index].text = val('tText');
      content.testimonials[currentEdit.index].name = val('tName');
      content.testimonials[currentEdit.index].role = val('tRole');
      content.testimonials[currentEdit.index].initials = val('tInit');
      updates.push({ editType: 'testimonial', index: currentEdit.index, item: content.testimonials[currentEdit.index] });
    } else if (currentEdit.editType === 'faq') {
      if (!content.faq) content.faq = [];
      if (!content.faq[currentEdit.index]) content.faq[currentEdit.index] = {};
      content.faq[currentEdit.index].question = val('fQ');
      content.faq[currentEdit.index].answer = val('fA');
      updates.push({ editType: 'faq', index: currentEdit.index, item: content.faq[currentEdit.index] });
    } else if (currentEdit.editType === 'product') {
      if (!content.products_list) content.products_list = [];
      if (!content.products_list[currentEdit.index]) content.products_list[currentEdit.index] = {};
      content.products_list[currentEdit.index].title = val('prodTitle');
      content.products_list[currentEdit.index].badge = val('prodBadge');
      content.products_list[currentEdit.index].description = val('prodDesc');
      updates.push({ editType: 'product', index: currentEdit.index, item: content.products_list[currentEdit.index] });
    } else if (currentEdit.editType === 'stat') {
      if (!content.stats_band) content.stats_band = [];
      if (!content.stats_band[currentEdit.index]) content.stats_band[currentEdit.index] = {};
      content.stats_band[currentEdit.index].value = val('statVal');
      content.stats_band[currentEdit.index].label = val('statLabel');
      updates.push({ editType: 'stat', index: currentEdit.index, item: content.stats_band[currentEdit.index] });
    } else if (currentEdit.editType === 'heroVideo') {
      if (!content.media) content.media = {};
      content.media.heroVideo = val('heroVidUrl');
      updates.push({ editType: 'heroVideo', value: content.media.heroVideo });
    } else if (currentEdit.editType === 'cta') {
      if (!content.header) content.header = {};
      content.header.ctaButton = val('ctaText');
      content.header.ctaLink = val('ctaLink');
      updates.push({ editType: 'cta', fields: { text: content.header.ctaButton, link: content.header.ctaLink } });
    }

    if (sitePreview.contentWindow) {
      sitePreview.contentWindow.postMessage({ type: 'cms-update-dom', updates: updates }, '*');
    }
    setDirty(true);
    closeDrawer();
    showToast('Updated — click Save All to publish');
  }

  function deleteCurrentEdit() {
    if (!currentEdit) return;
    var idx = currentEdit.index;
    if (idx === undefined || idx === null || idx === '') {
      alert('This item cannot be deleted from here. Use Manage FAQs / Services / Products.');
      return;
    }
    idx = parseInt(idx, 10);
    if (isNaN(idx) || idx < 0) return;

    var keyMap = { service: 'services_list', product: 'products_list', testimonial: 'testimonials', faq: 'faq', stat: 'stats_band' };
    var listKey = keyMap[currentEdit.editType];
    if (!listKey) return;
    if (!Array.isArray(content[listKey])) content[listKey] = [];
    if (idx >= content[listKey].length) {
      alert('Item not found. Refresh the page and try again.');
      return;
    }

    var item = content[listKey][idx] || {};
    var name = item.title || item.value || item.question || ('Item ' + (idx + 1));
    if (!name || !String(name).trim()) name = 'this empty item';
    if (!confirm('Delete "' + name + '"?\n\nClick Save All after this to publish.')) return;

    content[listKey].splice(idx, 1);
    setDirty(true);
    closeDrawer();
    showToast('Deleted — click Save All to publish');
    reloadPreviewContent();
    if (currentListKey === listKey) openListManager(listKey);
  }

  function reloadPreviewContent() {
    if (sitePreview.contentWindow) {
      sitePreview.contentWindow.postMessage({ type: 'cms-reload-content', content: content }, '*');
    }
  }

  function addListItem(listKey) {
    var cfg = LIST_CONFIG[listKey];
    if (!cfg) return;
    if (!content[listKey]) content[listKey] = [];
    content[listKey].push(JSON.parse(JSON.stringify(cfg.defaultItem)));
    setDirty(true);
    openListManager(listKey);
    reloadPreviewContent();
    showToast('Added — click Save All to publish');
  }

  function openListManager(listKey) {
    currentListKey = listKey;
    var cfg = LIST_CONFIG[listKey];
    if (!cfg) return;
    listModalTitle.innerHTML = '<i class="fa-solid fa-list"></i> Manage ' + cfg.label;
    listModal.classList.remove('is-hidden');
    renderListManager(listKey);
    var preview = PAGES.find(function (p) { return p.id === cfg.previewPage; });
    if (preview && currentPage.id !== preview.id) switchPage(preview);
  }

  function renderListManager(listKey) {
    var cfg = LIST_CONFIG[listKey];
    if (!content[listKey]) content[listKey] = [];
    var items = content[listKey];
    var html = '<p class="list-modal-tip">Add, edit, or remove items. Click <strong>Save All</strong> after changes to publish live.</p>';
    html += '<button type="button" class="btn-add-list" id="addListItemBtn"><i class="fa-solid fa-plus"></i> Add New ' + cfg.label.slice(0, -1) + '</button>';

    items.forEach(function (item, i) {
      html += '<div class="list-manage-card" data-list-index="' + i + '">';
      html += '<div class="list-manage-header"><strong>' + (item.title || item.value || item.question || ('Item ' + (i + 1))) + '</strong>';
      html += '<div class="list-manage-actions">';
      html += '<button type="button" class="btn-icon-edit" data-edit-index="' + i + '" title="Edit"><i class="fa-solid fa-pen"></i></button>';
      html += '<button type="button" class="btn-icon-delete" data-delete-index="' + i + '" title="Delete"><i class="fa-solid fa-trash"></i></button>';
      html += '</div></div>';
      cfg.fields.forEach(function (field) {
        var raw = item[field.key];
        var display = field.list && Array.isArray(raw) ? raw.join('\n') : (raw == null ? '' : String(raw));
        var safe = display.replace(/"/g, '&quot;');
        if (field.textarea || field.list) {
          html += '<div class="form-field"><label>' + field.label + '</label><textarea data-field="' + field.key + '"' + (field.list ? ' data-list="1"' : '') + ' rows="' + (field.list ? '4' : '2') + '">' + display.replace(/</g, '&lt;') + '</textarea></div>';
        } else {
          html += '<div class="form-field"><label>' + field.label + '</label><input type="text" data-field="' + field.key + '" value="' + safe + '"></div>';
        }
      });
      html += '</div>';
    });

    if (!items.length) {
      html += '<p class="text-muted" style="text-align:center;padding:20px">No items yet. Click Add New above.</p>';
    }

    listModalBody.innerHTML = html;

    document.getElementById('addListItemBtn').addEventListener('click', function () {
      if (!content[listKey]) content[listKey] = [];
      content[listKey].push(JSON.parse(JSON.stringify(cfg.defaultItem)));
      setDirty(true);
      renderListManager(listKey);
      reloadPreviewContent();
      showToast('Added — edit fields and Save All');
    });

    listModalBody.querySelectorAll('[data-delete-index]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.deleteIndex, 10);
        var item = content[listKey][idx];
        var name = (item && item.title) || (item && item.value) || (item && item.question) || 'this item';
        if (!confirm('Delete "' + name + '"?')) return;
        content[listKey].splice(idx, 1);
        setDirty(true);
        renderListManager(listKey);
        reloadPreviewContent();
        showToast('Deleted — click Save All to publish');
      });
    });

    listModalBody.querySelectorAll('[data-edit-index]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveListFieldsFromDom(listKey);
        openEditDrawer({ editType: cfg.editType, index: parseInt(btn.dataset.editIndex, 10), label: cfg.label.slice(0, -1) + ' ' + (parseInt(btn.dataset.editIndex, 10) + 1) });
      });
    });

    listModalBody.querySelectorAll('.list-manage-card input, .list-manage-card textarea').forEach(function (input) {
      input.addEventListener('change', function () {
        saveListFieldsFromDom(listKey);
        setDirty(true);
        reloadPreviewContent();
      });
    });
  }

  function saveListFieldsFromDom(listKey) {
    var cfg = LIST_CONFIG[listKey];
    if (!content[listKey]) content[listKey] = [];
    listModalBody.querySelectorAll('.list-manage-card').forEach(function (card) {
      var idx = parseInt(card.dataset.listIndex, 10);
      if (!content[listKey][idx]) content[listKey][idx] = JSON.parse(JSON.stringify(cfg.defaultItem));
      card.querySelectorAll('[data-field]').forEach(function (input) {
        var key = input.dataset.field;
        if (input.getAttribute('data-list') === '1') {
          content[listKey][idx][key] = input.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        } else {
          content[listKey][idx][key] = input.value;
        }
      });
    });
  }

  async function saveContent() {
    saveBtn.disabled = true;
    try {
      await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
      setDirty(false);
      showToast('Published to live site!');
    } catch (err) {
      if (err.message === 'Unauthorized') {
        showLogin();
        alert('Session expired. Please log in again.');
      } else {
        alert('Save failed: ' + err.message);
      }
    }
    saveBtn.disabled = false;
  }

  var MEDIA_FIELDS = [
    { key: 'logo', label: 'Site Logo URL' },
    { key: 'logoIcon', label: 'Logo Icon URL' },
    { key: 'heroImage', label: 'Hero Image URL' },
    { key: 'heroVideo', label: 'Hero Video URL (homepage right panel)' },
    { key: 'aboutImage', label: 'About Image URL' },
    { key: 'favicon', label: 'Favicon URL' }
  ];

  async function openMediaModal() {
    mediaModal.classList.remove('is-hidden');
    mediaModalBody.innerHTML = '<p>Loading…</p>';
    if (!content.media) content.media = {};

    var uploaded = [];
    try { uploaded = await api('/api/media'); } catch (e) {}

    var html = '<div class="upload-zone" id="uploadZone">' +
      '<i class="fa-solid fa-cloud-arrow-up"></i><strong>Click or drag to upload</strong>' +
      '<input type="file" id="fileInput" accept="image/*,video/*" multiple hidden></div>';

    if (uploaded.length) {
      html += '<div class="media-grid">';
      uploaded.forEach(function (f) {
        var preview = f.type === 'video' ? '<video src="' + f.url + '" muted></video>' : '<img src="' + f.url + '" alt="">';
        html += '<div class="media-thumb" data-url="' + f.url + '">' + preview + '<div class="media-name">' + f.name + '</div></div>';
      });
      html += '</div>';
    }

    html += '<div class="editor-grid" style="margin-top:20px">';
    MEDIA_FIELDS.forEach(function (field) {
      var v = (content.media[field.key] || '').replace(/"/g, '&quot;');
      html += '<div class="form-field full"><label>' + field.label + '</label>' +
        '<input type="text" data-media-key="media.' + field.key + '" value="' + v + '"></div>';
    });
    html += '</div><button type="button" class="btn-save" id="saveMediaBtn" style="margin-top:16px;width:100%">Save Media Settings</button>';

    mediaModalBody.innerHTML = html;

    var uploadZone = document.getElementById('uploadZone');
    var fileInput = document.getElementById('fileInput');
    uploadZone.addEventListener('click', function () { fileInput.click(); });
    uploadZone.addEventListener('dragover', function (e) { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', function () { uploadZone.classList.remove('dragover'); });
    uploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      uploadFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', function () { uploadFiles(fileInput.files); });

    mediaModalBody.querySelectorAll('.media-thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var url = thumb.dataset.url;
        var isVideo = !!thumb.querySelector('video');
        if (isVideo) {
          var heroInput = mediaModalBody.querySelector('[data-media-key="media.heroVideo"]');
          if (heroInput) {
            heroInput.value = url;
            showToast('Set as Hero Video — click Save Media Settings');
            return;
          }
        }
        navigator.clipboard.writeText(url);
        showToast('URL copied to clipboard');
      });
    });

    document.getElementById('saveMediaBtn').addEventListener('click', function () {
      mediaModalBody.querySelectorAll('[data-media-key]').forEach(function (input) {
        setNested(content, input.dataset.mediaKey, input.value);
        var key = input.dataset.mediaKey;
        if (key === 'media.heroVideo') {
          pushDom({ editType: 'heroVideo', value: input.value });
        } else {
          pushDom({ key: key, value: input.value });
        }
      });
      setDirty(true);
      showToast('Media updated — click Save All to publish');
    });
  }

  async function uploadFiles(files) {
    for (var i = 0; i < files.length; i++) {
      var form = new FormData();
      form.append('file', files[i]);
      try {
        var res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } catch (err) {
        alert('Upload failed: ' + err.message);
      }
    }
    showToast('Upload complete');
    openMediaModal();
  }

  async function checkAuth() {
    try {
      var data = await api('/api/auth/check');
      if (data.logged_in) showDashboard();
      else showLogin();
    } catch (e) {
      showLogin();
    }
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    loginError.hidden = true;
    var btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({
          username: document.getElementById('username').value,
          password: document.getElementById('password').value
        })
      });
      loginForm.reset();
      showDashboard();
    } catch (e) {
      loginError.textContent = 'Invalid username or password';
      loginError.hidden = false;
    }
    btn.disabled = false;
  });

  saveBtn.addEventListener('click', saveContent);
  logoutBtn.addEventListener('click', async function () {
    await api('/api/logout', { method: 'POST' });
    showLogin();
    loginForm.reset();
  });
  document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
  document.getElementById('cancelEdit').addEventListener('click', closeDrawer);
  document.getElementById('applyEdit').addEventListener('click', applyCurrentEdit);
  deleteEditBtn.addEventListener('click', deleteCurrentEdit);
  document.getElementById('manageServicesBtn').addEventListener('click', function () { openListManager('services_list'); });
  document.getElementById('manageProductsBtn').addEventListener('click', function () { openListManager('products_list'); });
  document.getElementById('addServiceBtn').addEventListener('click', function () { addListItem('services_list'); });
  document.getElementById('addProductBtn').addEventListener('click', function () { addListItem('products_list'); });
  document.getElementById('manageStatsBtn').addEventListener('click', function () { openListManager('stats_band'); });
  document.getElementById('manageFaqsBtn').addEventListener('click', function () { openListManager('faq'); });
  document.getElementById('topAddServiceBtn').addEventListener('click', function () { addListItem('services_list'); });
  document.getElementById('topAddProductBtn').addEventListener('click', function () { addListItem('products_list'); });
  document.getElementById('topManageStatsBtn').addEventListener('click', function () { openListManager('stats_band'); });
  mediaBtn.addEventListener('click', openMediaModal);
  document.getElementById('closeListModal').addEventListener('click', function () { listModal.classList.add('is-hidden'); currentListKey = null; });
  document.getElementById('listModalBackdrop').addEventListener('click', function () { listModal.classList.add('is-hidden'); currentListKey = null; });
  document.getElementById('closeMediaModal').addEventListener('click', function () { mediaModal.classList.add('is-hidden'); });
  document.getElementById('mediaModalBackdrop').addEventListener('click', function () { mediaModal.classList.add('is-hidden'); });

  showLogin();
  checkAuth();
})();
