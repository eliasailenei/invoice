// sw.js
const CACHE = 'invoicer-v1';
const ASSETS = [
  '/', '/index.html', '/builder.html', '/view.html', '/config.html',
  '/db.js', '/manifest.webmanifest', '/style.css', '/sw.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return r;
      }).catch(() => caches.match(request))
    );
  } else {
    e.respondWith(
      caches.match(request).then(hit => hit || fetch(request))
    );
  }
});
