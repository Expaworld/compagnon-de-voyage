/* ============================================================
   Repas & eau — données.
   Logique « as-tu mangé », pas « quoi manger ». Trois repas en
   ancres douces (mêmes ids que les repères du jour, donc cocher
   ici nourrit l'avion sur Aujourd'hui).
   ============================================================ */

/* Créneaux de relance, calés sur l'HEURE LOCALE de la ville.
   `due` = plage où l'app propose gentiment le repas.
   Aucune culpabilité hors plage : on re-propose plus tard. */
export const MEAL_SLOTS = [
  {
    id: "mealMorning", label: "Petit-déjeuner", emoji: "🌅",
    due: [6, 11.5], hint: "De quoi démarrer la journée en douceur."
  },
  {
    id: "mealMidday", label: "Déjeuner", emoji: "🌞",
    due: [11.5, 15.5], hint: "Un vrai repas au milieu de la journée."
  },
  {
    id: "mealEvening", label: "Dîner", emoji: "🌙",
    due: [18, 23], hint: "Recharger un peu avant la nuit."
  }
];

/* Filet de sécurité : idées ultra simples, économiques, pour les
   jours sans envie de réfléchir. Ingrédients faciles à trouver en
   Amérique latine. Aucune notion de calories — juste de l'énergie. */
export const MEAL_IDEAS = [
  {
    name: "Huevos & frijoles", emoji: "🍳",
    items: ["2 œufs", "haricots noirs", "tortilla ou pain", "avocat si dispo"],
    note: "Le classique : rapide, nourrissant, partout."
  },
  {
    name: "Arroz completo", emoji: "🍚",
    items: ["riz", "thon ou œuf", "un filet d'huile d'olive", "tomate"],
    note: "Une casserole, cinq minutes, plein d'énergie."
  },
  {
    name: "Plátano power", emoji: "🍌",
    items: ["banane", "beurre de cacahuète", "flocons d'avoine", "un peu de lait"],
    note: "Quand l'estomac n'est pas trop d'accord."
  },
  {
    name: "Pan con todo", emoji: "🥪",
    items: ["pain", "fromage ou avocat", "tomate", "œuf dur"],
    note: "Sans cuisson, à emporter."
  }
];

/* État de relance d'un repas selon l'heure locale et la coche. */
export function mealStatus(slot, done, hourFloat) {
  if (done) return { kind: "done", text: "Fait — très bien." };
  const [a, b] = slot.due;
  if (hourFloat >= a && hourFloat < b) return { kind: "due", text: "C'est le moment, si tu peux." };
  if (hourFloat >= b) return { kind: "later", text: "Pas encore ? Quand tu veux, sans pression." };
  return { kind: "soon", text: "Un peu plus tard dans la journée." };
}
