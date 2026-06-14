/* ============================================================
   Service worker — offline-first.
   Précache l'app shell + assets pour que TOUT fonctionne hors
   ligne (sauf la météo, qui passe par le réseau et dont la
   dernière valeur est gardée côté app dans le localStorage).
   ============================================================ */

const VERSION = "cdv-v7";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",

  "./css/tokens.css",
  "./css/base.css",
  "./css/sky.css",
  "./css/components.css",
  "./css/today.css",
  "./css/travel.css",
  "./css/meals.css",
  "./css/sport.css",
  "./css/care.css",
  "./css/breathing.css",
  "./css/medhub.css",

  "./js/app.js",
  "./js/router.js",
  "./js/store.js",
  "./js/sky.js",
  "./js/plane.js",
  "./js/time.js",
  "./js/icons.js",
  "./js/ui.js",
  "./js/messages.js",
  "./js/weather.js",
  "./js/figure.js",
  "./js/data/cities.js",
  "./js/data/anchors.js",
  "./js/data/meals.js",
  "./js/data/exercises.js",
  "./js/data/breathing.js",
  "./js/screens/today.js",
  "./js/screens/travel.js",
  "./js/screens/meals.js",
  "./js/screens/sport.js",
  "./js/screens/care.js",
  "./js/screens/breathing.js",
  "./js/screens/meds.js",
  "./js/screens/placeholder.js",

  "./assets/icons/icon.svg",
  "./assets/icons/icon-maskable.svg",
  "./assets/icons/apple-touch-icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-512-maskable.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Météo & API externes : réseau d'abord, jamais bloquant hors-ligne.
  if (url.hostname.includes("open-meteo.com")) {
    e.respondWith(fetch(req).catch(() => new Response("{}", {
      headers: { "Content-Type": "application/json" }
    })));
    return;
  }

  // App shell & assets locaux : cache d'abord, réseau en secours,
  // puis on met à jour le cache discrètement (stale-while-revalidate).
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }
});
