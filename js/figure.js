/* ============================================================
   Figures d'exercices — motion-design stylisé.

   Une silhouette articulée (tête, tronc, bras, avant-bras, cuisse,
   jambe) en capsules arrondies, animée en CSS par archétype de
   mouvement. Pour les exos à la bande, un "trajet de bande" en
   pointillés fléchés montre la direction de la résistance.

   Cinématique : transform-box: fill-box + origine au sommet de
   chaque segment (pose initiale droite) => les segments enfants
   pivotent correctement avec leur parent.
   ============================================================ */

/* Trajets de bande (pointillés + flèche) par archétype, dans le
   repère de la figure (viewBox 0 0 200 220). */
const BAND_PATHS = {
  bandPress:   `<path class="band" d="M150 92 H78"/><path class="band-anchor" d="M150 70 V114"/>`,
  overhead:    `<path class="band" d="M98 150 V64"/><path class="band-anchor" d="M76 150 H120"/>`,
  row:         `<path class="band" d="M52 96 H104"/><path class="band-anchor" d="M52 74 V118"/>`,
  pulldown:    `<path class="band" d="M98 36 V96"/><path class="band-anchor" d="M74 36 H122"/>`,
  facePull:    `<path class="band" d="M54 70 L104 84"/><path class="band-anchor" d="M54 50 V92"/>`,
  curl:        `<path class="band" d="M98 184 V120"/>`,
  triceps:     `<path class="band" d="M98 40 V92"/><path class="band-anchor" d="M76 40 H120"/>`,
  hipAbduction:`<path class="band" d="M120 168 H150"/><path class="band-anchor" d="M150 150 V186"/>`
};

/* Silhouette debout générique (profil, face à droite). */
function rigStanding(archetype, withBand) {
  const band = withBand && BAND_PATHS[archetype] ? `<g class="band-wrap">${BAND_PATHS[archetype]}</g>` : "";
  return `
  <svg class="fig fig--${archetype}" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line class="ground" x1="20" y1="186" x2="180" y2="186"/>
    ${band}
    <!-- membres arrière (profondeur, statiques) -->
    <path class="limb faint" d="M98 120 V184"/>
    <path class="limb faint" d="M98 66 V126"/>

    <g class="body">
      <!-- jambe avant -->
      <g class="legf">
        <path class="limb" d="M98 120 V152"/>
        <g class="lower">
          <path class="limb" d="M98 152 V184"/>
          <path class="foot" d="M98 184 H114"/>
        </g>
      </g>

      <!-- tronc + tête + bras -->
      <g class="torso">
        <path class="spine" d="M98 120 V66"/>
        <circle class="head" cx="98" cy="50" r="14"/>
        <g class="arm">
          <path class="limb" d="M98 66 V98"/>
          <g class="fore">
            <path class="limb" d="M98 98 V128"/>
            <circle class="hand" cx="98" cy="130" r="5"/>
          </g>
        </g>
      </g>
    </g>
  </svg>`;
}

/* Pose au sol pour pompes / planche (bras fixes, corps qui descend). */
function rigFloor(archetype) {
  return `
  <svg class="fig fig--${archetype}" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line class="ground" x1="20" y1="180" x2="180" y2="180"/>
    <!-- bras d'appui fixes -->
    <g class="arm-floor">
      <path class="limb" d="M140 104 V178"/>
      <circle class="hand" cx="140" cy="178" r="5"/>
    </g>
    <!-- corps gainé qui descend/remonte -->
    <g class="floorbody">
      <circle class="head" cx="158" cy="100" r="13"/>
      <path class="spine" d="M148 104 L70 120"/>
      <path class="limb" d="M70 120 L40 174"/>
      <path class="foot" d="M40 174 H56"/>
    </g>
  </svg>`;
}

/* Relevés de jambes / abdos — dos au sol, jambes qui montent. */
function rigLegRaise() {
  return `
  <svg class="fig fig--legRaise" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line class="ground" x1="20" y1="180" x2="180" y2="180"/>
    <circle class="head" cx="40" cy="158" r="12"/>
    <path class="spine" d="M50 162 H110"/>
    <g class="legs-up">
      <path class="limb" d="M110 162 L150 162"/>
      <path class="foot" d="M150 162 H164"/>
    </g>
  </svg>`;
}

/* Pont fessier / hip thrust — pose dédiée (dos au sol, hanches montent). */
function rigHipThrust() {
  return `
  <svg class="fig fig--hipThrust" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line class="ground" x1="20" y1="180" x2="180" y2="180"/>
    <g class="hipbody">
      <circle class="head" cx="48" cy="150" r="12"/>
      <path class="spine" d="M58 152 L110 130"/>   <!-- dos -->
      <g class="hips">
        <path class="limb" d="M110 130 L150 150"/> <!-- cuisse -->
        <path class="limb" d="M150 150 V178"/>     <!-- tibia -->
        <path class="foot" d="M150 178 H166"/>
      </g>
    </g>
  </svg>`;
}

export function buildFigure(archetype, opts = {}) {
  if (archetype === "hipThrust") return rigHipThrust();
  if (archetype === "legRaise") return rigLegRaise();
  if (archetype === "pushup" || archetype === "plank") return rigFloor(archetype);
  return rigStanding(archetype, opts.band);
}
