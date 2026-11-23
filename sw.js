/* Tercüman no longer uses a service worker.
   On iPhone, a home-screen web app controlled by a service worker cannot open the live camera (WebKit bug 252465),
   so this file only removes the one installed by versions 1.5.0 to 1.6.3: it deletes its caches, unregisters itself
   and reloads open windows so they run without it. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('tercuman-')).map(k => caches.delete(k)));
    await self.registration.unregister();
    const wins = await self.clients.matchAll({ type: 'window' });
    wins.forEach(w => { try { w.navigate(w.url); } catch (err) {} });
  })());
});
