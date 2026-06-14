/* ============================================================
   app.js — orchestrateur. Branche le store, le ciel, la météo,
   l'horloge locale et la navigation. Construit le contexte (ctx)
   partagé par tous les écrans.
   ============================================================ */

import { initStore, getState, subscribe } from "./store.js";
import { flattenCities, findCity, DEFAULT_CITY_ID } from "./data/cities.js";
import { localNow, dayKeyFor, clockLabel } from "./time.js";
import { initSky, setSkyCity } from "./sky.js";
import { fetchWeather } from "./weather.js";
import { registerScreens, mount, navigate, refresh, getRoute } from "./router.js";
import { ANCHORS } from "./data/anchors.js";

import * as today from "./screens/today.js";
import * as travel from "./screens/travel.js";
import * as meals from "./screens/meals.js";
import * as sport from "./screens/sport.js";
import * as care from "./screens/care.js";
import * as breathing from "./screens/breathing.js";
import * as meds from "./screens/meds.js";

function resolveCity() {
  const s = getState();
  return findCity(s.countries, s.selectedCityId)
      || findCity(s.countries, DEFAULT_CITY_ID)
      || flattenCities(s.countries)[0];
}

/* Contexte partagé — objet MUTABLE : on met à jour ses champs en
   place pour que les écrans déjà montés voient les changements. */
const ctx = {
  city: null,
  local: null,
  dayKey: null,
  weather: null,
  now: Date.now(),
  navigate: (id) => navigate(id, ctx),
  changeCity,
  touch: () => refresh(ctx)
};

function syncCtx() {
  ctx.city = resolveCity();
  ctx.now = Date.now();
  ctx.local = localNow(ctx.city.tz);
  ctx.dayKey = dayKeyFor(ctx.city.tz);
  ctx.weather = getState().weather;
}

async function changeCity(cityId) {
  const { setCity } = await import("./store.js");
  setCity(cityId);
  syncCtx();
  setSkyCity(ctx.city.tz);          // ciel se recale sur l'heure locale
  refresh(ctx);                     // re-rendu de l'écran courant
  // Recharge la météo de la nouvelle ville (réseau)
  fetchWeather(ctx.city, Date.now()).then((w) => {
    if (w) { ctx.weather = w; refresh(ctx); }
  });
}

/* Horloge vivante : met à jour les éléments [data-clock-tz]. */
function tickClocks() {
  ctx.now = Date.now();
  ctx.local = localNow(ctx.city.tz);
  document.querySelectorAll("[data-clock-tz]").forEach((node) => {
    const tz = node.getAttribute("data-clock-tz");
    node.textContent = clockLabel(localNow(tz));
  });
  // Bascule de jour locale (minuit) -> recale dayKey & re-render
  const dk = dayKeyFor(ctx.city.tz);
  if (dk !== ctx.dayKey) { ctx.dayKey = dk; refresh(ctx); }
}

function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((e) =>
        console.warn("SW non enregistré", e));
    });
  }
}

async function boot() {
  initStore(Date.now());
  syncCtx();

  // Écrans
  registerScreens({
    today,
    travel,
    meals,
    sport,
    care,
    breathing,
    meds
  });

  // Ciel dynamique (pièce héros) piloté par l'heure locale de la ville
  initSky(ctx.city.tz);

  // Premier rendu (avec deep-link éventuel ?route=)
  mount(ctx);
  const wanted = new URLSearchParams(location.search).get("route");
  if (wanted) navigate(wanted, ctx);

  // Le store notifie -> on rafraîchit l'écran courant
  subscribe(() => { ctx.weather = getState().weather; refresh(ctx); });

  // Horloge locale
  tickClocks();
  setInterval(tickClocks, 20000);

  // Météo : récupère à l'ouverture (si en ligne), sinon dernière connue
  fetchWeather(ctx.city, Date.now()).then((w) => {
    if (w) { ctx.weather = w; refresh(ctx); }
  });

  // Reprise au premier plan : recale heure + tente la météo
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      tickClocks();
      fetchWeather(ctx.city, Date.now()).then((w) => { if (w) { ctx.weather = w; refresh(ctx); } });
    }
  });

  // Retour en ligne -> rafraîchit la météo
  window.addEventListener("online", () => {
    fetchWeather(ctx.city, Date.now()).then((w) => { if (w) { ctx.weather = w; refresh(ctx); } });
  });

  registerSW();
}

boot();
