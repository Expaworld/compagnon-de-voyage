/* ============================================================
   Espace Respiration.
   Un orbe guide se dilate à l'inspire, se contracte à l'expire,
   au rythme exact de l'exercice choisi. Quatre techniques douces
   (voir data/breathing.js). Aucune rétention longue, aucun rythme
   rapide forcé — sécurité d'abord.
   ============================================================ */

import { el, haptic, toast } from "../ui.js";
import { icon } from "../icons.js";
import { BREATHING, BREATHING_BY_ID } from "../data/breathing.js";
import { update as storeUpdate, getDay } from "../store.js";

const R = 118;                       // rayon de l'anneau de progression
const C = 2 * Math.PI * R;           // circonférence

export function render(ctx) {
  // Coupe toute session précédente encore active.
  stopEngine();

  const root = el("div", { class: "breathing screen-pad" });
  let current = BREATHING_BY_ID[lastExId] || BREATHING[3]; // cohérence par défaut
  root.style.setProperty("--accent", current.accent);

  root.append(el("div", { class: "topbar" }, [
    el("button", { class: "city back", onClick: () => { stopEngine(); ctx.navigate("today"); } }, [
      el("span", { class: "back-chev", html: icon("chevron") }), el("span", { text: "Aujourd'hui" })
    ]),
    el("div", { class: "weather-pill" }, [el("span", { text: "🫧" }), el("span", { text: "Respiration" })])
  ]));

  root.append(el("h1", { class: "h-hero lead", text: "Respirer, se poser." }));

  /* Sélecteur */
  const picker = el("div", { class: "breath-picker" });
  const chips = [];
  for (const ex of BREATHING) {
    const chip = el("button", { class: "breath-chip" + (ex.id === current.id ? " on" : "") }, [
      el("div", { class: "em", text: ex.emoji }),
      el("div", { class: "nm", text: ex.name }),
      el("div", { class: "tg", text: ex.tagline })
    ]);
    chip.addEventListener("click", () => {
      if (ex.id === current.id) return;
      current = ex; lastExId = ex.id;
      root.style.setProperty("--accent", current.accent);
      chips.forEach((c) => c.el.classList.toggle("on", c.id === ex.id));
      resetSession();
      paintMeta();
      haptic(6);
    });
    chips.push({ id: ex.id, el: chip });
    picker.append(chip);
  }
  root.append(picker);

  /* Scène de l'orbe */
  const stage = el("div", { class: "breath-stage" });
  stage.innerHTML = `
    <div class="orb-aura"></div>
    <svg class="orb-progress" viewBox="0 0 250 250" aria-hidden="true">
      <circle class="track" cx="125" cy="125" r="${R}"></circle>
      <circle class="prog"  cx="125" cy="125" r="${R}"
        stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"></circle>
    </svg>
    <div class="orb-wrap">
      <div class="orb-ring r2"></div>
      <div class="orb-ring r1"></div>
      <div class="orb-core"></div>
    </div>
    <div class="orb-center">
      <div class="phase">Prêt ?</div>
      <div class="phase-sub">Installe-toi confortablement.</div>
      <div class="count"></div>
    </div>`;
  root.append(stage);

  const orbWrap = stage.querySelector(".orb-wrap");
  const prog = stage.querySelector(".prog");
  const phaseEl = stage.querySelector(".phase");
  const subEl = stage.querySelector(".phase-sub");
  const countEl = stage.querySelector(".count");

  /* Contrôles */
  const startBtn = el("button", { class: "breath-start", text: "Commencer" });
  const resetBtn = el("button", { class: "breath-reset", text: "Stop" });
  root.append(el("div", { class: "breath-controls" }, [startBtn, resetBtn]));

  const meta = el("div", { class: "breath-meta" });
  const whenEl = el("div", { class: "when" });
  const elapsedEl = el("div", { class: "elapsed" });
  meta.append(whenEl, elapsedEl);
  root.append(meta);

  root.append(el("div", { class: "breath-safety", html:
    "Respiration <b>douce</b> uniquement. Si tu te sens étourdi, reviens à un souffle normal. " +
    "Pas d'hyperventilation, pas de rétention forcée." }));

  /* --- Moteur de session (local au render) --- */
  const session = {
    orbWrap, prog, phaseEl, subEl, countEl, startBtn, elapsedEl,
    get ex() { return current; }
  };

  startBtn.addEventListener("click", () => {
    if (running) pauseSession(session);
    else startSession(session, ctx);
  });
  resetBtn.addEventListener("click", () => { resetSession(); paintMeta(); haptic(6); });

  function paintMeta() {
    whenEl.textContent = current.when;
    const mins = Math.round(current.suggestedSecs / 60);
    elapsedEl.textContent = running || elapsedMs > 0
      ? `${fmt(elapsedMs)} · suggéré ~${mins} min`
      : `Suggéré ~${mins} min`;
  }

  function resetSession() {
    stopEngine();
    orbWrap.style.transition = "transform 800ms var(--ease-out)";
    orbWrap.style.transform = "scale(0.95)";
    prog.style.transition = "none";
    prog.style.strokeDashoffset = C.toFixed(1);
    phaseEl.textContent = "Prêt ?";
    subEl.textContent = "Installe-toi confortablement.";
    countEl.textContent = "";
    startBtn.textContent = "Commencer";
  }

  paintMeta();

  // Aucune perturbation par les rafraîchissements du store.
  root._update = () => {};
  return root;
}

/* ---- État moteur au niveau module (une seule session à la fois) ---- */
let lastExId = "coherence";
let phaseTimer = null, tickTimer = null, running = false;
let phaseIdx = 0, cycles = 0, elapsedMs = 0, startStamp = 0, suggestedHit = false;

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function stopEngine() {
  if (phaseTimer) { clearTimeout(phaseTimer); phaseTimer = null; }
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  running = false;
  phaseIdx = 0; cycles = 0; elapsedMs = 0; suggestedHit = false;
}

function startSession(s, ctx) {
  running = true;
  s.startBtn.textContent = "Pause";
  startStamp = performance.now() - elapsedMs;
  haptic(8);

  tickTimer = setInterval(() => {
    elapsedMs = performance.now() - startStamp;
    s.elapsedEl.textContent = `${fmt(elapsedMs)} · suggéré ~${Math.round(s.ex.suggestedSecs / 60)} min`;
    // Franchissement doux de la durée suggérée (jamais imposé)
    if (!suggestedHit && elapsedMs >= s.ex.suggestedSecs * 1000) {
      suggestedHit = true;
      toast("Belle session. Tu peux continuer ou t'arrêter, comme tu le sens.");
      markBreathDone(ctx);
    }
  }, 250);

  runPhase(s, ctx);
}

function pauseSession(s) {
  running = false;
  s.startBtn.textContent = "Reprendre";
  if (phaseTimer) { clearTimeout(phaseTimer); phaseTimer = null; }
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  // Fige l'orbe à sa taille courante (laisse le transform en place)
  s.subEl.textContent = "En pause — reprends quand tu veux.";
}

function runPhase(s, ctx) {
  // Si l'écran a été quitté, on arrête tout proprement.
  if (!document.body.contains(s.orbWrap)) { stopEngine(); return; }

  const ex = s.ex;
  const ph = ex.phases[phaseIdx];

  // Orbe : dilate / contracte sur la durée exacte de la phase
  s.orbWrap.style.transition = `transform ${ph.secs}s ${ph.type === "exhale" ? "cubic-bezier(0.45,0,0.55,1)" : "cubic-bezier(0.4,0,0.6,1)"}`;
  s.orbWrap.style.transform = `scale(${ph.scale})`;

  // Texte
  s.phaseEl.textContent = ph.label;
  s.subEl.textContent = ph.sub;
  s.countEl.textContent = `Cycle ${cycles + 1}`;

  // Anneau de progression : se remplit sur la durée de la phase
  s.prog.style.transition = "none";
  s.prog.style.strokeDashoffset = C.toFixed(1);
  // reflow pour repartir de zéro
  void s.prog.getBoundingClientRect();
  s.prog.style.transition = `stroke-dashoffset ${ph.secs}s linear`;
  s.prog.style.strokeDashoffset = "0";

  // Vibration très discrète au changement de phase
  haptic(ph.type === "exhale" ? 10 : 6);

  phaseTimer = setTimeout(() => {
    phaseIdx++;
    if (phaseIdx >= ex.phases.length) { phaseIdx = 0; cycles++; }
    if (running) runPhase(s, ctx);
  }, ph.secs * 1000);
}

/* Marque le repère "Un temps calme" (breathDay) comme fait. */
function markBreathDone(ctx) {
  storeUpdate((st) => {
    const d = (st.days[ctx.dayKey] ||= { checks: {}, counters: {} });
    d.checks.breathDay = true;
  }, "breath");
}
