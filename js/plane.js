/* ============================================================
   L'avion — métaphore centrale.

   La complétion de l'essentiel fait accélérer l'avion sur la
   piste ; quand TOUT l'essentiel est fait, il décolle. Les
   extras font gagner de l'altitude.

   Aucun chiffre n'est montré ici : l'avion avance,
   les lignes de vitesse, puis la montée.
   ============================================================ */

const PLANE_SVG = `
<svg class="plane-svg" viewBox="0 0 240 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="fuselage" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffaf2"/>
      <stop offset="0.55" stop-color="#f3e7d6"/>
      <stop offset="1" stop-color="#d9c3a3"/>
    </linearGradient>
    <linearGradient id="wing" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9d8c0"/>
      <stop offset="1" stop-color="#c9ab84"/>
    </linearGradient>
    <linearGradient id="tail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e0794a"/>
      <stop offset="1" stop-color="#c75b39"/>
    </linearGradient>
  </defs>
  <!-- aile arrière (profondeur) -->
  <path class="p-wing-back" d="M96 52 L150 52 L132 70 L92 64 Z" fill="url(#wing)" opacity="0.78"/>
  <!-- fuselage -->
  <path class="p-body" d="M18 50
    C 18 41, 30 36, 54 34
    L 176 31
    C 200 30, 222 38, 230 48
    C 222 54, 200 58, 176 58
    L 40 60
    C 26 60, 18 56, 18 50 Z" fill="url(#fuselage)"/>
  <!-- nez : reflet -->
  <path d="M210 44 C 220 45, 226 48, 228 50 C 224 47, 217 45, 210 46 Z" fill="#ffffff" opacity="0.6"/>
  <!-- hublots -->
  <g fill="#9fb4d8" opacity="0.85">
    <circle cx="70" cy="45" r="2.4"/><circle cx="86" cy="44" r="2.4"/>
    <circle cx="102" cy="43.5" r="2.4"/><circle cx="118" cy="43" r="2.4"/>
    <circle cx="134" cy="42.5" r="2.4"/><circle cx="150" cy="42" r="2.4"/>
    <circle cx="166" cy="41.5" r="2.4"/>
  </g>
  <!-- dérive (queue colorée) -->
  <path class="p-tail" d="M20 50 L24 18 C 25 13, 30 12, 33 16 L52 48 Z" fill="url(#tail)"/>
  <!-- aile avant -->
  <path class="p-wing" d="M104 50 L168 50 L150 76 L96 60 Z" fill="url(#wing)"/>
  <!-- ligne déco -->
  <path d="M30 53 L210 50" stroke="#e0794a" stroke-width="2.2" opacity="0.5" fill="none" stroke-linecap="round"/>
</svg>`;

export function createPlaneScene() {
  const scene = document.createElement("div");
  scene.className = "plane-scene";
  scene.innerHTML = `
    <div class="plane-sky-bonus" aria-hidden="true">
      <span class="bonus-cloud c1"></span>
      <span class="bonus-cloud c2"></span>
      <span class="bonus-cloud c3"></span>
    </div>
    <div class="speed-lines" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="plane-wrap">
      ${PLANE_SVG}
      <div class="plane-shadow" aria-hidden="true"></div>
    </div>
    <div class="runway" aria-hidden="true">
      <div class="runway-line"></div>
      <div class="runway-edge left"></div>
      <div class="runway-edge right"></div>
    </div>
  `;
  return scene;
}

/* Met à jour la scène.
   essential : 0..1 (part de l'essentiel faite)
   bonus     : 0..1 (part des extras faite)
   onTakeoff : callback déclenché une seule fois au décollage */
export function updatePlane(scene, { essential, bonus }) {
  const wrap = scene.querySelector(".plane-wrap");
  const speed = scene.querySelector(".speed-lines");
  const airborne = essential >= 1;

  scene.classList.toggle("is-airborne", airborne);
  scene.classList.toggle("is-rolling", !airborne && essential > 0.02);

  if (!airborne) {
    // Roulage : l'avion avance de gauche (parking) vers le point d'envol.
    // Eased pour une montée en puissance crédible.
    const e = essential;
    const x = e * 58;                 // % de déplacement le long de la piste
    const tilt = e > 0.6 ? (e - 0.6) * 6 : 0; // léger cabré juste avant l'envol
    wrap.style.transform = `translateX(${x}%) translateY(0) rotate(${-tilt}deg)`;
    speed.style.opacity = (0.15 + e * 0.85).toFixed(2);
    speed.style.setProperty("--speed", (0.3 + e * 1.4).toFixed(2));
    scene.style.setProperty("--altitude", "0px");
  } else {
    // En vol : position d'envol + altitude selon les extras.
    const lift = 64 + bonus * 96;     // px de montée
    const climb = 10 + bonus * 6;     // angle de montée
    wrap.style.transform = `translateX(64%) translateY(${-lift}px) rotate(${-climb}deg)`;
    speed.style.opacity = "0.9";
    speed.style.setProperty("--speed", "1.8");
    scene.style.setProperty("--altitude", lift + "px");
  }

  scene.dataset.bonus = bonus.toFixed(2);
}

/* Petite célébration de décollage (halo + secousse douce). */
export function celebrateTakeoff(scene) {
  scene.classList.remove("takeoff-burst");
  // reflow pour rejouer l'animation
  void scene.offsetWidth;
  scene.classList.add("takeoff-burst");
}
