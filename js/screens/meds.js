/* ============================================================
   Espace Prises & décalage.
   Hub unique : traitement + compléments, au même endroit.
   - L'utilisateur saisit lui-même ses horaires (ceux du médecin).
   - L'app RAPPELLE à l'heure locale et AFFICHE les prises du jour.
   - Décalage de fuseau progressif ENTIÈREMENT paramétrable
     (pas en h/jour + nb de jours) : l'app applique ces paramètres
     et VISUALISE le décalage, sans JAMAIS décider quoi que ce soit.
   - Option "ne pas tomber à court" : suivi de stock simple, activable.
   ============================================================ */

import { el, haptic, toast } from "../ui.js";
import { icon } from "../icons.js";
import {
  getState, getDay, update,
  addMedItem, updateMedItem, removeMedItem, setShift, toggleMedTaken
} from "../store.js";

/* ---------- utilitaires horaires ---------- */
function parseTime(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fmtMin(min) {
  const x = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
}
function dayDiff(fromKey, toKey) {
  if (!fromKey || !toKey) return 0;
  const [ay, am, ad] = fromKey.split("-").map(Number);
  const [by, bm, bd] = toKey.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
/* Décalage (en minutes) appliqué AUJOURD'HUI selon les paramètres. */
function shiftOffsetMin(shift, todayKey) {
  if (!shift.enabled || !shift.startDayKey) return 0;
  const idx = dayDiff(shift.startDayKey, todayKey);
  if (idx <= 0) return 0;
  const steps = Math.min(idx, shift.days);
  return steps * shift.stepHours * shift.direction * 60;
}

export function render(ctx) {
  const root = el("div", { class: "medhub screen-pad" });
  buildContent(root, ctx);
  root._update = () => { const sc = root.parentElement ? root.parentElement.scrollTop : 0; root.innerHTML = ""; buildContent(root, ctx); if (root.parentElement) root.parentElement.scrollTop = sc; };
  return root;
}

function buildContent(root, ctx) {
  const state = getState();
  const meds = state.meds;
  const offset = shiftOffsetMin(meds.shift, ctx.dayKey);

  /* En-tête */
  root.append(el("div", { class: "topbar" }, [
    el("button", { class: "city back", onClick: () => ctx.navigate("today") }, [
      el("span", { class: "back-chev", html: icon("chevron") }), el("span", { text: "Aujourd'hui" })
    ]),
    el("div", { class: "weather-pill" }, [el("span", { text: "💊" }), el("span", { text: "Prises" })])
  ]));

  root.append(el("h1", { class: "h-hero lead", text: "Tes prises, au clair." }));

  /* Disclaimer — l'app est un outil */
  root.append(el("div", { class: "med-disclaimer" }, [
    el("span", { html: "L'app est un <b>outil</b> : elle affiche et rappelle tes prises à l'heure locale. " +
      "Elle ne propose jamais de dosage ni de décalage médical de son propre chef." }),
    el("div", { class: "pill-doc", text: "🩺 Saisis les horaires validés par ton médecin." })
  ]));

  /* ---------- Prises du jour ---------- */
  root.append(el("div", { class: "section-title", text: "Prises du jour (heure locale)" }));
  root.append(buildTodayList(ctx, offset));

  /* ---------- Traitement ---------- */
  root.append(buildSection(ctx, "treatment", "Mon traitement", meds.treatments, offset,
    "Ajoute tes médicaments et leurs horaires (ceux de ton médecin)."));

  /* ---------- Compléments ---------- */
  root.append(buildSection(ctx, "supplement", "Mes compléments", meds.supplements, offset,
    "À remplir après ta prise de sang et le feu vert du médecin. Rien n'est pré-rempli."));

  /* ---------- Décalage de fuseau ---------- */
  root.append(el("div", { class: "section-title", text: "Décalage de fuseau" }));
  root.append(buildShiftTool(ctx));

  root.append(el("div", { class: "med-note", html:
    "Le tronc commun (repas, eau, respiration, soin) se recale tout seul sur l'heure locale quand tu changes de ville. " +
    "Les prises médicales, elles, ne bougent que selon <b>tes</b> paramètres." }));
}

/* ---------- Liste des prises du jour ---------- */
function buildTodayList(ctx, offset) {
  const state = getState();
  const day = getDay(ctx.dayKey);
  const nowMin = Math.round(ctx.local.hourFloat * 60);
  const items = [...state.meds.treatments, ...state.meds.supplements];

  const intakes = [];
  for (const it of items) {
    for (const t of (it.times || [])) {
      intakes.push({ id: it.id, name: it.name, kind: it.kind, base: t, applied: parseTime(t) + offset });
    }
  }
  intakes.sort((a, b) => ((a.applied % 1440) - (b.applied % 1440)));

  if (!intakes.length) {
    return el("div", { class: "intake-list" }, [
      el("div", { class: "card empty-card" }, [
        el("div", { class: "glyph", text: "🕊️" }),
        el("p", { text: "Rien à prendre pour l'instant. Ajoute ton traitement ou tes compléments ci-dessous." })
      ])
    ]);
  }

  const list = el("div", { class: "intake-list" });
  for (const x of intakes) {
    const takenKey = `med:${x.id}@${x.base}`;
    const taken = !!day.checks?.[takenKey];
    const appliedMin = ((x.applied % 1440) + 1440) % 1440;
    const diff = appliedMin - nowMin;
    let status = "À venir", cls = "";
    if (taken) { status = "Pris ✓"; }
    else if (Math.abs(diff) <= 30) { status = "C'est l'heure."; cls = "now"; }
    else if (diff < 0) { status = "Plus tôt aujourd'hui."; }

    const row = el("div", { class: "intake " + cls + (taken ? " is-taken" : "") });
    row.append(
      el("div", { class: "intake-time" }, [fmtMin(x.applied), el("small", { text: "locale" })]),
      el("div", { class: "intake-body" }, [
        el("div", { class: "intake-name" }, [
          x.name,
          el("span", { class: "intake-tag " + x.kind, text: x.kind === "supplement" ? "complément" : "traitement" })
        ]),
        el("div", { class: "intake-status", text: status }),
        offset !== 0 ? el("div", { class: "intake-shift-note", text:
          `décalé de ${offset > 0 ? "+" : ""}${(offset / 60)} h · base ${x.base}` }) : null
      ]),
      el("div", { class: "intake-tick", html: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>' })
    );
    row.addEventListener("click", () => {
      toggleMedTaken(ctx.dayKey, x.id, x.base);
      haptic(8);
      syncMedsAnchor(ctx);
      ctx.touch();
    });
    list.append(row);
  }
  return list;
}

/* Coche le repère "Prises du jour" (meds) si tout est pris. */
function syncMedsAnchor(ctx) {
  const state = getState();
  const day = getDay(ctx.dayKey);
  const items = [...state.meds.treatments, ...state.meds.supplements];
  let total = 0, taken = 0;
  for (const it of items) for (const t of (it.times || [])) {
    total++; if (day.checks?.[`med:${it.id}@${t}`]) taken++;
  }
  update((s) => {
    const d = (s.days[ctx.dayKey] ||= { checks: {}, counters: {} });
    d.checks.meds = total > 0 && taken === total;
  }, "meds:anchor");
}

/* ---------- Section traitement / compléments ---------- */
function buildSection(ctx, kind, title, listItems, offset, emptyText) {
  const wrap = el("div", {});
  wrap.append(el("div", { class: "med-section-head" }, [
    el("h2", { text: title }),
    (() => {
      const b = el("button", { class: "btn-add" }, [el("span", { html: icon("plus") }), "Ajouter"]);
      b.addEventListener("click", () => openEditor(ctx, kind, null));
      return b;
    })()
  ]));

  if (!listItems.length) {
    wrap.append(el("div", { class: "card empty-card" }, [
      el("div", { class: "glyph", text: kind === "supplement" ? "🌱" : "💊" }),
      el("p", { text: emptyText })
    ]));
    return wrap;
  }

  for (const it of listItems) wrap.append(buildItemCard(ctx, it, offset));
  return wrap;
}

function buildItemCard(ctx, it, offset) {
  const card = el("div", { class: "med-item card" });

  const edit = el("button", { class: "icon-btn", text: "✎", "aria-label": "modifier" });
  edit.addEventListener("click", () => openEditor(ctx, it.kind, it));
  const del = el("button", { class: "icon-btn", text: "🗑", "aria-label": "supprimer" });
  del.addEventListener("click", () => { removeMedItem(it.id); haptic(10); toast("Prise retirée."); ctx.touch(); });

  card.append(el("div", { class: "med-item-top" }, [
    el("div", { class: "med-item-name", text: it.name }),
    el("div", { class: "med-item-actions" }, [edit, del])
  ]));

  const times = el("div", { class: "med-times" });
  for (const t of (it.times || [])) {
    const label = offset !== 0 ? `${fmtMin(parseTime(t) + offset)}` : t;
    times.append(el("div", { class: "time-chip", text: label }));
  }
  card.append(times);

  if (it.spacing) card.append(el("div", { class: "med-spacing", text: it.spacing }));

  /* Stock — ne pas tomber à court */
  if (it.stockOn) {
    const perDay = Math.max(1, (it.times || []).length);
    const daysLeft = Math.floor((it.stock || 0) / perDay);
    const low = daysLeft <= 5;
    const lvl = Math.max(0, Math.min(1, (it.stock || 0) / (perDay * 30))); // repère sur ~30 j
    const stock = el("div", { class: "stock" });
    const bar = el("div", { class: "stock-bar" + (low ? " low" : "") }, [el("span")]);
    bar.firstChild.style.setProperty("--lvl", lvl.toFixed(3));
    stock.append(bar, el("div", { class: "stock-info" + (low ? " low" : "") }, [
      el("span", { text: `${it.stock || 0} doses restantes` }),
      el("span", { text: low ? `≈ ${daysLeft} j — pense à racheter` : `≈ ${daysLeft} j` })
    ]));
    card.append(stock);
  }
  return card;
}

/* ---------- Outil de décalage ---------- */
function buildShiftTool(ctx) {
  const shift = getState().meds.shift;
  const tool = el("div", { class: "shift-tool card" });

  const sw = el("div", { class: "sw-toggle" + (shift.enabled ? " on" : "") });
  const head = el("div", { class: "shift-head" }, [
    el("h2", { text: "Recaler progressivement" }), sw
  ]);
  tool.append(head);
  tool.append(el("div", { class: "shift-sub", html:
    "Pour un changement de fuseau, applique le plan de <b>ton médecin</b> : un pas en heures par jour, sur un nombre de jours. " +
    "L'app décale l'affichage des prises selon ces réglages — elle ne calcule aucune décision médicale." }));

  sw.addEventListener("click", () => {
    const enabling = !shift.enabled;
    setShift({ enabled: enabling, startDayKey: enabling ? ctx.dayKey : shift.startDayKey });
    haptic(8); ctx.touch();
  });

  if (shift.enabled) {
    const controls = el("div", { class: "shift-controls" });

    // Direction
    const dir = el("div", { class: "dir-seg" }, [
      dirBtn("Retarder", shift.direction === 1, () => { setShift({ direction: 1 }); ctx.touch(); }),
      dirBtn("Avancer", shift.direction === -1, () => { setShift({ direction: -1 }); ctx.touch(); })
    ]);
    controls.append(field("Sens du décalage", dir));

    // Pas en h/jour
    controls.append(field("Pas par jour",
      stepper(shift.stepHours, 0.5, 0.5, 4, (v) => { setShift({ stepHours: v }); ctx.touch(); }, (v) => `${v} h/j`)));

    // Nombre de jours
    controls.append(field("Étalé sur",
      stepper(shift.days, 1, 1, 14, (v) => { setShift({ days: v }); ctx.touch(); }, (v) => `${v} j`)));

    tool.append(controls);

    // Plan visuel
    const total = shift.days;
    const curIdx = Math.max(0, Math.min(total, dayDiff(shift.startDayKey, ctx.dayKey)));
    const plan = el("div", { class: "shift-plan" });
    for (let d = 0; d <= total; d++) {
      const offH = d * shift.stepHours * shift.direction;
      const label = d === 0 ? "Départ" : d === total ? "Aligné" : `Jour ${d}`;
      const cell = el("div", { class: "plan-day" + (d === curIdx ? " today" : "") + (d === total ? " aligned" : "") }, [
        el("div", { class: "d", text: label }),
        el("div", { class: "off", text: `${offH > 0 ? "+" : ""}${offH} h` })
      ]);
      plan.append(cell);
    }
    tool.append(plan);
    tool.append(el("div", { class: "shift-sub", text:
      `Aujourd'hui : jour ${curIdx} du recalage. Les horaires ci-dessus reflètent ce décalage.` }));
  }

  return tool;
}

function field(labelText, control) {
  return el("div", { class: "shift-field" }, [el("label", { text: labelText }), control]);
}
function dirBtn(label, on, onClick) {
  const b = el("button", { class: on ? "on" : "", text: label });
  b.addEventListener("click", onClick); return b;
}
function stepper(val, step, min, max, onChange, fmt) {
  const wrap = el("div", { class: "stepper" });
  const dec = el("button", { text: "−" });
  const valEl = el("div", { class: "val", text: fmt(val) });
  const inc = el("button", { text: "+" });
  dec.addEventListener("click", () => { const v = Math.max(min, +(val - step).toFixed(2)); onChange(v); });
  inc.addEventListener("click", () => { const v = Math.min(max, +(val + step).toFixed(2)); onChange(v); });
  wrap.append(dec, valEl, inc);
  return wrap;
}

/* ---------- Sheet d'édition d'une prise ---------- */
function openEditor(ctx, kind, existing) {
  const isEdit = !!existing;
  let curKind = existing?.kind || kind;
  let times = existing ? [...existing.times] : ["08:00"];
  let stockOn = existing?.stockOn || false;

  const backdrop = el("div", { class: "sheet-backdrop" });
  const sheet = el("div", { class: "sheet" });
  backdrop.append(sheet);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });

  sheet.append(el("div", { class: "sheet-grip" }));
  sheet.append(el("h3", { text: isEdit ? "Modifier la prise" : "Nouvelle prise" }));

  // Type
  const kindSeg = el("div", { class: "kind-seg" });
  const kbT = el("button", { class: curKind === "treatment" ? "on" : "", text: "💊 Traitement" });
  const kbS = el("button", { class: curKind === "supplement" ? "on" : "", text: "🌱 Complément" });
  kbT.addEventListener("click", () => { curKind = "treatment"; kbT.classList.add("on"); kbS.classList.remove("on"); });
  kbS.addEventListener("click", () => { curKind = "supplement"; kbS.classList.add("on"); kbT.classList.remove("on"); });
  kindSeg.append(kbT, kbS);
  sheet.append(el("div", { class: "field" }, [el("label", { text: "Type" }), kindSeg]));

  // Nom
  const nameInput = el("input", { type: "text", placeholder: "Nom (ex. Vitamine D, traitement…)", value: existing?.name || "" });
  sheet.append(el("div", { class: "field" }, [el("label", { text: "Nom" }), nameInput]));

  // Horaires
  const timeRows = el("div", { class: "time-rows" });
  function renderTimes() {
    timeRows.innerHTML = "";
    times.forEach((t, i) => {
      const inp = el("input", { type: "time", value: t });
      inp.addEventListener("input", () => { times[i] = inp.value; });
      const rm = el("button", { class: "rm", text: "−" });
      rm.addEventListener("click", () => { times.splice(i, 1); if (!times.length) times.push("08:00"); renderTimes(); });
      timeRows.append(el("div", { class: "time-row" }, [inp, rm]));
    });
  }
  renderTimes();
  const addTime = el("button", { class: "add-time" }, [el("span", { html: icon("plus") }), "Ajouter un horaire"]);
  addTime.addEventListener("click", () => { times.push("12:00"); renderTimes(); });
  sheet.append(el("div", { class: "field" }, [el("label", { text: "Horaires (heure locale)" }), timeRows, addTime]));

  // Espacement / notes
  const spacingInput = el("input", { type: "text", placeholder: "ex. à jeun · espacer de 4 h · avec un repas", value: existing?.spacing || "" });
  sheet.append(el("div", { class: "field" }, [el("label", { text: "Espacement / notes (optionnel)" }), spacingInput]));

  // Stock
  const stockSw = el("div", { class: "sw-toggle" + (stockOn ? " on" : "") });
  const stockInput = el("input", { type: "number", min: "0", placeholder: "doses restantes", value: existing?.stock ?? "" });
  const stockField = el("div", { class: "field", style: stockOn ? "" : "display:none" }, [
    el("label", { text: "Doses restantes" }), stockInput
  ]);
  stockSw.addEventListener("click", () => {
    stockOn = !stockOn; stockSw.classList.toggle("on", stockOn);
    stockField.style.display = stockOn ? "" : "none";
  });
  sheet.append(el("div", { class: "switch-row" }, [
    el("span", { class: "lab", text: "Suivre le stock (ne pas tomber à court)" }), stockSw
  ]));
  sheet.append(stockField);

  // Actions
  const cancel = el("button", { class: "btn-cancel", text: "Annuler" });
  cancel.addEventListener("click", close);
  const save = el("button", { class: "btn-save", text: isEdit ? "Enregistrer" : "Ajouter" });
  save.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) { toast("Donne un nom à cette prise."); nameInput.focus(); return; }
    const cleanTimes = [...new Set(times.filter(Boolean))].sort();
    if (!cleanTimes.length) { toast("Ajoute au moins un horaire."); return; }
    const payload = {
      kind: curKind, name,
      times: cleanTimes,
      spacing: spacingInput.value.trim(),
      stockOn,
      stock: stockOn ? Math.max(0, parseInt(stockInput.value, 10) || 0) : 0
    };
    if (isEdit) updateMedItem(existing.id, payload);
    else addMedItem({ id: "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e4), ...payload });
    haptic(10);
    toast(isEdit ? "Prise mise à jour." : "Prise ajoutée.");
    close();
    ctx.touch();
  });
  sheet.append(el("div", { class: "sheet-actions" }, [cancel, save]));

  if (isEdit) {
    const delBtn = el("button", { class: "btn-delete", text: "Supprimer cette prise" });
    delBtn.addEventListener("click", () => { removeMedItem(existing.id); haptic(12); close(); ctx.touch(); });
    sheet.append(delBtn);
  }

  document.getElementById("app").append(backdrop);

  function close() { backdrop.classList.add("closing"); backdrop.remove(); }
}
