/* ============================================================
   Écran Historique — récap jour par jour + série.
   Vue calendrier sobre. On montre les jours complets, la série
   en cours et le record. Pas de compte des jours manqués.
   ============================================================ */

import { el } from "../ui.js";
import { icon } from "../icons.js";
import { getState } from "../store.js";
import { computeHistory, jokersLeftThisWeek, addDays, dow } from "../history.js";

const WEEKS_SHOWN = 9;
const DOW = ["L", "M", "M", "J", "V", "S", "D"];

export function render(ctx) {
  const root = el("div", { class: "history screen-pad" });
  const state = getState();
  const today = ctx.dayKey;
  const { current, longest, statusByKey, jokerSet } = computeHistory(state.days, today);
  const jokersLeft = jokersLeftThisWeek(state.days, today);

  root.append(el("div", { class: "topbar" }, [
    el("button", { class: "city back", onClick: () => ctx.navigate("today") }, [
      el("span", { class: "back-chev", html: icon("chevron") }), el("span", { text: "Aujourd'hui" })
    ]),
    el("div", { class: "weather-pill" }, [el("span", { text: "🗓️" }), el("span", { text: "Historique" })])
  ]));

  root.append(el("h1", { class: "h-hero lead", text: "Ton fil des jours." }));

  /* --- Série --- */
  const card = el("div", { class: "streak-card card" + (current === 0 ? " zero" : "") });
  card.append(el("div", { class: "streak-figure" }, [
    el("div", { class: "streak-num", text: String(current) }),
    el("div", { class: "streak-unit", text: current === 1 ? "jour d'affilée" : "jours d'affilée" })
  ]));

  const meta = el("div", { class: "streak-meta" });
  if (longest > 0) {
    meta.append(el("div", { class: "streak-line" }, [
      el("span", { class: "k", text: "Record" }), el("b", { text: `${longest} ${longest === 1 ? "jour" : "jours"}` })
    ]));
  }
  const dots = el("span", { class: "joker-dots" }, [
    el("i", { class: jokersLeft >= 1 ? "on" : "" }),
    el("i", { class: jokersLeft >= 2 ? "on" : "" })
  ]);
  meta.append(el("div", { class: "streak-line" }, [
    el("span", { class: "k", text: "Jokers repos" }), dots
  ]));
  card.append(meta);
  root.append(card);

  /* --- Calendrier --- */
  const cal = el("div", { class: "cal-card card" });
  cal.append(el("div", { class: "cal-head", text: `${WEEKS_SHOWN} dernières semaines` }));

  const dowRow = el("div", { class: "cal-dow" });
  DOW.forEach((d) => dowRow.append(el("span", { text: d })));
  cal.append(dowRow);

  const grid = el("div", { class: "cal-grid" });
  // Lundi de la semaine la plus ancienne affichée
  const startMonday = addDays(today, -(dow(today) + 7 * (WEEKS_SHOWN - 1)));
  for (let i = 0; i < WEEKS_SHOWN * 7; i++) {
    const k = addDays(startMonday, i);
    let cls = "cal-cell ";
    if (k > today) cls += "future";
    else if (jokerSet.has(k)) cls += "joker";
    else cls += (statusByKey[k] || "empty");
    if (k === today) cls += " today";
    grid.append(el("div", { class: cls, title: k }));
  }
  cal.append(grid);

  cal.append(el("div", { class: "cal-legend" }, [
    el("span", {}, [el("span", { class: "swatch complete" }), "Jour complet"]),
    el("span", {}, [el("span", { class: "swatch partial" }), "Partiel"]),
    el("span", {}, [el("span", { class: "swatch joker" }), "Repos (joker)"])
  ]));
  root.append(cal);

  root.append(el("div", { class: "history-note", text:
    "Un jour complet = tous les repères essentiels faits. Deux jours de repos par semaine ne cassent pas la série." }));

  root._update = () => {};
  return root;
}
