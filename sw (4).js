// ⬇ Güncelleme yaparken bu versiyonu değiştirin
const CACHE_VERSION = '2025-04-17-v2';
const CACHE_NAME = 'kelime-ayiklama-' + CACHE_VERSION;
const STATIC_ASSETS = [
  '/kelime_ayiklama/manifest.json',
  '/kelime_ayiklama/icon-192.png',
  '/kelime_ayiklama/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const oldCaches = keys.filter(k => k !== CACHE_NAME && k.startsWith('kelime-ayiklama-'));
      const isUpdate = oldCaches.length > 0;

      // Eski cache'leri sil
      await Promise.all(oldCaches.map(k => caches.delete(k)));

      // Önce tüm sekmeleri devral
      await self.clients.claim();

      // Güncelleme ise tüm açık sekmelere bildir
      if (isUpdate) {
        const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      }
    })()
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isHTML = url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        })
      )
    );
  }
});
