// Service worker : le site fonctionne hors-ligne une fois visité. La page et le code
// se prennent d'abord sur le réseau (pour recevoir les mises à jour) avec repli sur le
// cache ; les images et polices se prennent d'abord dans le cache et s'y ajoutent au
// fil des visites (les 1 200 visuels ne se téléchargent qu'à la demande).
const CACHE = 'shelf-trainer-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

function estStatique(url) {
  return /\.(webp|png|jpg|svg|woff2?|ttf)$/.test(url.pathname) || url.hostname.includes('gstatic')
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (estStatique(url)) {
    e.respondWith(
      caches.match(e.request).then(
        (trouve) =>
          trouve ||
          fetch(e.request).then((rep) => {
            if (rep.ok) caches.open(CACHE).then((c) => c.put(e.request, rep.clone()))
            return rep
          }),
      ),
    )
    return
  }
  e.respondWith(
    fetch(e.request)
      .then((rep) => {
        if (rep.ok && url.origin === location.origin) caches.open(CACHE).then((c) => c.put(e.request, rep.clone()))
        return rep
      })
      .catch(() => caches.match(e.request).then((trouve) => trouve || caches.match('./'))),
  )
})
