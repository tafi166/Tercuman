/* Tercüman service worker: the app opens without internet.
   Keep VERSION equal to APP_VERSION in index.html; changing it makes phones pick up the new files. */
const VERSION = '1.6.1';
const SHELL = 'tercuman-shell-' + VERSION;
const LIBS = 'tercuman-libs-v1';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './fonts/unbounded-latin-900-normal.woff2',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png'
];

/* libraries, models and fonts never change at a given address, so once saved they are served from the phone */
const LIB_HOSTS = ['cdn.jsdelivr.net', 'storage.googleapis.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'tfhub.dev', 'www.kaggle.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('tercuman-shell-') && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* translation requests always go to the network: an old answer is never useful */
  if (url.hostname.includes('translate') || url.hostname.includes('mymemory')) return;

  /* the app itself: newest from the network, the saved copy when offline */
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }

  if (LIB_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) {
    e.respondWith(
      caches.open(LIBS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') c.put(req, res.clone());
        return res;
      })))
    );
  }
});
