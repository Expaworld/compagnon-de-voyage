/* ============================================================
   Historique & série (streak).

   Un "jour complet" = tous les repères essentiels faits (la même
   condition qui fait décoller l'avion).

   Série indulgente :
   - un jour incomplet ne remet pas forcément à zéro ;
   - 2 jokers par semaine (repos / voyage) absorbent les jours
     incomplets sans casser la série ;
   - la journée en cours (aujourd'hui) ne casse jamais la série
     tant qu'elle n'est pas terminée.

   Aucun chiffre culpabilisant : on expose la série, le record, et
   un calendrier. Pas de compte des jours manqués.
   ============================================================ */

import { ESSENTIALS, isAnchorDone } from "./data/anchors.js";

/* ---- helpers de dates sur 'YYYY-MM-DD' (comparaison lexicale ok) ---- */
function parseKey(k) { const [y, m, d] = k.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); }
function keyOf(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
export function addDays(k, n) { const d = parseKey(k); d.setUTCDate(d.getUTCDate() + n); return keyOf(d); }
/* Lundi = 0 … Dimanche = 6 */
export function dow(k) { return (parseKey(k).getUTCDay() + 6) % 7; }
function mondayKey(k) { return addDays(k, -dow(k)); }

/* Activité quelconque dans la journée (au moins un repère touché). */
function hasActivity(ds) {
  if (!ds) return false;
  if (ds.checks && Object.values(ds.checks).some(Boolean)) return true;
  if (ds.counters && Object.values(ds.counters).some((v) => v > 0)) return true;
  return false;
}

/* Statut intrinsèque d'un jour. */
export function dayStatus(ds) {
  if (!ds) return "empty";
  let done = 0;
  for (const a of ESSENTIALS) if (isAnchorDone(a, ds)) done++;
  if (done === ESSENTIALS.length) return "complete";
  if (done > 0 || hasActivity(ds)) return "partial";
  return "empty";
}

/* Combien d'essentiels faits / total (pour une éventuelle jauge). */
export function essentialRatio(ds) {
  if (!ds) return 0;
  let done = 0;
  for (const a of ESSENTIALS) if (isAnchorDone(a, ds)) done++;
  return done / ESSENTIALS.length;
}

/* Calcule série courante, record, et le détail par jour. */
export function computeHistory(days, todayKey) {
  const keys = Object.keys(days);
  let firstKey = todayKey;
  for (const k of keys) if (k < firstKey) firstKey = k;

  const statusByKey = {};
  const jokerSet = new Set();
  const jokerUsed = {};        // mondayKey -> nombre de jokers consommés
  let run = 0, longest = 0;

  let cursor = firstKey;
  while (cursor <= todayKey) {
    const st = dayStatus(days[cursor]);
    statusByKey[cursor] = st;
    const isToday = cursor === todayKey;

    if (st === "complete") {
      run++;
    } else if (!isToday) {
      if (run > 0) {
        // Un joker protège une série en cours (2 max par semaine).
        const wk = mondayKey(cursor);
        if ((jokerUsed[wk] || 0) < 2) { jokerUsed[wk] = (jokerUsed[wk] || 0) + 1; jokerSet.add(cursor); }
        else { run = 0; }
      }
      // run === 0 : pas de série à protéger, on n'entame pas de joker
    }
    // isToday incomplet : en cours, ne casse rien, n'incrémente pas

    if (run > longest) longest = run;
    cursor = addDays(cursor, 1);
  }

  return { current: run, longest, statusByKey, jokerSet, firstKey };
}

/* Jokers restants cette semaine (pour l'affichage, sobre). */
export function jokersLeftThisWeek(days, todayKey) {
  const monday = mondayKey(todayKey);
  const { jokerSet } = computeHistory(days, todayKey);
  let used = 0;
  for (const k of jokerSet) if (mondayKey(k) === monday) used++;
  return Math.max(0, 2 - used);
}
