/* ============================================================
   Repères du jour (5.8) — les ancres cochables qui nourrissent
   l'avion.

   Principes :
   - `essential: true`  → fait partie de l'essentiel santé.
     Quand TOUS les essentiels sont faits, l'avion décolle.
   - `essential: false` → extra ; fait gagner de l'altitude.
   - `type: 'check'`    → simple coche.
   - `type: 'counter'`  → objectif chiffré atteint en plusieurs
     fois (eau, pompes, dents). Considéré "fait" à `target`.
   - `group`            → matin | journee | soir (regroupement
     visuel sur l'écran Aujourd'hui).
   - `space`            → espace de rattachement (lien "plonger").

   Facile à ajuster : ajoute/retire un objet, l'app suit.
   ============================================================ */

export const ANCHORS = [
  /* ---------- MATIN ---------- */
  {
    id: "visionMorning", group: "matin", type: "check", essential: false,
    label: "Vision claire du jour", hint: "Pose ton ancre : une intention simple.",
    icon: "compass", space: "today", ritual: true
  },
  {
    id: "mealMorning", group: "matin", type: "check", essential: true,
    label: "Petit-déjeuner", hint: "As-tu mangé un peu ce matin ?",
    icon: "meal", space: "meals"
  },
  {
    id: "minoxAM", group: "matin", type: "check", essential: true,
    label: "Minoxidil — matin", hint: "Puis visage à l'eau fraîche + crème.",
    icon: "drop", space: "care"
  },
  {
    id: "faceAM", group: "matin", type: "check", essential: false,
    label: "Visage — matin", hint: "Eau fraîche + crème hydratante.",
    icon: "face", space: "care"
  },

  /* ---------- JOURNÉE ---------- */
  {
    id: "mealMidday", group: "journee", type: "check", essential: true,
    label: "Déjeuner", hint: "Un vrai repas au milieu de la journée.",
    icon: "meal", space: "meals"
  },
  {
    id: "water", group: "journee", type: "counter", essential: true,
    target: 8, unit: "verre", step: 1,
    label: "Eau", hint: "2 L sur la journée — un verre à la fois.",
    icon: "bottle", space: "meals"
  },
  {
    id: "pushups", group: "journee", type: "counter", essential: true,
    target: 100, unit: "pompe", step: 10,
    label: "100 pompes", hint: "Réparties dans la journée, à ton rythme.",
    icon: "fire", space: "sport"
  },
  {
    id: "workout", group: "journee", type: "check", essential: false,
    label: "Séance du jour", hint: "Séance, marche ou repos.",
    icon: "dumbbell", space: "sport"
  },
  {
    id: "teeth", group: "journee", type: "counter", essential: false,
    target: 3, unit: "brossage", step: 1,
    label: "Dents", hint: "Objectif 3 fois.",
    icon: "tooth", space: "care"
  },
  {
    id: "meds", group: "journee", type: "check", essential: false,
    label: "Prises du jour", hint: "Traitement + compléments, à tes horaires.",
    icon: "pill", space: "meds"
  },
  {
    id: "breathDay", group: "journee", type: "check", essential: false,
    label: "Un temps calme", hint: "Cohérence cardiaque, 5 minutes.",
    icon: "breath", space: "breathing"
  },

  /* ---------- SOIR ---------- */
  {
    id: "mealEvening", group: "soir", type: "check", essential: true,
    label: "Dîner", hint: "De quoi recharger avant la nuit.",
    icon: "meal", space: "meals"
  },
  {
    id: "minoxPM", group: "soir", type: "check", essential: true,
    label: "Minoxidil — soir", hint: "Puis nettoyant + crème hydratante.",
    icon: "drop", space: "care"
  },
  {
    id: "facePM", group: "soir", type: "check", essential: false,
    label: "Visage — soir", hint: "Nettoyant + crème (nettoyant le soir seulement).",
    icon: "face", space: "care"
  },
  {
    id: "sleep", group: "soir", type: "check", essential: true,
    label: "Nuit correcte", hint: "Une nuit correcte.",
    icon: "moon", space: "today"
  },
  {
    id: "gratitude", group: "soir", type: "check", essential: false,
    label: "Une chose positive", hint: "Repense à un bon moment d'aujourd'hui.",
    icon: "heart", space: "today", ritual: true
  }
];

/* Index par id pour un accès rapide. */
export const ANCHOR_BY_ID = Object.fromEntries(ANCHORS.map((a) => [a.id, a]));

export const ESSENTIALS = ANCHORS.filter((a) => a.essential);
export const BONUSES = ANCHORS.filter((a) => !a.essential);

export const GROUPS = [
  { id: "matin",   label: "Matin",   sub: "Au réveil." },
  { id: "journee", label: "Journée", sub: "Dans la journée." },
  { id: "soir",    label: "Soir",    sub: "Avant la nuit." }
];

/* Un repère est-il "fait" pour un jour donné ? */
export function isAnchorDone(anchor, dayState) {
  if (!dayState) return false;
  if (anchor.type === "counter") {
    return (dayState.counters?.[anchor.id] || 0) >= anchor.target;
  }
  return !!dayState.checks?.[anchor.id];
}

/* Progression continue d'un repère (0..1), utile pour les jauges. */
export function anchorProgress(anchor, dayState) {
  if (anchor.type === "counter") {
    const v = dayState?.counters?.[anchor.id] || 0;
    return Math.max(0, Math.min(1, v / anchor.target));
  }
  return isAnchorDone(anchor, dayState) ? 1 : 0;
}
