/* ============================================================
   Écran Aujourd'hui — point d'ancrage (90% de l'usage).
   Avion + ciel + repères du jour groupés par moment.
   Aucun chiffre de score : juste l'avion qui avance.
   ============================================================ */

import { el, toast, haptic } from "../ui.js";
import { icon } from "../icons.js";
import {
  ANCHORS, GROUPS, isAnchorDone, anchorProgress
} from "../data/anchors.js";
import { createPlaneScene, updatePlane, celebrateTakeoff } from "../plane.js";
import {
  getDay, toggleCheck, addToCounter, update,
  wasCelebrated, markCelebrated
} from "../store.js";
import { reassurance, prettyDate, openingNudges } from "../messages.js";
import { describeWeather, weatherAge } from "../weather.js";
import { dayPart, greeting, clockLabel } from "../time.js";

export function render(ctx) {
  const { city, local, dayKey } = ctx;
  const part = dayPart(local.hourFloat);

  const root = el("div", { class: "today screen-pad" });

  /* ---------- Barre du haut : ville · heure · météo ---------- */
  root.append(buildTopbar(ctx));

  /* ---------- Salutation ---------- */
  root.append(el("div", { class: "today-hero" }, [
    el("div", { class: "hero-greet" }, [
      el("div", {}, [
        el("h1", { class: "h-hero", text: `${greeting(local.hourFloat)}.` })
      ]),
      el("div", { class: "date", text: prettyDate(local) })
    ])
  ]));

  /* ---------- Scène de l'avion ---------- */
  const scene = createPlaneScene();
  const status = el("div", { class: "plane-status" }, [
    el("span", { class: "pulse" }),
    el("span", { class: "status-text", text: "" })
  ]);
  scene.append(status);
  root.querySelector(".today-hero").append(scene);

  /* ---------- Rituel du matin : vision claire ---------- */
  if (part === "matin" || part === "journee") {
    root.append(buildVisionCard(ctx));
  }

  /* ---------- Phrase qui rassure ---------- */
  const reassureEl = el("div", { class: "reassure" });
  root.append(reassureEl);

  /* ---------- Relances douces à l'ouverture ---------- */
  const nudges = openingNudges({ city, dayState: getDay(dayKey), anchors: ANCHORS });
  if (nudges.length) {
    const wrap = el("div", { class: "nudge-wrap", style: "display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 2px;" });
    nudges.slice(0, 2).forEach((n) =>
      wrap.append(el("div", { class: "nudge" }, [el("span", { class: "dot" }), n]))
    );
    root.append(wrap);
  }

  /* ---------- Repères groupés par moment ---------- */
  const anchorRefs = []; // pour les mises à jour fines
  for (const g of GROUPS) {
    // visionMorning a sa propre carte rituel : on l'exclut de la liste.
    const groupAnchors = ANCHORS.filter((a) => a.group === g.id && a.id !== "visionMorning");
    if (!groupAnchors.length) continue;

    root.append(el("div", { class: "group-head" }, [
      el("h2", { text: g.label }),
      el("span", { class: "group-sub", text: g.sub })
    ]));

    const list = el("div", { class: "anchor-list" });
    for (const a of groupAnchors) {
      const ref = buildAnchor(a, ctx);
      anchorRefs.push(ref);
      list.append(ref.node);
    }
    root.append(list);
  }

  /* ---------- Contrôleur : met à jour avion + rassurance ---------- */
  let prevAirborne = false;

  function recompute() {
    const dayState = getDay(dayKey);
    const essentials = ANCHORS.filter((a) => a.essential);
    const bonuses = ANCHORS.filter((a) => !a.essential);

    const essential = essentials.reduce((s, a) => s + anchorProgress(a, dayState), 0) / essentials.length;
    const bonus = bonuses.reduce((s, a) => s + anchorProgress(a, dayState), 0) / bonuses.length;

    updatePlane(scene, { essential, bonus });

    // Texte d'ambiance (jamais un score)
    const txt = essential >= 1
      ? (bonus >= 0.6 ? "En vol, altitude haute" : "Décollé — l'essentiel est fait")
      : essential >= 0.5 ? "Ça prend de la vitesse"
      : essential > 0.02 ? "Roulage en douceur"
      : "Prêt au départ";
    status.querySelector(".status-text").textContent = txt;

    reassureEl.innerHTML = reassurance({ essential, bonus, part });

    // Célébration de décollage (une seule fois par jour)
    const airborne = essential >= 1;
    if (airborne && !prevAirborne && !wasCelebrated(dayKey, "takeoff")) {
      celebrateTakeoff(scene);
      toast("Décollage ✈️ Tu as fait l'essentiel, c'est très bien.");
      haptic([12, 40, 18]);
      markCelebrated(dayKey, "takeoff");
    }
    prevAirborne = airborne;

    // Maj des ancres
    anchorRefs.forEach((r) => r.update());
  }

  // Premier rendu (légère temporisation pour laisser l'anim partir de 0)
  root._afterMount = () => {
    updatePlane(scene, { essential: 0, bonus: 0 });
    requestAnimationFrame(() => requestAnimationFrame(recompute));
  };
  root._update = recompute;

  return root;
}

/* ---------- Barre du haut ---------- */
function buildTopbar(ctx) {
  const { city, local, weather, navigate } = ctx;
  const bar = el("div", { class: "topbar" });

  const cityPill = el("button", { class: "city", onClick: () => navigate("travel") }, [
    el("span", { class: "flag", text: city.flag }),
    el("span", { text: city.name }),
    el("span", { class: "clock", text: " · " }),
    el("span", { class: "clock", "data-clock-tz": city.tz, text: clockLabel(local) })
  ]);

  let weatherPill;
  if (weather) {
    const [label, emoji] = describeWeather(weather.code);
    weatherPill = el("button", {
      class: "weather-pill" + (weather.online ? "" : " stale"),
      onClick: () => navigate("travel")
    }, [
      el("span", { text: emoji }),
      el("span", { class: "t", text: `${weather.temp}°` }),
      weather.online ? null : el("small", { text: weatherAge(weather, ctx.now) })
    ]);
  } else {
    weatherPill = el("button", { class: "weather-pill stale", onClick: () => navigate("travel") }, [
      el("span", { text: "🌡️" }), el("small", { text: "météo indispo" })
    ]);
  }

  bar.append(cityPill, weatherPill);
  return bar;
}

/* ---------- Carte rituel "vision claire" ---------- */
function buildVisionCard(ctx) {
  const { dayKey } = ctx;
  const day = getDay(dayKey);
  const card = el("div", { class: "anchor-vision" });
  card.append(el("div", { class: "label", text: "Vision claire du jour" }));
  const input = el("input", {
    class: "vision-input",
    type: "text",
    placeholder: "Une intention simple pour aujourd'hui…",
    value: day.notes?.vision || "",
    maxlength: "120"
  });
  input.addEventListener("input", () => {
    update((s) => {
      const d = (s.days[dayKey] ||= { checks: {}, counters: {} });
      d.notes = d.notes || {};
      d.notes.vision = input.value;
      d.checks.visionMorning = input.value.trim().length > 0;
    }, "vision");
  });
  card.append(input);
  return card;
}

/* ---------- Une ancre (check ou compteur) ---------- */
function buildAnchor(a, ctx) {
  const { dayKey } = ctx;

  const node = el("div", { class: "anchor" + (a.type === "counter" ? " counter" : "") });
  node.append(el("div", { class: "anchor-icon", html: icon(a.icon) }));

  const body = el("div", { class: "anchor-body" }, [
    el("div", { class: "anchor-label", text: a.label }),
    el("div", { class: "anchor-hint", text: a.hint })
  ]);
  node.append(body);

  let tick, gaugeFill, valEl;

  if (a.type === "counter") {
    // Jauge + boutons d'ajout (jamais de pourcentage agressif)
    tick = el("div", { class: "tick", html: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' });
    node.append(tick);

    const row = el("div", { class: "counter-row" });
    const gauge = el("div", { class: "counter-gauge" });
    gaugeFill = el("span");
    gauge.append(gaugeFill);
    valEl = el("div", { class: "counter-val" });
    row.append(gauge, valEl);

    const chips = el("div", { class: "chip-row" });
    const minus = el("button", { class: "chip minus", text: "−", "aria-label": "retirer" });
    minus.addEventListener("click", () => {
      addToCounter(dayKey, a.id, -a.step, a.target * 4);
      haptic(6); ctx.touch();
    });
    chips.append(minus);

    // Pas d'incrément adaptés au type (pompes +5/+10/+20, eau/dents +1)
    const steps = a.id === "pushups" ? [5, 10, 20] : [a.step];
    for (const st of steps) {
      const b = el("button", { class: "chip", text: "+" + st });
      b.addEventListener("click", () => {
        const before = getDay(dayKey).counters?.[a.id] || 0;
        addToCounter(dayKey, a.id, st, a.target * 4);
        haptic(8);
        celebrateCounter(a, before, ctx);
        ctx.touch();
      });
      chips.append(b);
    }

    node.append(row, chips);
  } else {
    // Coche simple
    tick = el("div", { class: "tick", html: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' });
    node.append(tick);
    node.addEventListener("click", (e) => {
      if (e.target.closest("input")) return;
      toggleCheck(dayKey, a.id);
      haptic(8);
      ctx.touch();
    });
  }

  if (!a.essential) {
    body.querySelector(".anchor-label").append(
      el("span", { class: "anchor-tag", text: "  bonus" })
    );
  }

  function update() {
    const dayState = getDay(dayKey);
    const done = isAnchorDone(a, dayState);
    node.classList.toggle("is-done", done);
    if (a.type === "counter") {
      const p = anchorProgress(a, dayState);
      const v = dayState.counters?.[a.id] || 0;
      gaugeFill.style.setProperty("--fill", Math.min(1, p).toFixed(3));
      valEl.textContent = `${v} / ${a.target}`;
    }
  }
  update();

  return { node, update };
}

/* Célébrations de compteur (100 pompes, gourde pleine). */
function celebrateCounter(a, before, ctx) {
  const after = getDay(ctx.dayKey).counters?.[a.id] || 0;
  if (before < a.target && after >= a.target) {
    if (a.id === "pushups" && !wasCelebrated(ctx.dayKey, "pushups")) {
      toast("100 pompes bouclées 🔥 Solide, vraiment.");
      haptic([10, 30, 10, 30, 16]);
      markCelebrated(ctx.dayKey, "pushups");
    }
    if (a.id === "water" && !wasCelebrated(ctx.dayKey, "water")) {
      toast("Gourde au complet 💧 Bien joué.");
      haptic([10, 30, 16]);
      markCelebrated(ctx.dayKey, "water");
    }
  }
}
