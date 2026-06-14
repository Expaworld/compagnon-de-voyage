/* ============================================================
   Espace Repas & eau.
   « As-tu mangé ? » — trois repas en ancres douces, relances
   calées sur l'heure locale, jamais de culpabilité. Eau : une
   gourde qui se remplit vers 2 L (tap-to-add), poussée douce
   quand il fait chaud / en altitude.
   ============================================================ */

import { el, toast, haptic } from "../ui.js";
import { icon } from "../icons.js";
import { getDay, toggleCheck, addToCounter, wasCelebrated, markCelebrated } from "../store.js";
import { MEAL_SLOTS, MEAL_IDEAS, mealStatus } from "../data/meals.js";
import { ANCHOR_BY_ID } from "../data/anchors.js";
import { hydrationHint } from "../weather.js";

const GLASS_L = 0.25;            // un verre ≈ 0,25 L → 8 verres = 2 L
const GOURDE_GLASSES = 3;        // une gourde ≈ 0,75 L

/* SVG gourde avec liquide qui monte (vague animée). */
function bottleSVG() {
  return `
  <svg class="bottle-svg" viewBox="0 0 120 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7fd0e0"/>
        <stop offset="1" stop-color="#3f8fc4"/>
      </linearGradient>
      <clipPath id="bottleClip">
        <path d="M30 56 Q30 46 42 46 L78 46 Q90 46 90 56 L90 196 Q90 210 76 210 L44 210 Q30 210 30 196 Z"/>
      </clipPath>
    </defs>

    <!-- eau (clippée à l'intérieur) -->
    <g clip-path="url(#bottleClip)">
      <g class="liquid-wrap">
        <path class="wave w1" d="M0 58 C 24 48 44 48 60 58 S 100 68 120 58 L120 240 L0 240 Z" fill="url(#water)"/>
        <path class="wave w2" d="M0 58 C 24 68 44 68 60 58 S 100 48 120 58 L120 240 L0 240 Z" fill="url(#water)"/>
      </g>
    </g>

    <!-- bouchon -->
    <rect x="48" y="20" width="24" height="20" rx="5" fill="#c75b39"/>
    <rect x="44" y="34" width="32" height="10" rx="4" fill="#e0794a"/>

    <!-- contour de la gourde -->
    <path d="M30 56 Q30 46 42 46 L78 46 Q90 46 90 56 L90 196 Q90 210 76 210 L44 210 Q30 210 30 196 Z"
      fill="none" stroke="rgba(255,250,242,0.5)" stroke-width="2.5"/>
    <!-- reflet -->
    <path d="M38 64 Q36 120 40 188" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

export function render(ctx) {
  const { dayKey, local } = ctx;
  const h = local.hourFloat;
  const root = el("div", { class: "meals screen-pad" });

  /* En-tête */
  root.append(el("div", { class: "topbar" }, [
    el("button", { class: "city back", onClick: () => ctx.navigate("today") }, [
      el("span", { class: "back-chev", html: icon("chevron") }), el("span", { text: "Aujourd'hui" })
    ]),
    el("div", { class: "weather-pill" }, [el("span", { text: "🍽️" }), el("span", { text: "Repas & eau" })])
  ]));

  root.append(el("h1", { class: "h-hero", style: "margin:14px 4px 2px", text: "As-tu mangé ?" }));
  root.append(el("p", { class: "muted", style: "margin:0 4px 4px", text: "Pas « quoi manger ». Juste de quoi tenir l'énergie, sans y penser trop." }));

  /* ---------- Eau : la gourde ---------- */
  root.append(el("div", { class: "section-title", text: "Hydratation" }));

  const waterCard = el("div", { class: "water-card card" });
  const bottle = el("div", { class: "bottle", html: bottleSVG() });
  const liquidWrap = bottle.querySelector(".liquid-wrap");

  const waterInfo = el("div", { class: "water-info" });
  const litersEl = el("div", { class: "water-liters" });
  const waterSub = el("div", { class: "water-sub" });
  const hint = hydrationHint(ctx.weather, ctx.city);
  const hintEl = hint ? el("div", { class: "nudge", style: "margin-top:12px" }, [el("span", { class: "dot" }), hint]) : null;

  const btns = el("div", { class: "water-btns" });
  const minus = el("button", { class: "chip minus", text: "−", "aria-label": "retirer un verre" });
  const addGlass = el("button", { class: "chip", html: "💧 verre" });
  const addGourde = el("button", { class: "chip", html: "🧴 gourde" });
  btns.append(minus, addGlass, addGourde);

  waterInfo.append(litersEl, waterSub, hintEl);
  waterCard.append(bottle, waterInfo, btns);
  root.append(waterCard);

  const waterAnchor = ANCHOR_BY_ID.water;
  function paintWater() {
    const day = getDay(dayKey);
    const v = day.counters?.water || 0;
    const p = Math.min(1, v / waterAnchor.target);
    const interiorH = 154;
    liquidWrap.style.setProperty("--fillY", ((1 - p) * interiorH).toFixed(1) + "px");
    const liters = (v * GLASS_L).toFixed(2).replace(".", ",").replace(",00", "").replace(/,(\d)0$/, ",$1");
    litersEl.textContent = `≈ ${liters} L`;
    waterSub.textContent = v >= waterAnchor.target
      ? "Plein — objectif 2 L atteint, bien joué."
      : "Objectif tout doux : 2 L sur la journée.";
    waterCard.classList.toggle("is-full", v >= waterAnchor.target);
  }

  function bump(amount) {
    const before = getDay(dayKey).counters?.water || 0;
    addToCounter(dayKey, "water", amount, waterAnchor.target * 4);
    haptic(8);
    const after = getDay(dayKey).counters?.water || 0;
    if (before < waterAnchor.target && after >= waterAnchor.target && !wasCelebrated(dayKey, "water")) {
      toast("Gourde au complet 💧 Bien joué.");
      haptic([10, 30, 16]);
      markCelebrated(dayKey, "water");
    }
    paintWater();
  }
  addGlass.addEventListener("click", () => bump(1));
  addGourde.addEventListener("click", () => bump(GOURDE_GLASSES));
  minus.addEventListener("click", () => { addToCounter(dayKey, "water", -1, waterAnchor.target * 4); haptic(6); paintWater(); });

  /* Rappel eau sûre (discret) */
  root.append(el("div", { class: "safe-water", html:
    "💡 Privilégie une <b>eau sûre</b> : ta gourde + un filtre ou une purification. En cas de doute, eau en bouteille." }));

  /* ---------- Repas ---------- */
  root.append(el("div", { class: "section-title", text: "Les trois repas" }));
  const mealList = el("div", { class: "meal-list" });
  const mealRefs = [];
  for (const slot of MEAL_SLOTS) {
    const ref = buildMeal(slot, ctx, h);
    mealRefs.push(ref);
    mealList.append(ref.node);
  }
  root.append(mealList);

  /* ---------- Filet de sécurité : idées simples ---------- */
  const ideasWrap = el("div", { class: "ideas" });
  const ideasToggle = el("button", { class: "ideas-toggle" }, [
    el("span", { text: "Pas d'idée ? Trois repas tout simples" }),
    el("span", { class: "chev", html: icon("chevron") })
  ]);
  const ideasBody = el("div", { class: "ideas-body" });
  for (const idea of MEAL_IDEAS) {
    ideasBody.append(el("div", { class: "idea-card" }, [
      el("div", { class: "idea-head" }, [
        el("span", { class: "idea-emoji", text: idea.emoji }),
        el("span", { class: "idea-name", text: idea.name })
      ]),
      el("div", { class: "idea-items", text: idea.items.join(" · ") }),
      el("div", { class: "idea-note", text: idea.note })
    ]));
  }
  ideasToggle.addEventListener("click", () => {
    ideasWrap.classList.toggle("open");
    haptic(6);
  });
  ideasWrap.append(ideasToggle, ideasBody);
  root.append(el("div", { class: "section-title", text: "Filet de sécurité" }));
  root.append(ideasWrap);

  /* Premier rendu + mise à jour */
  paintWater();
  root._afterMount = () => {
    // part de vide puis monte (jolie animation d'arrivée)
    liquidWrap.style.setProperty("--fillY", "154px");
    requestAnimationFrame(() => requestAnimationFrame(paintWater));
  };
  root._update = () => { paintWater(); mealRefs.forEach((r) => r.update()); };

  return root;
}

/* Une carte repas : coche douce + statut de relance bienveillant. */
function buildMeal(slot, ctx, h) {
  const { dayKey } = ctx;
  const node = el("div", { class: "meal-card" });

  const left = el("div", { class: "meal-left" }, [
    el("span", { class: "meal-emoji", text: slot.emoji }),
    el("div", {}, [
      el("div", { class: "meal-label", text: slot.label }),
      el("div", { class: "meal-status" })
    ])
  ]);
  const tick = el("div", { class: "tick", html: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' });
  node.append(left, tick);

  node.addEventListener("click", () => { toggleCheck(dayKey, slot.id); haptic(8); update(); ctx.touch(); });

  function update() {
    const day = getDay(dayKey);
    const done = !!day.checks?.[slot.id];
    const st = mealStatus(slot, done, h);
    node.classList.toggle("is-done", done);
    node.dataset.status = st.kind;
    node.querySelector(".meal-status").textContent = done ? st.text : `${st.text}`;
  }
  update();
  return { node, update };
}
