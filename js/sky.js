/* ============================================================
   Ciel dynamique — pièce héros.

   Le ciel se redessine selon l'HEURE LOCALE de la ville :
   aube, plein jour, coucher, nuit étoilée, avec transitions
   douces. Les couleurs sont interpolées en continu entre des
   keyframes, puis posées en variables CSS (--sky-*) ; @property
   + transition CSS font glisser le changement en douceur.

   Le soleil (ou la lune) suit un arc. Les étoiles scintillent
   sur un petit canvas (léger, pensé batterie).
   ============================================================ */

import { localNow } from "./time.js";

/* --- Keyframes du ciel : heure -> ambiance ---
   top/mid/low : dégradé vertical. sun : disque. glow : halo.
   star : densité d'étoiles 0..1. sil : silhouette des reliefs.
   amb : lumière ambiante diffuse. */
const KEYS = [
  { h: 0.0,  top: "#0d0a22", mid: "#171338", low: "#241a45", sun: "#cdd6ff", glow: "rgba(120,140,220,0.18)", star: 1.0, sil: "#0b0820", amb: "rgba(120,140,220,0.05)" },
  { h: 4.0,  top: "#0f0c28", mid: "#1c1740", low: "#2c2152", sun: "#cdd6ff", glow: "rgba(130,150,220,0.20)", star: 0.95, sil: "#0d0a24", amb: "rgba(130,150,220,0.05)" },
  { h: 5.4,  top: "#1d2150", mid: "#3a2d60", low: "#6b4a6e", sun: "#ffd9c2", glow: "rgba(230,150,140,0.30)", star: 0.45, sil: "#171336", amb: "rgba(230,160,150,0.06)" },
  { h: 6.4,  top: "#3a3a78", mid: "#8a5a86", low: "#e58a5c", sun: "#fff0d8", glow: "rgba(248,170,110,0.55)", star: 0.10, sil: "#3a2d52", amb: "rgba(248,180,130,0.10)" },
  { h: 7.6,  top: "#4f6fae", mid: "#a886a4", low: "#f3b277", sun: "#fff6e6", glow: "rgba(250,200,150,0.45)", star: 0.0,  sil: "#5a6790", amb: "rgba(255,220,180,0.10)" },
  { h: 12.5, top: "#3f74c4", mid: "#7fa6d6", low: "#dfe7ec", sun: "#fffaf0", glow: "rgba(255,245,220,0.55)", star: 0.0,  sil: "#8aa0bd", amb: "rgba(255,250,235,0.10)" },
  { h: 16.5, top: "#4a6db0", mid: "#b98e8a", low: "#f3c081", sun: "#fff3d6", glow: "rgba(252,200,140,0.50)", star: 0.0,  sil: "#7d7596", amb: "rgba(255,225,180,0.10)" },
  { h: 18.3, top: "#5a4a86", mid: "#bf6a5e", low: "#f0894a", sun: "#ffe6c2", glow: "rgba(248,150,90,0.60)",  star: 0.05, sil: "#4a3360", amb: "rgba(248,170,110,0.12)" },
  { h: 19.4, top: "#2f2a64", mid: "#7d4b7e", low: "#d8744f", sun: "#ffd2b0", glow: "rgba(220,120,90,0.40)",  star: 0.35, sil: "#241a46", amb: "rgba(230,140,110,0.08)" },
  { h: 20.6, top: "#181442", mid: "#3c2c63", low: "#7a466a", sun: "#e8d6ff", glow: "rgba(150,120,200,0.25)", star: 0.75, sil: "#130f30", amb: "rgba(150,130,200,0.06)" },
  { h: 22.0, top: "#0f0c2c", mid: "#1d1742", low: "#332353", sun: "#cdd6ff", glow: "rgba(120,140,220,0.18)", star: 0.95, sil: "#0c0926", amb: "rgba(120,140,220,0.05)" }
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function lerp(a, b, t) { return a + (b - a) * t; }
function mixHex(a, b, t) {
  const x = hexToRgb(a), y = hexToRgb(b);
  return `rgb(${Math.round(lerp(x[0], y[0], t))}, ${Math.round(lerp(x[1], y[1], t))}, ${Math.round(lerp(x[2], y[2], t))})`;
}
/* Mix de chaînes rgba(...) pour les halos. */
function parseRgba(s) {
  const m = s.match(/rgba?\(([^)]+)\)/);
  const p = m[1].split(",").map((x) => parseFloat(x));
  return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
}
function mixRgba(a, b, t) {
  const x = parseRgba(a), y = parseRgba(b);
  return `rgba(${Math.round(lerp(x[0], y[0], t))}, ${Math.round(lerp(x[1], y[1], t))}, ${Math.round(lerp(x[2], y[2], t))}, ${lerp(x[3], y[3], t).toFixed(3)})`;
}

/* Trouve les deux keyframes encadrant l'heure (avec wrap 24h). */
function frameFor(hourFloat) {
  const n = KEYS.length;
  let prev = KEYS[n - 1], next = KEYS[0];
  for (let i = 0; i < n; i++) {
    if (KEYS[i].h <= hourFloat) prev = KEYS[i];
    if (KEYS[i].h > hourFloat) { next = KEYS[i]; break; }
    if (i === n - 1) next = KEYS[0];
  }
  // Distance avec gestion du passage minuit
  let span = next.h - prev.h;
  if (span <= 0) span += 24;
  let pos = hourFloat - prev.h;
  if (pos < 0) pos += 24;
  const t = span === 0 ? 0 : Math.max(0, Math.min(1, pos / span));
  // Adoucissement (smoothstep) pour des transitions plus organiques
  const ts = t * t * (3 - 2 * t);
  return { prev, next, t: ts };
}

/* Position de l'astre. Jour : arc soleil. Nuit : arc lune. */
function bodyPosition(hourFloat) {
  const isDay = hourFloat >= 6.2 && hourFloat <= 18.6;
  if (isDay) {
    const t = (hourFloat - 6.2) / (18.6 - 6.2); // 0..1 lever->coucher
    const x = 8 + t * 84;                        // % gauche -> droite
    const y = 78 - Math.sin(t * Math.PI) * 64;   // altitude (haut au midi)
    return { x, y, isDay: true };
  }
  // Nuit : la lune traverse de 20h à 6h
  let nt = hourFloat >= 18.6 ? (hourFloat - 18.6) : (hourFloat + 5.4);
  const span = 24 - 18.6 + 6.2; // ~11.6h
  const t = Math.max(0, Math.min(1, nt / span));
  const x = 12 + t * 76;
  const y = 70 - Math.sin(t * Math.PI) * 52;
  return { x, y, isDay: false };
}

let starCtx, starCanvas, stars = [], rafId = null, lastStarT = 0;
let currentTz = null;
let onPhaseChange = null;
let lastPhase = null;

function buildStars(w, h) {
  const count = Math.round((w * h) / 9000);
  stars = [];
  // Distribution pseudo-aléatoire déterministe (pas de Math.random global requis)
  let seed = 1337;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rnd() * w,
      y: rnd() * h * 0.7,            // surtout dans la moitié haute
      r: 0.5 + rnd() * 1.3,
      base: 0.3 + rnd() * 0.7,
      tw: 0.6 + rnd() * 1.8,         // vitesse de scintillement
      ph: rnd() * Math.PI * 2
    });
  }
}

function resizeStars() {
  if (!starCanvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = starCanvas.clientWidth, h = starCanvas.clientHeight;
  starCanvas.width = Math.round(w * dpr);
  starCanvas.height = Math.round(h * dpr);
  starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildStars(w, h);
}

function drawStars(opacity, tSeconds) {
  const w = starCanvas.clientWidth, h = starCanvas.clientHeight;
  starCtx.clearRect(0, 0, w, h);
  if (opacity <= 0.01) return;
  for (const s of stars) {
    const tw = 0.5 + 0.5 * Math.sin(tSeconds * s.tw + s.ph);
    const a = opacity * s.base * (0.55 + 0.45 * tw);
    starCtx.globalAlpha = a;
    starCtx.beginPath();
    starCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    starCtx.fillStyle = "#fdf6ec";
    starCtx.fill();
  }
  starCtx.globalAlpha = 1;
}

/* Applique l'ambiance d'une heure donnée aux variables CSS. */
function apply(hourFloat) {
  const { prev, next, t } = frameFor(hourFloat);
  const root = document.documentElement.style;

  root.setProperty("--sky-top", mixHex(prev.top, next.top, t));
  root.setProperty("--sky-mid", mixHex(prev.mid, next.mid, t));
  root.setProperty("--sky-low", mixHex(prev.low, next.low, t));
  root.setProperty("--sun-color", mixHex(prev.sun, next.sun, t));
  root.setProperty("--sun-glow", mixRgba(prev.glow, next.glow, t));
  root.setProperty("--silhouette", mixHex(prev.sil, next.sil, t));
  root.setProperty("--ambient", mixRgba(prev.amb, next.amb, t));

  const starOp = lerp(prev.star, next.star, t);
  root.setProperty("--star-opacity", starOp.toFixed(3));

  const body = bodyPosition(hourFloat);
  root.setProperty("--sun-x", body.x.toFixed(2) + "%");
  root.setProperty("--sun-y", body.y.toFixed(2) + "%");

  // Couleur du disque : soleil chaud le jour, lune froide la nuit
  document.documentElement.classList.toggle("is-night", !body.isDay);

  // Met à jour la teinte de la barre d'état (PWA)
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute("content", mixHex(prev.top, next.top, t));

  // Notifie un changement de phase global (matin/jour/soir/nuit)
  const phase = hourFloat < 5 ? "nuit" : hourFloat < 11 ? "matin"
    : hourFloat < 18 ? "jour" : hourFloat < 22 ? "soir" : "nuit";
  if (phase !== lastPhase) {
    lastPhase = phase;
    if (onPhaseChange) onPhaseChange(phase);
  }

  return starOp;
}

let starOpacity = 0;
let baseTime = 0;

/* Boucle d'animation : étoiles (léger) + recalcul lent du ciel. */
function loop(ts) {
  if (!baseTime) baseTime = ts;
  const tSeconds = (ts - baseTime) / 1000;

  // Recalcule le ciel ~2x/min seulement (économie batterie)
  if (tSeconds - lastStarT > 20 || lastStarT === 0) {
    const local = localNow(currentTz);
    starOpacity = apply(local.hourFloat);
    lastStarT = tSeconds;
  }
  // Le scintillement, lui, est continu mais peu coûteux
  if (starOpacity > 0.02) drawStars(starOpacity, tSeconds);
  else if (starCtx) starCtx.clearRect(0, 0, starCanvas.clientWidth, starCanvas.clientHeight);

  rafId = requestAnimationFrame(loop);
}

/* --- API --- */
export function initSky(tz, opts = {}) {
  currentTz = tz;
  onPhaseChange = opts.onPhaseChange || null;
  starCanvas = document.getElementById("stars");
  if (starCanvas) {
    starCtx = starCanvas.getContext("2d");
    resizeStars();
    window.addEventListener("resize", resizeStars, { passive: true });
  }
  // Pose immédiate, SANS glissement, pour afficher les bonnes
  // couleurs dès le premier paint ; les transitions reprennent après.
  document.documentElement.classList.add("sky-instant");
  const local = localNow(currentTz);
  starOpacity = apply(local.hourFloat);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.classList.remove("sky-instant");
  }));

  if (rafId) cancelAnimationFrame(rafId);
  baseTime = 0; lastStarT = 0;
  rafId = requestAnimationFrame(loop);

  // Re-pose le ciel quand l'app revient au premier plan
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { lastStarT = 0; }
  });
}

export function setSkyCity(tz) {
  currentTz = tz;
  lastStarT = 0; // force un recalcul au prochain tick
  const local = localNow(currentTz);
  starOpacity = apply(local.hourFloat);
}
