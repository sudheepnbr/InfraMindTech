/**
 * Sets document base URL for clean paths on GitHub Pages and local dev.
 */
(function () {
  'use strict';
  var path = window.location.pathname;
  var root = '/';
  var marker = '/InfraMindTech';
  var idx = path.indexOf(marker);
  if (idx !== -1) {
    root = path.substring(0, idx + marker.length + 1);
  }
  window.SITE_ROOT = root;
  if (!document.querySelector('base')) {
    var base = document.createElement('base');
    base.href = root;
    document.head.insertBefore(base, document.head.firstChild);
  }

  /* Load visual editor when previewed inside admin iframe */
  if (window.self !== window.top || /[?&]cms-edit=1/.test(window.location.search)) {
    window.CMS_EDIT_MODE = true;
    var editSrc = root.replace(/\/?$/, '/') + 'admin/edit-inject.js?v=6';
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('cms-edit-inject')) return;
      var s = document.createElement('script');
      s.id = 'cms-edit-inject';
      s.src = editSrc;
      document.body.appendChild(s);
    });
  }
})();
