/**
 * InfraMindTech — Admin CMS Panel
 */
(function () {
  'use strict';

  let content = {};
  let currentSection = 'site';

  const SECTION_LABELS = {
    site: 'Site Settings',
    header: 'Header / Navbar',
    footer: 'Footer',
    media: 'Photos & Videos',
    home: 'Home Page',
    about: 'About Page',
    services: 'Services Page',
    products: 'Products Page',
    contact: 'Contact Page',
    services_list: 'Services',
    products_list: 'Products',
    testimonials: 'Testimonials',
    faq: 'FAQ',
    pricing: 'Pricing Plans'
  };

  const SECTION_HINTS = {
    site: 'Company info, contact details, and SEO settings used across the site.',
    header: 'Edit navigation menu labels, logo icon, and header call-to-action button.',
    footer: 'Edit footer description, social media links, and legal page links.',
    media: 'Upload photos and videos. Assign URLs to logo, hero image, hero video, etc.',
    home: 'Edit homepage hero, section titles, stats, and call-to-action text.',
    about: 'Edit about page story, mission, and vision content.',
    services: 'Edit services page titles and AI solutions section.',
    products: 'Edit products page titles and descriptions.',
    contact: 'Edit contact page text and form title.',
    services_list: 'Manage all service cards shown on Home and Services pages.',
    products_list: 'Manage all product cards shown on Home and Products pages.',
    testimonials: 'Manage client testimonial quotes.',
    faq: 'Manage frequently asked questions.',
    pricing: 'Manage pricing plan names, prices, and features.'
  };

  const FIELD_SCHEMAS = {
    site: [
      { key: 'companyName', label: 'Company Name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'metaDescription', label: 'SEO Description', type: 'textarea', full: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'phone2', label: 'Phone 2', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'salesEmail', label: 'Sales Email', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'city', label: 'City / Country', type: 'text' },
      { key: 'hours', label: 'Business Hours (Weekdays)', type: 'text' },
      { key: 'hoursSat', label: 'Business Hours (Saturday)', type: 'text' },
      { key: 'copyright', label: 'Copyright Text', type: 'text', full: true }
    ],
    header: [
      { key: 'logoIcon', label: 'Logo Icon (Font Awesome class, e.g. fa-brain)', type: 'text' },
      { key: 'ctaButton', label: 'CTA Button Text', type: 'text' },
      { key: 'ctaLink', label: 'CTA Button Link', type: 'text' },
      { key: 'navHome', label: 'Nav: Home', type: 'text' },
      { key: 'navSolutions', label: 'Nav: Solutions', type: 'text' },
      { key: 'navServices', label: 'Nav: Services', type: 'text' },
      { key: 'navProducts', label: 'Nav: Products', type: 'text' },
      { key: 'navIndustries', label: 'Nav: Industries', type: 'text' },
      { key: 'navResources', label: 'Nav: Resources', type: 'text' },
      { key: 'navAbout', label: 'Nav: About', type: 'text' },
      { key: 'navContact', label: 'Nav: Contact', type: 'text' }
    ],
    footer: [
      { key: 'description', label: 'Footer Description', type: 'textarea', full: true },
      { key: 'linkedin', label: 'LinkedIn URL', type: 'text' },
      { key: 'twitter', label: 'Twitter / X URL', type: 'text' },
      { key: 'facebook', label: 'Facebook URL', type: 'text' },
      { key: 'youtube', label: 'YouTube URL', type: 'text' },
      { key: 'privacyLink', label: 'Privacy Policy Link', type: 'text' },
      { key: 'termsLink', label: 'Terms of Service Link', type: 'text' },
      { key: 'cookieLink', label: 'Cookie Policy Link', type: 'text' }
    ],
    home: [
      { key: 'heroBadge', label: 'Hero Badge Text', type: 'text', full: true },
      { key: 'heroTitleBefore', label: 'Hero Title (before highlight)', type: 'text' },
      { key: 'heroTitleHighlight', label: 'Hero Title (highlighted part)', type: 'text' },
      { key: 'heroTitleAfter', label: 'Hero Title (after highlight)', type: 'text' },
      { key: 'heroSubtitle', label: 'Hero Subtitle', type: 'text', full: true },
      { key: 'stat1Value', label: 'Stat 1 Value', type: 'text' },
      { key: 'stat1Label', label: 'Stat 1 Label', type: 'text' },
      { key: 'stat2Value', label: 'Stat 2 Value', type: 'text' },
      { key: 'stat2Label', label: 'Stat 2 Label', type: 'text' },
      { key: 'stat3Value', label: 'Stat 3 Value', type: 'text' },
      { key: 'stat3Label', label: 'Stat 3 Label', type: 'text' },
      { key: 'servicesTitle', label: 'Services Section Title', type: 'text', full: true },
      { key: 'servicesSubtitle', label: 'Services Section Subtitle', type: 'textarea', full: true },
      { key: 'solutionsTitle', label: 'Solutions Section Title', type: 'text', full: true },
      { key: 'solutionsSubtitle', label: 'Solutions Section Subtitle', type: 'textarea', full: true },
      { key: 'productsTitle', label: 'Products Section Title', type: 'text', full: true },
      { key: 'productsSubtitle', label: 'Products Section Subtitle', type: 'textarea', full: true },
      { key: 'testimonialsTitle', label: 'Testimonials Title', type: 'text', full: true },
      { key: 'testimonialsSubtitle', label: 'Testimonials Subtitle', type: 'textarea', full: true },
      { key: 'ctaTitle', label: 'CTA Banner Title', type: 'text', full: true },
      { key: 'ctaText', label: 'CTA Banner Text', type: 'textarea', full: true }
    ],
    about: [
      { key: 'pageTitle', label: 'Page Title', type: 'text', full: true },
      { key: 'pageSubtitle', label: 'Page Subtitle', type: 'textarea', full: true },
      { key: 'storyTitle', label: 'Story Section Title', type: 'text', full: true },
      { key: 'storyP1', label: 'Story Paragraph 1', type: 'textarea', full: true },
      { key: 'storyP2', label: 'Story Paragraph 2', type: 'textarea', full: true },
      { key: 'mission', label: 'Mission', type: 'textarea', full: true },
      { key: 'vision', label: 'Vision', type: 'textarea', full: true }
    ],
    services: [
      { key: 'pageTitle', label: 'Page Title', type: 'text', full: true },
      { key: 'pageSubtitle', label: 'Page Subtitle', type: 'textarea', full: true },
      { key: 'aiTitle', label: 'AI Solutions Title', type: 'text', full: true },
      { key: 'aiDescription', label: 'AI Solutions Description', type: 'textarea', full: true }
    ],
    products: [
      { key: 'pageTitle', label: 'Page Title', type: 'text', full: true },
      { key: 'pageSubtitle', label: 'Page Subtitle', type: 'textarea', full: true }
    ],
    contact: [
      { key: 'pageTitle', label: 'Page Title', type: 'text', full: true },
      { key: 'pageSubtitle', label: 'Page Subtitle', type: 'textarea', full: true },
      { key: 'formTitle', label: 'Form Title', type: 'text', full: true }
    ]
  };

  const LIST_SCHEMAS = {
    services_list: {
      fields: [
        { key: 'title', label: 'Service Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea', full: true }
      ],
      defaultItem: { title: 'New Service', description: 'Service description here.' }
    },
    products_list: {
      fields: [
        { key: 'title', label: 'Product Name', type: 'text' },
        { key: 'badge', label: 'Badge Label', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea', full: true }
      ],
      defaultItem: { title: 'New Product', badge: 'Category', description: 'Product description here.' }
    },
    testimonials: {
      fields: [
        { key: 'text', label: 'Quote', type: 'textarea', full: true },
        { key: 'name', label: 'Person Name', type: 'text' },
        { key: 'role', label: 'Role / Company', type: 'text' },
        { key: 'initials', label: 'Avatar Initials', type: 'text' }
      ],
      defaultItem: { text: 'Great service!', name: 'John Doe', role: 'CEO, Company', initials: 'JD' }
    },
    faq: {
      fields: [
        { key: 'question', label: 'Question', type: 'text', full: true },
        { key: 'answer', label: 'Answer', type: 'textarea', full: true }
      ],
      defaultItem: { question: 'New question?', answer: 'Answer here.' }
    },
    pricing: {
      fields: [
        { key: 'name', label: 'Plan Name', type: 'text' },
        { key: 'price', label: 'Price', type: 'text' },
        { key: 'period', label: 'Period (e.g. /month)', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'featured', label: 'Featured Plan (true/false)', type: 'text' },
        { key: 'features', label: 'Features (one per line)', type: 'textarea', full: true, isArray: true }
      ],
      defaultItem: { name: 'New Plan', price: '$0', period: '/month', description: 'Plan description', featured: 'false', features: ['Feature 1', 'Feature 2'] }
    }
  };

  const MEDIA_FIELDS = [
    { key: 'logo', label: 'Site Logo Image URL' },
    { key: 'heroImage', label: 'Hero Section Image URL' },
    { key: 'heroVideo', label: 'Hero Section Video URL' },
    { key: 'aboutImage', label: 'About Page Image URL' },
    { key: 'favicon', label: 'Favicon URL' }
  ];

  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const editorPanel = document.getElementById('editorPanel');
  const sectionTitle = document.getElementById('sectionTitle');
  const sectionHint = document.getElementById('sectionHint');
  const saveBtn = document.getElementById('saveBtn');
  const saveToast = document.getElementById('saveToast');
  const logoutBtn = document.getElementById('logoutBtn');

  async function api(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...options
    });
    const data = await res.json().catch(() => ({}));
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
    loadContent();
  }

  async function checkAuth() {
    try {
      const data = await api('/api/auth/check');
      if (data.logged_in) showDashboard();
      else showLogin();
    } catch {
      showLogin();
    }
  }

  async function loadContent() {
    content = await api('/api/content');
    renderSection(currentSection);
  }

  function renderSection(section) {
    currentSection = section;
    sectionTitle.textContent = SECTION_LABELS[section] || section;
    sectionHint.textContent = SECTION_HINTS[section] || '';

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === section);
    });

    if (section === 'media') renderMediaEditor();
    else if (LIST_SCHEMAS[section]) renderListEditor(section);
    else if (FIELD_SCHEMAS[section]) renderFieldEditor(section);
  }

  function renderFieldEditor(section) {
    const schema = FIELD_SCHEMAS[section];
    const data = content[section] || {};
    let html = `<div class="editor-card"><h3>${SECTION_LABELS[section]}</h3><div class="editor-grid">`;

    schema.forEach(field => {
      const val = (data[field.key] || '').replace(/"/g, '&quot;');
      const cls = field.full ? 'form-field full' : 'form-field';
      const input = field.type === 'textarea'
        ? `<textarea data-field="${field.key}" rows="3">${data[field.key] || ''}</textarea>`
        : `<input type="text" data-field="${field.key}" value="${val}">`;
      html += `<div class="${cls}"><label>${field.label}</label>${input}</div>`;
    });

    html += '</div></div>';
    editorPanel.innerHTML = html;
  }

  function renderListEditor(section) {
    const schema = LIST_SCHEMAS[section];
    const items = content[section] || [];
    let html = `<div class="editor-card"><h3>${SECTION_LABELS[section]}</h3>`;

    items.forEach((item, i) => {
      html += `<div class="list-item-card" data-index="${i}">`;
      html += `<div class="item-header"><span class="item-num">Item ${i + 1}</span>`;
      html += `<button class="btn-remove" data-remove="${i}"><i class="fa-solid fa-trash"></i> Remove</button></div>`;
      html += '<div class="editor-grid">';

      schema.fields.forEach(field => {
        const cls = field.full ? 'form-field full' : 'form-field';
        let input;
        if (field.isArray) {
          const arrVal = Array.isArray(item[field.key]) ? item[field.key].join('\n') : (item[field.key] || '');
          input = `<textarea data-field="${field.key}" data-is-array="true" rows="4">${arrVal}</textarea>`;
        } else if (field.type === 'textarea') {
          input = `<textarea data-field="${field.key}" rows="2">${item[field.key] || ''}</textarea>`;
        } else {
          const val = (item[field.key] || '').replace(/"/g, '&quot;');
          input = `<input type="text" data-field="${field.key}" value="${val}">`;
        }
        html += `<div class="${cls}"><label>${field.label}</label>${input}</div>`;
      });

      html += '</div></div>';
    });

    html += `<button class="btn-add" id="addItemBtn"><i class="fa-solid fa-plus"></i> Add Item</button></div>`;
    editorPanel.innerHTML = html;

    document.getElementById('addItemBtn')?.addEventListener('click', () => {
      if (!content[section]) content[section] = [];
      content[section].push(JSON.parse(JSON.stringify(schema.defaultItem)));
      renderSection(section);
    });

    editorPanel.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        content[section].splice(parseInt(btn.dataset.remove, 10), 1);
        renderSection(section);
      });
    });
  }

  async function renderMediaEditor() {
    editorPanel.innerHTML = '<div class="editor-card"><p>Loading media...</p></div>';

    let uploaded = [];
    try {
      uploaded = await api('/api/media');
    } catch {}

    if (!content.media) content.media = {};

    let html = `<div class="editor-card"><h3>Upload Photos &amp; Videos</h3>`;
    html += `<div class="upload-zone" id="uploadZone">
      <i class="fa-solid fa-cloud-arrow-up"></i>
      <strong>Click or drag files here to upload</strong>
      <p style="margin-top:8px;font-size:0.8125rem">Images: PNG, JPG, GIF, WebP, SVG &nbsp;|&nbsp; Videos: MP4, WebM</p>
      <input type="file" id="fileInput" accept="image/*,video/*" multiple hidden>
    </div>`;

    if (uploaded.length) {
      html += '<h4 style="margin-bottom:8px;font-size:0.875rem">Uploaded Files (click to copy URL)</h4><div class="media-grid">';
      uploaded.forEach(f => {
        const preview = f.type === 'video'
          ? `<video src="${f.url}" muted></video>`
          : `<img src="${f.url}" alt="${f.name}">`;
        html += `<div class="media-thumb" data-url="${f.url}" style="cursor:pointer" title="Click to copy URL">${preview}<div class="media-name">${f.name}</div></div>`;
      });
      html += '</div>';
    }

    html += '</div><div class="editor-card"><h3>Assign Media to Site Sections</h3><div class="editor-grid">';
    MEDIA_FIELDS.forEach(field => {
      const val = (content.media[field.key] || '').replace(/"/g, '&quot;');
      html += `<div class="form-field full"><label>${field.label}</label>`;
      html += `<input type="text" data-media-field="${field.key}" value="${val}" placeholder="/images/uploads/your-file.jpg">`;
      if (content.media[field.key]) {
        const isVideo = /\.(mp4|webm|ogg)$/i.test(content.media[field.key]);
        html += isVideo
          ? `<video class="media-preview" src="${content.media[field.key]}" controls muted></video>`
          : `<img class="media-preview" src="${content.media[field.key]}" alt="preview">`;
      }
      html += '</div>';
    });
    html += '</div></div>';

    editorPanel.innerHTML = html;

    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      uploadFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', () => uploadFiles(fileInput.files));

    editorPanel.querySelectorAll('.media-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        navigator.clipboard.writeText(thumb.dataset.url);
        showToast('URL copied! Paste into a media field below.');
      });
    });
  }

  async function uploadFiles(files) {
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } catch (err) {
        alert('Upload failed: ' + err.message);
      }
    }
    showToast('Upload complete!');
    renderSection('media');
  }

  function collectFormData() {
    if (currentSection === 'media') {
      if (!content.media) content.media = {};
      editorPanel.querySelectorAll('[data-media-field]').forEach(input => {
        content.media[input.dataset.mediaField] = input.value;
      });
      return;
    }

    if (LIST_SCHEMAS[currentSection]) {
      const schema = LIST_SCHEMAS[currentSection];
      const cards = editorPanel.querySelectorAll('.list-item-card');
      content[currentSection] = [];

      cards.forEach(card => {
        const item = {};
        card.querySelectorAll('[data-field]').forEach(input => {
          if (input.dataset.isArray) {
            item[input.dataset.field] = input.value.split('\n').map(s => s.trim()).filter(Boolean);
          } else if (input.dataset.field === 'featured') {
            item[input.dataset.field] = input.value === 'true';
          } else {
            item[input.dataset.field] = input.value;
          }
        });
        content[currentSection].push(item);
      });
    } else if (FIELD_SCHEMAS[currentSection]) {
      if (!content[currentSection]) content[currentSection] = {};
      editorPanel.querySelectorAll('[data-field]').forEach(input => {
        content[currentSection][input.dataset.field] = input.value;
      });
    }
  }

  function showToast(msg) {
    saveToast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${msg}`;
    saveToast.classList.remove('is-hidden');
    setTimeout(() => saveToast.classList.add('is-hidden'), 3000);
  }

  async function saveContent() {
    collectFormData();
    saveBtn.disabled = true;
    try {
      await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
      showToast('Content saved successfully!');
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

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const btn = loginForm.querySelector('button[type="submit"]');
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
    } catch {
      loginError.textContent = 'Invalid username or password';
      loginError.hidden = false;
    }
    btn.disabled = false;
  });

  saveBtn.addEventListener('click', saveContent);

  logoutBtn.addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' });
    showLogin();
    loginForm.reset();
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      collectFormData();
      renderSection(btn.dataset.section);
    });
  });

  showLogin();
  checkAuth();
})();
