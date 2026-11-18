/* Consent Mode v2, basic mode: Google is loaded only after analytics consent. */
(function () {
  'use strict';
  if (window.IvanCookies) return;
  var KEY = 'ivan-cookie-consent-v1';
  var COOKIE = 'ivan_cookie_consent_v1';
  var TTL = 180 * 24 * 60 * 60 * 1000;
  var current = null;
  var loaded = false;
  var banner;
  var returnFocus;
  var allowedHost = /^(www\.)?drcolumnavertebral\.com$/.test(window.location.hostname);
  var defaults = {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', defaults);
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);
  window['ga-disable-G-F9YPDKJ64X'] = true;

  function read() {
    try {
      var cookie = document.cookie.split(';').map(function (item) { return item.trim(); }).find(function (item) { return item.indexOf(COOKIE + '=') === 0; });
      var value = cookie ? JSON.parse(decodeURIComponent(cookie.slice(COOKIE.length + 1))) : null;
      return value && value.version === 1 &&
        (value.analytics === 'granted' || value.analytics === 'denied') &&
        Number.isFinite(value.expires) && value.expires > Date.now() ? value.analytics : null;
    } catch (_) { return null; }
  }
  function update(value) {
    window.gtag('consent', 'update', {
      analytics_storage: value, ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
  }
  function load() {
    if (loaded || !allowedHost || current !== 'granted') return;
    loaded = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-MQMHWNXK';
    document.head.appendChild(script);
    // GA4 uses this explicit trigger inside GTM; legacy cached pages cannot fire it.
    window.dataLayer.push({ event: 'ivan_analytics_consent_granted' });
  }
  function clearAnalyticsCookies() {
    var domains = ['', window.location.hostname, '.' + window.location.hostname];
    if (allowedHost) domains.push('drcolumnavertebral.com', '.drcolumnavertebral.com');
    document.cookie.split(';').forEach(function (item) {
      var name = item.split('=')[0].trim();
      if (!/^(_ga($|_)|_gid$|_gat($|_))/.test(name)) return;
      domains.forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '') + (window.location.protocol === 'https:' ? '; Secure' : '');
      });
    });
  }
  function apply(value, persist) {
    var wasLoaded = loaded;
    current = value;
    if (persist) {
      var record = JSON.stringify({ version: 1, analytics: value, expires: Date.now() + TTL });
      document.cookie = COOKIE + '=' + encodeURIComponent(record) + '; Max-Age=' + (TTL / 1000) + '; path=/; SameSite=Lax' + (window.location.protocol === 'https:' ? '; Secure' : '');
      try { window.localStorage.setItem(KEY, record); } catch (_) { /* Cookie still remembers the choice. */ }
    }
    // This flag only stops an already loaded GA session; it does not install GA.
    window['ga-disable-G-F9YPDKJ64X'] = value !== 'granted';
    update(value);
    if (banner) banner.hidden = true;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    if (value === 'granted') load();
    else {
      clearAnalyticsCookies();
      // Unload previously granted Google libraries after withdrawal.
      if (wasLoaded) window.location.reload();
    }
  }
  function open() {
    if (!banner) return;
    returnFocus = document.activeElement;
    banner.hidden = false;
    banner.querySelector('[data-cookie-action="accept"]').focus();
  }
  function mount() {
    banner = document.createElement('section');
    banner.className = 'ivan-cookie-banner';
    banner.id = 'preferencias-cookies';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-labelledby', 'ivan-cookie-title');
    banner.hidden = current !== null;
    var privacyLink = document.querySelector('a[href*="/privacidad/"]');
    var privacy = privacyLink ? privacyLink.getAttribute('href') : '/privacidad/';
    banner.innerHTML = '<div class="ivan-cookie-copy"><h2 id="ivan-cookie-title">Cookies y analítica</h2>' +
      '<p>Con tu permiso usamos cookies de Google Analytics, gestionadas mediante Google Tag Manager, para medir las visitas y mejorar el sitio. Puedes aceptar o rechazar la analítica y cambiar tu decisión en “Preferencias de cookies”. ' +
      '<a class="ivan-cookie-privacy">Aviso de privacidad</a></p></div>' +
      '<div class="ivan-cookie-actions"><button type="button" data-cookie-action="accept">Aceptar</button>' +
      '<button type="button" data-cookie-action="reject">Rechazar</button></div>';
    banner.querySelector('.ivan-cookie-privacy').setAttribute('href', privacy);
    document.body.appendChild(banner);
    banner.addEventListener('click', function (event) {
      var button = event.target.closest('[data-cookie-action]');
      if (button) apply(button.dataset.cookieAction === 'accept' ? 'granted' : 'denied', true);
    });
    document.querySelectorAll('.foot-legal').forEach(function (footer) {
      if (footer.querySelector('[data-cookie-preferences]')) return;
      var link = document.createElement('a');
      link.href = '#preferencias-cookies';
      link.textContent = 'Preferencias de cookies';
      link.setAttribute('data-cookie-preferences', '');
      footer.appendChild(link);
    });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-cookie-preferences]')) { event.preventDefault(); open(); }
    });
    document.addEventListener('click', function (event) {
      if (current !== 'granted' || !loaded || !allowedHost) return;
      var link = event.target.closest('a[href]');
      if (!link) return;
      var raw = link.getAttribute('href') || '';
      var action = null;
      if (/^tel:/i.test(raw)) action = 'phone_click';
      else {
        var url;
        try { url = new URL(raw, window.location.href); } catch (_) { return; }
        if (/^(www\.)?(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)$/.test(url.hostname)) action = 'whatsapp_click';
        else if (link.dataset.section === 'agenda' || /Agendar (cita|consulta)/i.test(link.textContent || '')) action = 'appointment_click';
      }
      // Never send link_url, phone numbers, form values, messages or medical data.
      if (action) window.dataLayer.push({ event: action });
    }, true);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && banner && !banner.hidden && current !== null) {
        banner.hidden = true;
        if (returnFocus && returnFocus.isConnected) returnFocus.focus();
      }
    });
  }
  window.IvanCookies = { open: open };
  current = read();
  if (current !== null) apply(current, false);
  else clearAnalyticsCookies();
  window.addEventListener('storage', function (event) {
    if (event.key !== KEY) return;
    var value = read();
    if (value !== current) {
      if (value === null) {
        apply('denied', false);
        current = null;
        if (banner) banner.hidden = false;
      } else apply(value, false);
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
}());
