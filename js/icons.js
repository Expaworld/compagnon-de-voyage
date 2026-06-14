/* ============================================================
   Icônes — SVG inline, trait souple, cohérent avec le ton calme.
   Toutes en currentColor pour hériter de la teinte du contexte.
   ============================================================ */

const S = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

export const ICONS = {
  compass: S(`<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>`),
  meal: S(`<path d="M5 3v8M8 3v8M6.5 3v18M5 11h3"/><path d="M17 3c-1.5 1-2 3-2 5s.5 4 2 5v4"/>`),
  drop: S(`<path d="M12 3s5 5.5 5 9.5a5 5 0 0 1-10 0C7 8.5 12 3 12 3z"/>`),
  face: S(`<circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"/><path d="M9 9.5h.01M15 9.5h.01"/>`),
  bottle: S(`<path d="M10 2h4M10 5h4M9 8c0-1.5 1-3 3-3s3 1.5 3 3v11a3 3 0 0 1-6 0z"/><path d="M9 13h6"/>`),
  fire: S(`<path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 .5-1.5.5-1.5C16 11 17 13 17 15a5 5 0 0 1-10 0c0-4 3-5 3-8 .5.5 1 1 2 1 .5-2-.5-4 0-5z"/>`),
  dumbbell: S(`<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>`),
  tooth: S(`<path d="M12 4c-2-1.5-5-1.5-6 1-1 2.5 0 5 .5 8 .3 1.8.5 4 1.5 4s1-2.5 2-2.5 1 2.5 2 2.5 1.2-2.2 1.5-4c.5-3 1.5-5.5.5-8-1-2.5-4-2.5-6-1z"/>`),
  pill: S(`<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/>`),
  breath: S(`<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9" opacity="0.5"/>`),
  moon: S(`<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>`),
  heart: S(`<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>`),
  sun: S(`<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>`),
  plane: S(`<path d="M3 13l7-1 4-7c.5-.9 2-.6 2 .4l-1 6 4 1.5c.7.3.7 1.3 0 1.6l-5 1.5-2 4c-.3.6-1.2.5-1.4-.2L11 16l-5 1-1-2 4-1z"/>`),
  globe: S(`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3C9.5 5.5 9.5 18.5 12 21"/>`),
  lungs: S(`<path d="M12 3v8M9 8c-2 1-3 3-3 6 0 2 0 4 2 4s2-2 2-4V9M15 8c2 1 3 3 3 6 0 2 0 4-2 4s-2-2-2-4V9"/>`),
  spark: S(`<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>`),
  check: `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`,
  plus: S(`<path d="M12 5v14M5 12h14"/>`),
  chevron: S(`<path d="M9 6l6 6-6 6"/>`)
};

export function icon(name) {
  return ICONS[name] || ICONS.spark;
}
