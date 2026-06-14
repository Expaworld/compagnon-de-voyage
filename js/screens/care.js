/* ============================================================
   Espace Soin.
   Routines guidées matin / soir (étapes ordonnées, cochables) +
   brossage de dents 3×/jour. Mêmes ancres que l'écran Aujourd'hui,
   donc cocher ici remplit aussi les blocs matin/soir là-bas.

   Matin : minoxidil → visage (eau fraîche + crème).
   Soir  : minoxidil → nettoyant + crème (nettoyant le soir
           seulement, pour économiser le produit sur le voyage).
   Pas de roller (en pause), pas d'item crème solaire (au bon sens).
   ============================================================ */

import { el, haptic, toast } from "../ui.js";
import { icon } from "../icons.js";
import { getDay, toggleCheck, addToCounter, wasCelebrated, markCelebrated } from "../store.js";
import { ANCHOR_BY_ID } from "../data/anchors.js";

const ROUTINES = [
  {
    id: "matin", title: "Routine du matin", em: "🌅", cls: "matin",
    steps: [
      { id: "minoxAM", icon: "drop", label: "Minoxidil", sub: "Cuir chevelu sec, masse doucement et laisse sécher." },
      { id: "faceAM", icon: "face", label: "Visage", sub: "Eau fraîche pour réveiller, puis crème hydratante." }
    ]
  },
  {
    id: "soir", title: "Routine du soir", em: "🌙", cls: "soir",
    steps: [
      { id: "minoxPM", icon: "drop", label: "Minoxidil", sub: "Avant de dormir, cuir chevelu sec." },
      { id: "facePM", icon: "face", label: "Nettoyant + crème", sub: "Le nettoyant le soir seulement — on économise le produit." }
    ]
  }
];

export function render(ctx) {
  const root = el("div", { class: "care screen-pad" });

  root.append(el("div", { class: "topbar" }, [
    el("button", { class: "city back", onClick: () => ctx.navigate("today") }, [
      el("span", { class: "back-chev", html: icon("chevron") }), el("span", { text: "Aujourd'hui" })
    ]),
    el("div", { class: "weather-pill" }, [el("span", { text: "🧴" }), el("span", { text: "Soin" })])
  ]));

  root.append(el("h1", { class: "h-hero lead", text: "Prendre soin, simplement." }));
  root.append(el("p", { class: "muted", style: "margin:0 4px", text: "Quelques gestes courts, rangés dans ton matin et ton soir." }));

  const refs = [];
  for (const r of ROUTINES) {
    const ref = buildRoutine(r, ctx);
    refs.push(ref);
    root.append(ref.node);
  }

  const teeth = buildTeeth(ctx);
  root.append(teeth.node);

  root.append(el("div", { class: "care-note", html:
    "Le <b>roller</b> est en pause pour le voyage. Pour la <b>crème solaire</b>, au bon sens selon tes sorties." }));

  root._update = () => { refs.forEach((r) => r.update()); teeth.update(); };
  return root;
}

function buildRoutine(r, ctx) {
  const { dayKey } = ctx;
  const node = el("div", { class: `routine ${r.cls} card` });

  const state = el("div", { class: "routine-state" });
  node.append(el("div", { class: "routine-head" }, [
    el("div", { class: "routine-title" }, [
      el("span", { class: "em", text: r.em }),
      el("h2", { text: r.title })
    ]),
    state
  ]));

  const steps = el("div", { class: "steps" });
  const stepRefs = [];
  r.steps.forEach((s, i) => {
    const stepNode = el("div", { class: "step" });
    stepNode.append(
      el("div", { class: "step-num" }, [
        el("span", { class: "num-label", text: String(i + 1) }),
        el("span", { class: "num-check", html: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' })
      ]),
      el("div", { class: "step-body" }, [
        el("div", { class: "step-label" }, [
          el("span", { class: "ic", html: icon(s.icon) }), s.label
        ]),
        el("div", { class: "step-sub", text: s.sub })
      ]),
      el("div", { class: "step-tick", html: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' })
    );
    stepNode.addEventListener("click", () => {
      toggleCheck(dayKey, s.id);
      haptic(8);
      update();
      ctx.touch();
    });
    steps.append(stepNode);
    stepRefs.push({ node: stepNode, id: s.id });
  });
  node.append(steps);

  function update() {
    const day = getDay(dayKey);
    let doneCount = 0;
    for (const sr of stepRefs) {
      const done = !!day.checks?.[sr.id];
      sr.node.classList.toggle("is-done", done);
      if (done) doneCount++;
    }
    const all = doneCount === stepRefs.length;
    node.classList.toggle("is-complete", all);
    state.textContent = all ? "Routine complète ✓"
      : doneCount > 0 ? `${doneCount}/${stepRefs.length} fait`
      : "À faire";
  }
  update();
  return { node, update };
}

function buildTeeth(ctx) {
  const { dayKey } = ctx;
  const a = ANCHOR_BY_ID.teeth; // target 3
  const node = el("div", { class: "teeth-card card" });

  node.append(el("div", { class: "teeth-head" }, [
    el("h2", { text: "🪥 Brossage des dents" }),
    el("div", { class: "goal", text: "Objectif 3×" })
  ]));

  const pips = el("div", { class: "teeth-pips" });
  const pipEls = [];
  for (let i = 0; i < a.target; i++) {
    const p = el("div", { class: "pip", text: "🪥" });
    pipEls.push(p);
    pips.append(p);
  }
  node.append(pips);

  const btns = el("div", { class: "teeth-btns" });
  const minus = el("button", { class: "chip minus", text: "−" });
  minus.addEventListener("click", () => { addToCounter(dayKey, "teeth", -1, a.target * 2); haptic(6); update(); ctx.touch(); });
  btns.append(minus);
  for (const st of [1, 2, 3]) {
    const b = el("button", { class: "chip", text: "+" + st });
    b.addEventListener("click", () => {
      const before = getDay(dayKey).counters?.teeth || 0;
      addToCounter(dayKey, "teeth", st, a.target * 2);
      haptic(8);
      const after = getDay(dayKey).counters?.teeth || 0;
      if (before < a.target && after >= a.target && !wasCelebrated(dayKey, "teeth")) {
        toast("Trois brossages.");
        markCelebrated(dayKey, "teeth");
      }
      update();
      ctx.touch();
    });
    btns.append(b);
  }
  node.append(btns);

  function update() {
    const v = getDay(dayKey).counters?.teeth || 0;
    pipEls.forEach((p, i) => p.classList.toggle("on", i < v));
  }
  update();
  return { node, update };
}
