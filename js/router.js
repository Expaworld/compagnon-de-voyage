/* ============================================================
   Routeur minimal — Aujourd'hui est l'accueil (90% de l'usage),
   les autres espaces sont des "plongées" ponctuelles.
   Chaque écran est un module exposant render(ctx) -> Node.
   ============================================================ */

import { icon } from "./icons.js";

/* Ordre & libellés des espaces dans la barre du bas. */
export const SPACES = [
  { id: "today",     label: "Aujourd'hui", short: "Auj.",    icon: "plane" },
  { id: "meals",     label: "Repas & eau", short: "Repas",   icon: "meal" },
  { id: "sport",     label: "Sport",       short: "Sport",   icon: "dumbbell" },
  { id: "care",      label: "Soin",        short: "Soin",    icon: "drop" },
  { id: "breathing", label: "Respiration", short: "Souffle", icon: "lungs" },
  { id: "travel",    label: "Voyage",      short: "Voyage",  icon: "globe" },
  { id: "meds",      label: "Prises",      short: "Prises",  icon: "pill" }
];

let screens = {};
let current = "today";
let mountCtx = null;

export function registerScreens(map) { screens = map; }

export function getRoute() { return current; }

function renderNav(navEl, ctx) {
  navEl.innerHTML = "";
  for (const s of SPACES) {
    const btn = document.createElement("button");
    btn.className = "nav-btn" + (s.id === current ? " is-active" : "");
    btn.setAttribute("aria-label", s.label);
    btn.innerHTML = `${icon(s.icon)}<span>${s.short}</span><i class="nav-ind"></i>`;
    btn.addEventListener("click", () => navigate(s.id, ctx));
    navEl.append(btn);
  }
}

export function navigate(routeId, ctx = mountCtx) {
  if (!screens[routeId]) routeId = "today";
  current = routeId;
  mountCtx = ctx;

  const host = document.getElementById("screen");
  const nav = document.getElementById("nav");

  // Re-render écran
  host.innerHTML = "";
  const node = screens[routeId].render(ctx);
  node.classList.add("screen-enter");
  host.append(node);
  host.scrollTop = 0;

  // Maj nav
  renderNav(nav, ctx);

  // Hook post-montage éventuel (animations différées)
  if (typeof node._afterMount === "function") {
    requestAnimationFrame(() => node._afterMount());
  }
}

export function mount(ctx) {
  mountCtx = ctx;
  navigate(current, ctx);
}

/* Re-render de l'écran courant (sur changement d'état). */
export function refresh(ctx = mountCtx) {
  // Certains écrans gèrent leur propre mise à jour fine ; par défaut
  // on laisse l'écran décider via ctx.onStateChange.
  const host = document.getElementById("screen");
  const node = host.firstElementChild;
  if (node && typeof node._update === "function") {
    node._update();
  }
}
