/*
 * TrackEcom COD order form embed (#134). Paste on any landing page:
 *   <script src="https://<app>/embed/order-form.js" data-form="FORM_KEY" data-locale="ar" async></script>
 * It inserts the form in an iframe right after the script, passes the page's utm_* parameters on
 * for ad analytics, and resizes the frame to the form's height. No cookies, no tracking.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var key = script.getAttribute('data-form') || '';
  if (!/^[A-Za-z0-9_-]{22}$/.test(key)) return;
  var locale = script.getAttribute('data-locale');
  if (['ar', 'fr', 'en'].indexOf(locale) < 0) locale = 'ar';
  var origin = new URL(script.src).origin;

  var params = new URLSearchParams();
  new URLSearchParams(window.location.search).forEach(function (value, name) {
    if (name.indexOf('utm_') === 0) params.set(name, value.slice(0, 100));
  });
  var query = params.toString();

  var frame = document.createElement('iframe');
  frame.src = origin + '/' + locale + '/f/' + key + (query ? '?' + query : '');
  frame.title = script.getAttribute('data-title') || 'Order form';
  frame.style.width = '100%';
  frame.style.border = '0';
  frame.style.minHeight = '640px';
  script.parentNode.insertBefore(frame, script.nextSibling);

  window.addEventListener('message', function (event) {
    if (event.origin !== origin || event.source !== frame.contentWindow) return;
    var data = event.data || {};
    if (data.type !== 'trackecom:form-height' || typeof data.height !== 'number') return;
    frame.style.height = Math.min(Math.max(data.height, 200), 4000) + 'px';
    frame.style.minHeight = '0';
  });
})();
