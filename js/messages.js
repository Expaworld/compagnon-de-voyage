/* ============================================================
   Micro-copy — ton de compagnon, tutoiement, jamais culpabilisant.
   Une journée plus calme compte aussi. On encourage, on ne juge pas.
   ============================================================ */

import { localNow } from "./time.js";

/* Phrase qui rassure sur l'écran Aujourd'hui, selon l'avancement
   et le moment de la journée. Aucun chiffre, aucune évaluation. */
export function reassurance({ essential, bonus, part }) {
  if (essential >= 1 && bonus >= 0.6) {
    return "Tout est là, et même un peu plus. Tu voles haut aujourd'hui — profite.";
  }
  if (essential >= 1) {
    return "Tu as fait l'essentiel, c'est très bien. L'avion a décollé. Le reste, c'est du bonus.";
  }
  if (essential >= 0.6) {
    return "Tu y es presque. Encore un ou deux repères et l'avion s'envole.";
  }
  if (essential >= 0.25) {
    return "C'est lancé, tranquillement. Chaque repère coché fait avancer l'avion.";
  }
  if (part === "soir" || part === "nuit") {
    return "Une journée plus calme, ça compte aussi. Coche ce que tu peux, sans pression.";
  }
  if (part === "matin") {
    return "Nouvelle journée. On se pose un repère à la fois — fais ça, et tout va bien.";
  }
  return "Prends ton temps. Un repère après l'autre, l'avion avance avec toi.";
}

/* Petites célébrations ponctuelles (jamais des scores). */
export const CELEBRATIONS = {
  takeoff: "Décollage ✈️ Tu as fait l'essentiel.",
  pushups: "100 pompes bouclées 🔥 Solide, vraiment.",
  water: "Gourde au complet 💧 Bien joué.",
  allBonus: "Altitude maximale. Belle journée pleine."
};

/* Relances à l'OUVERTURE de l'app (pas de notif système).
   Renvoie une liste de rappels chaleureux selon ce qui manque
   et l'heure locale. */
export function openingNudges({ city, dayState, anchors }) {
  const local = localNow(city.tz);
  const h = local.hourFloat;
  const nudges = [];

  const checked = (id) => !!dayState?.checks?.[id];
  const counter = (id) => dayState?.counters?.[id] || 0;

  // Repas, calés sur l'heure locale, re-proposés gentiment
  if (h >= 8 && h < 11.5 && !checked("mealMorning")) {
    nudges.push("Pense à manger un petit quelque chose ce matin.");
  }
  if (h >= 12.5 && h < 15.5 && !checked("mealMidday")) {
    nudges.push("C'est l'heure du déjeuner par chez toi — un vrai repas te fera du bien.");
  }
  if (h >= 19 && h < 22.5 && !checked("mealEvening")) {
    nudges.push("Un dîner avant la nuit, même simple, ça recharge.");
  }

  // Eau, sans agressivité
  const waterTarget = anchors.find((a) => a.id === "water")?.target || 8;
  if (h >= 11 && counter("water") < Math.ceil(waterTarget * 0.4)) {
    nudges.push("Pense à boire un peu d'eau (sûre) — gourde + filtre.");
  }

  // Minoxidil matin / soir
  if (h >= 8 && h < 12 && !checked("minoxAM")) {
    nudges.push("Minoxidil du matin, si ce n'est pas déjà fait.");
  }
  if (h >= 20 && !checked("minoxPM")) {
    nudges.push("Minoxidil du soir, puis nettoyant + crème.");
  }

  // Sommeil — repère doux
  if (h >= 22 || h < 4) {
    nudges.push("La nuit approche. Une session calme avant de dormir ?");
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
