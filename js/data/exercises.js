/* ============================================================
   Sport — bibliothèque de mouvements (liste resserrée ~15 pour
   que chacun ait une vraie animation), séances en rotation, et
   formats complet / express.

   100% faisable au poids du corps ; les variantes bande sont en
   option. Cadre : énergie, confiance, anti-stress. Progression
   suggérée par petites touches.
   ============================================================ */

export const EXERCISES = {
  pushup: {
    name: "Pompes", archetype: "pushup", band: false, anchor: false,
    dose: "3 × 8-12", cue: "Corps gainé, descends la poitrine près du sol.",
    tip: "Trop facile ? Mains plus serrées (diamant) ou pieds surélevés.",
    variants: "Inclinées (plus facile) · déclinées / diamant (plus dur)"
  },
  bandPress: {
    name: "Développé poitrine", archetype: "bandPress", band: true, anchor: true,
    dose: "3 × 12-15", cue: "Pousse devant toi, épaules basses.",
    tip: "Recule d'un pas ou empile deux tubes pour plus de tension.",
    bwAlt: "pushup"
  },
  overhead: {
    name: "Développé épaules", archetype: "overhead", band: true, anchor: false,
    dose: "3 × 12", cue: "Pousse au-dessus de la tête sans cambrer.",
    tip: "Monte le tempo de descente (3 s) pour corser un peu.",
    bwAlt: "pikePush"
  },
  row: {
    name: "Rowing", archetype: "row", band: true, anchor: true,
    dose: "3 × 12-15", cue: "Tire les coudes vers l'arrière, serre les omoplates.",
    tip: "Marque 1 s en position serrée pour plus de contrôle.",
    bwAlt: "superman"
  },
  pulldown: {
    name: "Tirage vertical", archetype: "pulldown", band: true, anchor: true,
    dose: "3 × 12", cue: "Tire vers le bas, poitrine ouverte.",
    tip: "Écarte un peu les mains pour cibler le dos.",
    bwAlt: "superman"
  },
  facePull: {
    name: "Face pull", archetype: "facePull", band: true, anchor: true,
    dose: "3 × 15", cue: "Tire vers le visage, coudes hauts.",
    tip: "Léger et propre vaut mieux que lourd et saccadé.",
    bwAlt: "wRaise"
  },
  curl: {
    name: "Curl biceps", archetype: "curl", band: true, anchor: false,
    dose: "3 × 12-15", cue: "Coudes fixes, monte sans balancer.",
    tip: "Descends en 3 s pour sentir le muscle travailler.",
    bwAlt: null
  },
  triceps: {
    name: "Extension triceps", archetype: "triceps", band: true, anchor: false,
    dose: "3 × 12-15", cue: "Coudes serrés, tends les bras vers le bas.",
    tip: "Garde une légère tension en haut, ne relâche pas tout.",
    bwAlt: "pushup"
  },
  squat: {
    name: "Squat", archetype: "squat", band: false, anchor: false,
    dose: "3 × 15", cue: "Assieds-toi vers l'arrière, genoux dans l'axe.",
    tip: "Plus dur : split squat bulgare (pied arrière sur un appui).",
    variants: "Sumo (pieds larges) · split squat bulgare (unilatéral)"
  },
  lunge: {
    name: "Fente", archetype: "lunge", band: false, anchor: false,
    dose: "3 × 10 / jambe", cue: "Grand pas, genou arrière vers le sol.",
    tip: "Ajoute une pause en bas, ou avance en marchant.",
    variants: "Avant · arrière · marchée"
  },
  hipThrust: {
    name: "Pont fessier", archetype: "hipThrust", band: false, anchor: false,
    dose: "3 × 15", cue: "Pousse dans les talons, serre les fessiers en haut.",
    tip: "Une jambe tendue pour augmenter l'intensité.",
    variants: "Deux jambes · une jambe"
  },
  calfRaise: {
    name: "Mollets debout", archetype: "calfRaise", band: false, anchor: false,
    dose: "3 × 20", cue: "Monte haut sur la pointe, contrôle la descente.",
    tip: "Sur une marche pour plus d'amplitude.",
  },
  plank: {
    name: "Gainage (planche)", archetype: "plank", band: false, anchor: false,
    dose: "3 × 30-45 s", cue: "Corps droit, abdos et fessiers serrés.",
    tip: "Allonge la tenue de 5 s quand c'est confortable.",
  },
  legRaise: {
    name: "Relevés de jambes", archetype: "legRaise", band: false, anchor: false,
    dose: "3 × 12", cue: "Bas du dos collé au sol, descends lentement.",
    tip: "Jambes pliées si le bas du dos décolle.",
  },
  hipAbduction: {
    name: "Abduction de hanche", archetype: "hipAbduction", band: true, anchor: false,
    dose: "3 × 15 / côté", cue: "Sangle de cheville, écarte sans pencher le buste.",
    tip: "Optionnel — utile pour la stabilité de la hanche.",
    optional: true, bwAlt: null
  },

  /* Alternatives poids du corps (sans bande / sans ancrage) */
  pikePush: { name: "Pike push-up", archetype: "overhead", band: false, anchor: false,
    dose: "3 × 8-10", cue: "Bassin haut, descends le sommet de la tête.", tip: "Pieds plus proches des mains pour corser." },
  superman: { name: "Superman", archetype: "row", band: false, anchor: false,
    dose: "3 × 12", cue: "Au sol, décolle bras et jambes, serre le dos.", tip: "Marque 1 s en haut." },
  wRaise: { name: "W au sol", archetype: "facePull", band: false, anchor: false,
    dose: "3 × 15", cue: "À plat ventre, bras en W, décolle les coudes.", tip: "Lent et contrôlé." }
};

/* Les trois types de séance qui tournent (jamais de calendrier figé). */
export const SESSIONS = [
  {
    id: "haut", name: "Haut du corps", emoji: "💪",
    sub: "Pousser + tirer — la bande brille ici.",
    complet: ["pushup", "bandPress", "overhead", "row", "pulldown", "facePull", "curl", "triceps"],
    express: ["pushup", "row", "overhead", "curl"]
  },
  {
    id: "bas", name: "Bas du corps + gainage", emoji: "🦵",
    sub: "Surtout au poids du corps.",
    complet: ["squat", "lunge", "hipThrust", "calfRaise", "plank", "legRaise"],
    express: ["squat", "lunge", "hipThrust", "plank"]
  },
  {
    id: "full", name: "Express full-body", emoji: "⚡",
    sub: "Jours courts ou basse énergie.",
    complet: ["pushup", "squat", "row", "lunge", "plank", "legRaise"],
    express: ["pushup", "squat", "plank"]
  }
];

/* Résout la liste d'exos d'une séance selon format + matériel.
   Sans ancrage / sans bande : on remplace par l'alternative au
   poids du corps quand elle existe. */
export function resolveExercises(session, { format, band, anchor }) {
  const ids = session[format] || session.complet;
  const out = [];
  for (const id of ids) {
    let ex = EXERCISES[id];
    if (!ex) continue;
    const needsSwap = (ex.band && !band) || (ex.anchor && !anchor);
    if (needsSwap && ex.bwAlt && EXERCISES[ex.bwAlt]) {
      ex = { ...EXERCISES[ex.bwAlt], swappedFrom: ex.name };
    }
    out.push({ id, ...ex });
  }
  return out;
}

export function sessionForIndex(i) {
  return SESSIONS[((i % SESSIONS.length) + SESSIONS.length) % SESSIONS.length];
}
