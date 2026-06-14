/* ============================================================
   Espace Sport.
   - 100 pompes / jour : compteur indépendant des séances, +5/+10/+20,
     visuel qui se remplit, victoire à 100.
   - Séance du jour en ROTATION (jamais de calendrier figé), formats
     complet / express, variantes sans bande / sans ancrage.
   - Animations stylisées par exercice + consigne de forme + une
     suggestion douce de progression.
   - Marche & rando comptent comme activité. On encourage, on ne flique pas.
   ============================================================ */

import { el, toast, haptic } from "../ui.js";
import { icon } from "../icons.js";
import { buildFigure } from "../figure.js";
import {
  SESSIONS, EXERCISES, resolveExercises, sessionForIndex
} from "../data/exercises.js";
import {
  getState, getDay, update, addToCounter, toggleCheck,
  wasCelebrated, markCelebrated
} from "../store.js";
import { ANCHOR_BY_ID } from "../data/anchors.js";

export function render(ctx) {
  const { dayKey } = ctx;
  const root = el("div", { class: "sport screen-pad" });

  root.append(el("div", { class: "topbar" }, [
    el("button", { class: "city back", onClick: () => ctx.navigate("today") }, [
      el("span", { class: "back-chev", html: icon("chevron") }), el("span", { text: "Aujourd'hui" })
    ]),
    el("div", { class: "weather-pill" }, [el("span", { text: "🏃" }), el("span", { text: "Sport" })])
  ]));

  root.append(el("h1", { class: "h-hero lead", text: "Bouger, en confiance." }));
  root.append(el("p", { class: "muted", style: "margin:0 4px", text: "Pour l'énergie et le calme — jamais pour corriger quoi que ce soit." }));

  /* ---------- 100 pompes ---------- */
  root.append(el("div", { class: "section-title", text: "100 pompes du jour" }));
  root.append(buildPushupHero(ctx));

  /* ---------- Séance du jour ---------- */
  root.append(el("div", { class: "section-title", text: "Séance du jour" }));
  const sessionHost = el("div", {});
  root.append(sessionHost);
  renderSession(sessionHost, ctx);

  /* ---------- Activité libre ---------- */
  root.append(el("div", { class: "section-title", text: "Ça compte aussi" }));
  root.append(buildActivity(ctx));
  root.append(el("div", { class: "move-note", text:
    "Rythme indicatif : ~3 fois par semaine, sans pression. Sauter un jour ne casse rien — la rotation reprend où elle en était." }));

  root._update = () => { renderSession(sessionHost, ctx); };
  return root;
}

/* ---------- 100 pompes (héros) ---------- */
function buildPushupHero(ctx) {
  const { dayKey } = ctx;
  const a = ANCHOR_BY_ID.pushups; // target 100
  const hero = el("div", { class: "pushup-hero card" });

  const fig = el("div", { class: "pushup-fig", html: buildFigure("pushup") });
  const main = el("div", { class: "pushup-main" });
  const title = el("div", { class: "pushup-title", html: "100 pompes <small>tous les jours, à ton rythme</small>" });
  const count = el("div", { class: "pushup-count" });
  const bar = el("div", { class: "pushup-bar" }, [el("span")]);
  main.append(title, count, bar);

  const btns = el("div", { class: "pushup-btns" });
  for (const st of [5, 10, 20]) {
    const b = el("button", { class: "chip", text: "+" + st });
    b.addEventListener("click", () => {
      const before = getDay(dayKey).counters?.pushups || 0;
      addToCounter(dayKey, "pushups", st, a.target * 3);
      haptic(8);
      const after = getDay(dayKey).counters?.pushups || 0;
      if (before < a.target && after >= a.target && !wasCelebrated(dayKey, "pushups")) {
        hero.classList.remove("burst"); void hero.offsetWidth; hero.classList.add("burst");
        toast("100 pompes bouclées 🔥 Solide, vraiment.");
        haptic([10, 30, 10, 30, 18]);
        markCelebrated(dayKey, "pushups");
      }
      paint();
      ctx.touch();
    });
    btns.append(b);
  }
  const minus = el("button", { class: "chip minus", text: "−" });
  minus.addEventListener("click", () => { addToCounter(dayKey, "pushups", -5, a.target * 3); haptic(6); paint(); ctx.touch(); });
  btns.prepend(minus);

  hero.append(fig, main, btns);

  function paint() {
    const v = getDay(dayKey).counters?.pushups || 0;
    const done = v >= a.target;
    const p = Math.min(1, v / a.target);
    bar.firstChild.style.setProperty("--fill", p.toFixed(3));
    count.innerHTML = `<b>${v}</b> / ${a.target}`;
    count.classList.toggle("done", done);
    hero.classList.toggle("done", done);
  }
  paint();
  return hero;
}

/* ---------- Séance du jour (rotation) ---------- */
function renderSession(host, ctx) {
  const { dayKey } = ctx;
  const s = getState().sport;
  const session = sessionForIndex(s.rotationIndex);
  const dayState = getDay(dayKey);
  const done = !!dayState.checks?.workout;

  const exs = resolveExercises(session, { format: s.format, band: s.band, anchor: s.anchor });

  host.innerHTML = "";
  const card = el("div", { class: "session-card card" });

  card.append(
    el("div", { class: "session-kicker", text: "Prochaine dans la rotation" }),
    el("div", { class: "session-name", text: `${session.emoji} ${session.name}` }),
    el("div", { class: "session-sub", text: session.sub })
  );

  /* Réglages : format + matériel */
  const meta = el("div", { class: "session-meta" });
  const seg = el("div", { class: "seg" }, [
    segBtn("Complet", s.format === "complet", () => setSport(ctx, host, { format: "complet" })),
    segBtn("Express", s.format === "express", () => setSport(ctx, host, { format: "express" }))
  ]);
  meta.append(seg);
  meta.append(togglePill("🚪 Ancrage porte", s.anchor, () => setSport(ctx, host, { anchor: !s.anchor })));
  meta.append(togglePill("🎗️ Bande", s.band, () => setSport(ctx, host, { band: !s.band })));
  card.append(meta);

  /* Liste d'exercices animés */
  const list = el("div", { class: "ex-list" });
  for (const ex of exs) list.append(buildExerciseCard(ex));
  card.append(list);

  /* CTA séance faite -> coche + avance la rotation (une fois/jour) */
  const cta = el("button", { class: "session-cta" + (done ? " is-done" : ""),
    text: done ? "Séance faite ✓ — bien joué" : "J'ai fait ma séance" });
  cta.addEventListener("click", () => {
    const wasDone = !!getDay(dayKey).checks?.workout;
    toggleCheck(dayKey, "workout");
    haptic(10);
    if (!wasDone) {
      // on avance la rotation seulement au passage à "fait", une fois/jour
      update((st) => {
        if (st.sport.lastAdvanceDay !== dayKey) {
          st.sport.rotationIndex = (st.sport.rotationIndex + 1) % SESSIONS.length;
          st.sport.lastAdvanceDay = dayKey;
        }
      }, "sport:advance");
      toast("Séance validée. La prochaine fois, on enchaîne la suivante.");
    }
    renderSession(host, ctx);
    ctx.touch();
  });
  card.append(cta);

  host.append(card);
}

function setSport(ctx, host, patch) {
  update((st) => { Object.assign(st.sport, patch); }, "sport:set");
  haptic(6);
  renderSession(host, ctx);
}

function segBtn(label, on, onClick) {
  const b = el("button", { class: on ? "on" : "", text: label });
  b.addEventListener("click", onClick);
  return b;
}
function togglePill(label, on, onClick) {
  const p = el("button", { class: "toggle-pill" + (on ? " on" : "") }, [
    el("span", { class: "sw" }), el("span", { text: label })
  ]);
  p.addEventListener("click", onClick);
  return p;
}

function buildExerciseCard(ex) {
  const card = el("div", { class: "ex-card" });
  const stage = el("div", { class: "ex-stage", html: buildFigure(ex.archetype, { band: ex.band }) });

  const info = el("div", {});
  const name = el("div", { class: "ex-name", text: ex.name });
  if (ex.band) name.append(el("span", { class: "band-tag", text: "bande" }));
  if (ex.swappedFrom) name.append(el("span", { class: "band-tag", text: "↔ sans matériel" }));
  info.append(name, el("div", { class: "ex-dose", text: ex.dose }));
  info.append(el("div", { class: "ex-cue", text: ex.cue }));
  if (ex.tip) {
    info.append(el("div", { class: "ex-tip" }, [el("span", { html: icon("spark") }), ex.tip]));
  }

  card.append(stage, info);
  return card;
}

/* ---------- Activité libre (marche / rando) ---------- */
function buildActivity(ctx) {
  const { dayKey } = ctx;
  const row = el("div", { class: "activity-row" });
  const items = [
    { id: "walk", em: "🚶", label: "Marche" },
    { id: "hike", em: "🥾", label: "Rando" }
  ];
  for (const it of items) {
    const on = !!getDay(dayKey).checks?.[it.id];
    const chip = el("div", { class: "activity-chip" + (on ? " on" : "") }, [
      el("span", { class: "em", text: it.em }), it.label
    ]);
    chip.addEventListener("click", () => {
      toggleCheck(dayKey, it.id);
      // une activité compte comme "bougé" du jour
      const anyMove = getDay(dayKey).checks?.walk || getDay(dayKey).checks?.hike;
      update((st) => {
        const d = (st.days[dayKey] ||= { checks: {}, counters: {} });
        if (anyMove) d.checks.workout = true;
      }, "activity");
      haptic(8);
      chip.classList.toggle("on");
      toast("Ça compte — bouger, c'est bouger.");
      ctx.touch();
    });
    row.append(chip);
  }
  return row;
}
