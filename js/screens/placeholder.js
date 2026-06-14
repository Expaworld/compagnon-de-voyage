/* ============================================================
   Espace en chantier — gabarit calme et cohérent en attendant
   le contenu complet (on construit les espaces un par un).
   ============================================================ */

import { el } from "../ui.js";
import { icon } from "../icons.js";

export function makePlaceholder(meta) {
  return {
    render() {
      const root = el("div", { class: "screen-pad" });
      root.append(el("div", { class: "topbar" }, [
        el("div", { class: "city" }, [el("span", { text: meta.label })])
      ]));
      root.append(el("div", { class: "coming" }, [
        el("div", { class: "glyph", html: icon(meta.icon) }),
        el("h2", { text: meta.label }),
        el("p", { text: meta.blurb })
      ]));
      return root;
    }
  };
}

export const PLACEHOLDER_META = {
  meals: {
    label: "Repas & eau", icon: "meal",
    blurb: "« As-tu mangé ? », trois ancres douces, eau qui se remplit vers 2 L et idées de repas simples. On construit cet espace ensuite."
  },
  sport: {
    label: "Sport", icon: "dumbbell",
    blurb: "Rotation de séances au poids du corps (et bande), animations par exercice, et les 100 pompes du jour. À venir, juste après."
  },
  care: {
    label: "Soin", icon: "drop",
    blurb: "Minoxidil matin/soir, visage, dents 3×. Des gestes simples rangés dans tes blocs matin et soir."
  },
  breathing: {
    label: "Respiration", icon: "lungs",
    blurb: "Un guide visuel qui se dilate et se contracte. Quatre exercices doux à expiration longue, jamais d'hyperventilation."
  },
  meds: {
    label: "Prises & décalage", icon: "pill",
    blurb: "Ton hub de prises : traitement + compléments, rappels à l'heure locale, décalage progressif paramétrable. L'app est un outil, jamais un décideur."
  }
};
