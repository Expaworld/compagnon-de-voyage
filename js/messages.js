/* ============================================================
   Micro-copy — ton sobre, tutoiement, phrases courtes.
   Montrer, pas commenter.
   ============================================================ */

import { localNow } from "./time.js";

/* Ligne d'état de la journée sur l'écran Aujourd'hui. Factuelle. */
export function reassurance({ essential, bonus, part }) {
  if (essential >= 1 && bonus >= 0.6) {
    return "Journée pleine.";
  }
  if (essential >= 1) {
    return "L'essentiel est fait.";
  }
  if (essential >= 0.6) {
    return "Plus qu'un ou deux repères.";
  }
  if (essential >= 0.25) {
    return "En route.";
  }
  if (part === "soir" || part === "nuit") {
    return "Coche ce que tu peux.";
  }
  if (part === "matin") {
    return "Nouvelle journée.";
  }
  return "Un repère après l'autre.";
}

/* Marqueurs ponctuels, factuels. */
export const CELEBRATIONS = {
  takeoff: "L'essentiel est fait.",
  pushups: "100 pompes.",
  water: "2 litres.",
  allBonus: "Journée pleine."
};

/* Relances à l'OUVERTURE de l'app (pas de notif système).
   Rappels factuels selon l'heure locale et ce qui manque. */
export function openingNudges({ city, dayState, anchors }) {
  const local = localNow(city.tz);
  const h = local.hourFloat;
  const nudges = [];

  const checked = (id) => !!dayState?.checks?.[id];
  const counter = (id) => dayState?.counters?.[id] || 0;

  if (h >= 8 && h < 11.5 && !checked("mealMorning")) {
    nudges.push("Petit-déjeuner.");
  }
  if (h >= 12.5 && h < 15.5 && !checked("mealMidday")) {
    nudges.push("C'est l'heure du déjeuner.");
  }
  if (h >= 19 && h < 22.5 && !checked("mealEvening")) {
    nudges.push("Pense au dîner.");
  }

  const waterTarget = anchors.find((a) => a.id === "water")?.target || 8;
  if (h >= 11 && counter("water") < Math.ceil(waterTarget * 0.4)) {
    nudges.push("Bois un peu d'eau. Gourde + filtre.");
  }

  if (h >= 8 && h < 12 && !checked("minoxAM")) {
    nudges.push("Minoxidil du matin.");
  }
  if (h >= 20 && !checked("minoxPM")) {
    nudges.push("Minoxidil du soir, puis nettoyant + crème.");
  }

  if (h >= 22 || h < 4) {
    nudges.push("La nuit approche.");
  }

  return nudges;
}

/* Format de date lisible et chaleureux (jeudi 14 juin). */
export function prettyDate(local) {
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  // weekday vient en court anglais via Intl ; on recalcule via un Date local approximé
  const wd = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }[local.weekday] ?? 0;
  return `${days[wd]} ${local.d} ${months[local.mo - 1]}`;
}
