const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/cookie-consent.js'), 'utf8');
const KEY = 'ivan-cookie-consent-v1';

function browser({ stored, hostname = 'drcolumnavertebral.com', storageFails = false } = {}) {
  const storage = new Map(stored ? [[KEY, JSON.stringify(stored)]] : []);
  const scripts = [], deletedCookies = [], events = {}, windowEvents = {};
  const cookies = new Map([['_ga', 'old'], ['_ga_F9YPDKJ64X', 'old'], ['necessary', 'keep']]);
  if (stored) cookies.set('ivan_cookie_consent_v1', encodeURIComponent(JSON.stringify(stored)));
  let reloads = 0, section;
  const element = () => ({
    listeners: {}, isConnected: true, dataset: {},
    setAttribute(name, value) { this[name] = value; },
    getAttribute(name) { return this[name]; },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    focus() { this.focused = true; },
    querySelector() { return this.child || (this.child = element()); },
    appendChild() {},
  });
  const footer = element();
  footer.querySelector = () => null;
  const document = {
    readyState: 'loading', activeElement: element(),
    head: { appendChild(script) { scripts.push(script.src); } },
    body: { appendChild(value) { section = value; } },
    createElement: element,
    querySelector: () => ({ getAttribute: () => '/privacidad/' }),
    querySelectorAll: () => [footer],
    addEventListener(name, fn) { events[name] = fn; },
    get cookie() { return [...cookies].map(([key, value]) => key + '=' + value).join('; '); },
    set cookie(value) {
      const [key, val] = value.split(';')[0].split('=');
      if (value.includes('Max-Age=0;')) { cookies.delete(key); deletedCookies.push(value); }
      else cookies.set(key, val);
    },
  };
  const window = {
    location: { hostname, href: 'https://' + hostname + '/', protocol: 'https:', reload() { reloads++; } },
    localStorage: {
      getItem(key) { if (storageFails) throw new Error('blocked'); return storage.get(key) || null; },
      setItem(key, value) { if (storageFails) throw new Error('blocked'); storage.set(key, value); },
    },
    addEventListener(name, fn) { windowEvents[name] = fn; },
  };
  vm.runInNewContext(source, { window, document, Date, Number, JSON });
  events.DOMContentLoaded();
  return {
    window, scripts, storage, cookies, deletedCookies, section,
    reloads: () => reloads,
    click(action) { section.listeners.click({ target: { closest: () => ({ dataset: { cookieAction: action } }) } }); },
    storageEvent() { cookies.set('ivan_cookie_consent_v1', encodeURIComponent(storage.get(KEY))); windowEvents.storage({ key: KEY }); },
  };
}
const saved = analytics => ({ version: 1, analytics, expires: Date.now() + 86400000 });

test('no choice: denied defaults precede all tags, no Google request', () => {
  const b = browser();
  assert.equal(b.scripts.length, 0);
  const command = b.window.dataLayer[0];
  assert.equal(command[0], 'consent');
  assert.equal(command[1], 'default');
  for (const value of Object.values(command[2])) assert.equal(value, 'denied');
  assert.equal(b.section.hidden, false);
});
test('accept: grant analytics only and load GTM exactly once', () => {
  const b = browser();
  b.click('accept'); b.click('accept');
  assert.deepEqual(b.scripts, ['https://www.googletagmanager.com/gtm.js?id=GTM-MQMHWNXK']);
  const commands = b.window.dataLayer.filter(value => value[0] === 'consent' && value[1] === 'update');
  assert.equal(commands[0][2].analytics_storage, 'granted');
  assert.equal(commands[0][2].ad_storage, 'denied');
  assert.equal(commands[0][2].ad_user_data, 'denied');
  assert.equal(commands[0][2].ad_personalization, 'denied');
  assert.equal(b.window.dataLayer.filter(value => value.event === 'ivan_analytics_consent_granted').length, 1);
  assert.equal(JSON.parse(b.storage.get(KEY)).analytics, 'granted');
});
test('reject: no Google request, persist denial, keep necessary cookies', () => {
  const b = browser(); b.click('reject');
  assert.equal(b.scripts.length, 0);
  assert.equal(JSON.parse(b.storage.get(KEY)).analytics, 'denied');
  assert.ok(b.deletedCookies.some(value => value.startsWith('_ga=')));
  assert.ok(b.deletedCookies.every(value => !value.startsWith('necessary=')));
});
test('withdraw after acceptance: stop GA, clear cookies, reload to unload Google', () => {
  const b = browser(); b.click('accept'); b.click('reject');
  assert.equal(b.window['ga-disable-G-F9YPDKJ64X'], true);
  assert.equal(b.reloads(), 1);
  assert.equal(JSON.parse(b.storage.get(KEY)).analytics, 'denied');
});
test('saved acceptance loads GTM; saved rejection never loads it', () => {
  const accepted = browser({ stored: saved('granted') });
  const rejected = browser({ stored: saved('denied') });
  assert.equal(accepted.scripts.length, 1);
  assert.equal(rejected.scripts.length, 0);
  assert.equal(accepted.section.hidden, true);
  assert.equal(rejected.section.hidden, true);
});
test('expired or blocked storage defaults to denial and shows banner', () => {
  for (const args of [{ stored: { version: 1, analytics: 'granted', expires: 1 } }, { storageFails: true }]) {
    const b = browser(args);
    assert.equal(b.scripts.length, 0);
    assert.equal(b.section.hidden, false);
    b.click('reject');
    assert.equal(b.scripts.length, 0);
  }
});
test('preferences reopen the choice without granting consent', () => {
  const b = browser({ stored: saved('denied') });
  b.window.IvanCookies.open();
  assert.equal(b.section.hidden, false);
  assert.equal(b.scripts.length, 0);
});
test('withdrawal in another tab applies immediately', () => {
  const b = browser({ stored: saved('granted') });
  b.storage.set(KEY, JSON.stringify(saved('denied')));
  b.storageEvent();
  assert.equal(b.window['ga-disable-G-F9YPDKJ64X'], true);
  assert.equal(b.reloads(), 1);
});
test('static preview can show banner but never sends production analytics', () => {
  const b = browser({ hostname: 'anniefilio.github.io' }); b.click('accept');
  assert.equal(b.scripts.length, 0);
});
test('no direct installation of Analytics in site code', () => {
  assert.ok(!source.includes('googletagmanager.com/gtag/js'));
  assert.ok(!source.includes("gtag('config'"));
  assert.ok(!source.includes('google-analytics.com'));
});
