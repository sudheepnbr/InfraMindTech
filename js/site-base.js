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
})();
