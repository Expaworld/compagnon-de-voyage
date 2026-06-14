/* ============================================================
   Espace Voyage — colonne vertébrale de l'app.
   Choisir sa ville fixe : fuseau (heure + ciel + rappels),
   météo, saison déduite et ambiance du pays. Pas de GPS.

   (Ajout/retrait de pays & villes : prévu, à brancher ensuite ;
   la structure de données le permet déjà — voir data/cities.js.)
   ============================================================ */

import { el } from "../ui.js";
import { getState } from "../store.js";
import { localNow, inferSeason, clockLabel } from "../time.js";
import { describeWeather, weatherAge } from "../weather.js";

export function render(ctx) {
  const state = getState();
  const root = el("div", { class: "travel" });

  const current = ctx.city;
  // Pays affiché = celui de la ville courante par défaut
  let openCountryId = current.countryId;

  /* ---------- En-tête d'ambiance ---------- */
  const hero = el("div", { class: "travel-hero" });
  hero.style.setProperty("--accent", current.accent);
  root.append(hero);

  function renderHero() {
    const city = ctx.city;
    const local = localNow(city.tz);
    const season = inferSeason(city, local);
    const w = ctx.weather;

    hero.innerHTML = "";
    hero.style.setProperty("--accent", city.accent);
    hero.append(
      el("div", { class: "flag-lg", text: city.flag }),
      el("h1", { text: city.name }),
      el("div", { class: "sub", text: city.countryName }),
      el("div", { class: "meta-row" }, [
        el("div", { class: "travel-chip-info" }, ["🕑 ", el("b", { "data-clock-tz": city.tz, text: clockLabel(local) }), " locale"]),
        el("div", { class: "travel-chip-info" }, [seasonEmoji(season) + " ", el("b", { text: season.label })]),
        w
          ? el("div", { class: "travel-chip-info" + (w.online ? "" : " stale") }, [
              describeWeather(w.code)[1] + " ", el("b", { text: `${w.temp}°` }),
              w.online ? "" : el("span", { class: "faint", text: " · " + weatherAge(w, ctx.now) })
            ])
          : el("div", { class: "travel-chip-info" }, ["🌡️ ", el("b", { text: "météo indispo" })])
      ])
    );
    if (season.hint) {
      hero.append(el("div", { class: "sub", style: "margin-top:10px", text: season.hint }));
    }
  }
  renderHero();

  /* ---------- Pays (défilement horizontal) ---------- */
  const countryScroll = el("div", { class: "country-scroll" });
  root.append(countryScroll);

  const cityGrid = el("div", { class: "city-grid" });
  root.append(cityGrid);

  function renderCountries() {
    countryScroll.innerHTML = "";
    for (const c of state.countries) {
      const pill = el("button", {
        class: "country-pill" + (c.id === openCountryId ? " is-active" : "")
      }, [el("span", { class: "flag", text: c.flag }), c.name]);
      pill.style.setProperty("--accent", c.accent);
      pill.addEventListener("click", () => { openCountryId = c.id; renderCountries(); renderCities(); });
      countryScroll.append(pill);
    }
  }

  function renderCities() {
    cityGrid.innerHTML = "";
    const country = state.countries.find((c) => c.id === openCountryId);
    if (!country) return;
    for (const city of country.cities) {
      const local = localNow(city.tz);
      const active = city.id === ctx.city.id;
      const card = el("button", { class: "city-card" + (active ? " is-active" : "") }, [
        active ? el("span", { class: "pinned", text: "✓" }) : null,
        el("div", { class: "name", text: city.name }),
        el("div", { class: "when" }, [el("span", { "data-clock-tz": city.tz, text: clockLabel(local) }), " · locale"])
      ]);
      card.addEventListener("click", () => {
        if (city.id === ctx.city.id) return;
        ctx.changeCity(city.id); // met à jour ciel + heure + météo globalement
      });
      cityGrid.append(card);
    }
  }

  renderCountries();
  renderCities();

  root.append(el("div", { class: "travel-note", text:
    "Tu choisis où tu es : l'app aligne l'heure, le ciel, la météo et la saison. Pas de GPS, pas d'itinéraire figé — tu peux changer quand tu veux." }));

  // Mise à jour quand la ville/météo change depuis l'extérieur
  root._update = () => { renderHero(); renderCountries(); renderCities(); };

  return root;
}

function seasonEmoji(season) {
  if (season.kind === "tropical") return season.key === "pluies" ? "🌧️" : "🌤️";
  return { hiver: "❄️", printemps: "🌱", ete: "☀️", automne: "🍂" }[season.key] || "🗓️";
}
