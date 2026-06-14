/* ============================================================
   Respiration — couche calme.
   QUATRE exercices, TOUS lents et apaisants, à expiration longue.

   CONTRAINTE DE SÉCURITÉ (impérative) :
   uniquement des techniques douces. JAMAIS d'hyperventilation,
   jamais de respiration rapide forcée, jamais de rétention de
   souffle prolongée ou intense (pas de breath of fire, Wim Hof,
   bhastrika, etc.), y compris pour l'exercice de "réveil".

   Chaque phase : { type, secs, scale, label, sub }
   - type 'inhale' | 'exhale' | 'sip' (mini 2e inspiration)
   - scale = taille cible de l'orbe (l'orbe se dilate à l'inspire,
     se contracte à l'expire). Aucune phase de rétention longue.
   ============================================================ */

export const BREATHING = [
  {
    id: "sleep",
    name: "Endormissement",
    emoji: "🌙",
    accent: "#6f6bb0",
    tagline: "Inspire 4 s, longue expiration 8 s.",
    when: "Le soir, pour glisser dans le sommeil.",
    suggestedSecs: 240,
    phases: [
      { type: "inhale", secs: 4, scale: 1.5,  label: "Inspire",  sub: "par le nez" },
      { type: "exhale", secs: 8, scale: 0.88, label: "Expire",   sub: "tout doucement, par la bouche" }
    ]
  },
  {
    id: "calm",
    name: "Anti-stress",
    emoji: "🌬️",
    accent: "#5e9bb0",
    tagline: "Soupir physiologique : deux inspires, longue expire.",
    when: "Quand la tension monte. 1 à 3 fois suffisent souvent.",
    suggestedSecs: 120,
    phases: [
      { type: "inhale", secs: 2.4, scale: 1.4,  label: "Inspire",       sub: "par le nez" },
      { type: "sip",    secs: 0.9, scale: 1.62, label: "Encore un peu",  sub: "petite 2e inspiration" },
      { type: "exhale", secs: 6,   scale: 0.9,  label: "Expire",         sub: "longuement, par la bouche" }
    ]
  },
  {
    id: "wake",
    name: "Réveil",
    emoji: "🌅",
    accent: "#d98a5a",
    tagline: "Calme et tonique : inspire un peu plus ample.",
    when: "Le matin, pour s'éveiller en douceur.",
    note: "Reste lent et confortable — jamais rapide ni forcé.",
    suggestedSecs: 120,
    phases: [
      { type: "inhale", secs: 4.5, scale: 1.55, label: "Inspire", sub: "ample, par le nez" },
      { type: "exhale", secs: 3.5, scale: 1.02, label: "Expire",  sub: "tranquille" }
    ]
  },
  {
    id: "coherence",
    name: "Cohérence cardiaque",
    emoji: "💛",
    accent: "#c9a24a",
    tagline: "5 s inspire / 5 s expire, 5 minutes.",
    when: "Au quotidien — matin, midi et fin d'après-midi.",
    suggestedSecs: 300,
    phases: [
      { type: "inhale", secs: 5, scale: 1.5,  label: "Inspire", sub: "par le nez" },
      { type: "exhale", secs: 5, scale: 0.92, label: "Expire",  sub: "par la bouche ou le nez" }
    ]
  }
];

export const BREATHING_BY_ID = Object.fromEntries(BREATHING.map((b) => [b.id, b]));

/* Durée d'un cycle complet (somme des phases). */
export function cycleSecs(ex) {
  return ex.phases.reduce((s, p) => s + p.secs, 0);
}
