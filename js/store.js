/* ============================================================
   Store — persistance localStorage, schéma versionné & robuste.
   Petit émetteur d'événements pour que les écrans se redessinent
   quand l'état change. Aucune dépendance.
   ============================================================ */

import { SEED_COUNTRIES, DEFAULT_CITY_ID } from "./data/cities.js";

const KEY = "cdv:state";
const SCHEMA_VERSION = 1;

/* État par défaut — tout part propre et bienveillant. */
function defaultState() {
  return {
    version: SCHEMA_VERSION,
    createdAt: null,            // posé au premier run (timestamp passé en init)
    selectedCityId: DEFAULT_CITY_ID,
    countries: SEED_COUNTRIES,  // éditable depuis l'espace Voyage

    // Journal par jour : days[dayKey] = { checks:{}, counters:{} }
    days: {},

    // Sport : rotation des séances (index qui avance, jamais figé)
    sport: {
      rotationIndex: 0,         // pointe la prochaine séance
      format: "complet",        // 'complet' | 'express'
      anchor: true,             // point d'accroche de porte dispo ?
      band: true                // bande élastique dispo ?
    },

    // Prises & décalage — l'app est un OUTIL, pas un décideur.
    meds: {
      treatments: [],           // saisis par l'utilisateur (horaires du médecin)
      supplements: [],          // démarre vide, à remplir après feu vert médical
      // décalage de fuseau progressif, ENTIÈREMENT paramétrable :
      // direction (+1 = retarder / -1 = avancer), pas en h/jour, nb de
      // jours pour s'aligner, jour de départ. L'app applique ces
      // paramètres (issus du médecin) et VISUALISE — elle ne décide rien.
      shift: { enabled: false, direction: 1, stepHours: 1, days: 3, startDayKey: null }
    },

    // Réglages divers
    settings: {
      waterTarget: 8,           // verres (~2 L)
      reduceMotion: false
    },

    // Dernière météo connue (affichée hors-ligne avec sa date)
    weather: null,

    // Évènements déjà célébrés aujourd'hui (anti-répétition d'anim)
    celebrated: {}
  };
}

let state = null;
const listeners = new Set();

/* --- Chargement / migration --- */
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }

  if (!raw) return defaultState();

  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e) { console.warn("État illisible, réinitialisation douce.", e); return defaultState(); }

  return migrate(parsed);
}

/* Migration tolérante : on complète les champs manquants plutôt
   que de tout jeter, pour ne jamais perdre l'historique. */
function migrate(s) {
  const base = defaultState();
  const merged = { ...base, ...s };
  merged.version = SCHEMA_VERSION;
  merged.days = s.days || {};
  merged.countries = (Array.isArray(s.countries) && s.countries.length) ? s.countries : base.countries;
  merged.sport = { ...base.sport, ...(s.sport || {}) };
  merged.meds = { ...base.meds, ...(s.meds || {}) };
  merged.meds.shift = { ...base.meds.shift, ...((s.meds && s.meds.shift) || {}) };
  merged.settings = { ...base.settings, ...(s.settings || {}) };
  merged.celebrated = s.celebrated || {};
  return merged;
}

let saveTimer = null;
function persist() {
  // Debounce léger pour ne pas marteler le disque pendant les taps.
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn("Sauvegarde impossible (quota ?)", e); }
  }, 120);
}

/* --- API publique --- */
export function initStore(now = Date.now()) {
  state = load();
  if (!state.createdAt) state.createdAt = now;
  persist();
  return state;
}

export function getState() { return state; }

/* Souscription : renvoie une fonction de désinscription. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(reason) {
  for (const fn of listeners) {
    try { fn(state, reason); } catch (e) { console.error(e); }
  }
}

/* Mutation centralisée : on applique, on sauve, on notifie. */
export function update(mutator, reason = "update") {
  mutator(state);
  persist();
  emit(reason);
}

/* --- Helpers jour --- */
export function ensureDay(dayKey) {
  if (!state.days[dayKey]) {
    state.days[dayKey] = { checks: {}, counters: {} };
  }
  return state.days[dayKey];
}

export function getDay(dayKey) {
  return state.days[dayKey] || { checks: {}, counters: {} };
}

export function toggleCheck(dayKey, anchorId) {
  update((s) => {
    const day = (s.days[dayKey] ||= { checks: {}, counters: {} });
    day.checks[anchorId] = !day.checks[anchorId];
  }, "toggle:" + anchorId);
}

export function addToCounter(dayKey, anchorId, amount, max = Infinity) {
  update((s) => {
    const day = (s.days[dayKey] ||= { checks: {}, counters: {} });
    const cur = day.counters[anchorId] || 0;
    day.counters[anchorId] = Math.max(0, Math.min(max, cur + amount));
  }, "counter:" + anchorId);
}

export function setCounter(dayKey, anchorId, value) {
  update((s) => {
    const day = (s.days[dayKey] ||= { checks: {}, counters: {} });
    day.counters[anchorId] = Math.max(0, value);
  }, "counter:" + anchorId);
}

export function setCity(cityId) {
  update((s) => { s.selectedCityId = cityId; }, "city");
}

/* --- Prises (médoc + compléments) ---
   L'app ne fait que stocker ce que l'utilisateur saisit. */
export function addMedItem(item) {
  update((s) => {
    const list = item.kind === "supplement" ? s.meds.supplements : s.meds.treatments;
    list.push(item);
  }, "meds:add");
}
export function updateMedItem(id, patch) {
  update((s) => {
    for (const list of [s.meds.treatments, s.meds.supplements]) {
      const it = list.find((x) => x.id === id);
      if (it) Object.assign(it, patch);
    }
  }, "meds:update");
}
export function removeMedItem(id) {
  update((s) => {
    s.meds.treatments = s.meds.treatments.filter((x) => x.id !== id);
    s.meds.supplements = s.meds.supplements.filter((x) => x.id !== id);
  }, "meds:remove");
}
export function setShift(patch) {
  update((s) => { Object.assign(s.meds.shift, patch); }, "meds:shift");
}

/* Marque une prise comme prise (ou non) pour un horaire donné ;
   ajuste le stock restant si le suivi est activé. */
export function toggleMedTaken(dayKey, id, time) {
  update((s) => {
    const d = (s.days[dayKey] ||= { checks: {}, counters: {} });
    const key = `med:${id}@${time}`;
    const was = !!d.checks[key];
    d.checks[key] = !was;
    const it = [...s.meds.treatments, ...s.meds.supplements].find((x) => x.id === id);
    if (it && it.stockOn && typeof it.stock === "number") {
      it.stock = Math.max(0, it.stock + (was ? 1 : -1));
    }
  }, "meds:taken");
}

/* Marque un évènement comme déjà célébré ce jour (anti-doublon d'anim). */
export function markCelebrated(dayKey, key) {
  update((s) => {
    (s.celebrated[dayKey] ||= {})[key] = true;
  }, "celebrate");
}
export function wasCelebrated(dayKey, key) {
  return !!state.celebrated?.[dayKey]?.[key];
}
