/* ============================================================
   Temps & saison — tout est piloté par la VILLE sélectionnée,
   jamais par le GPS ni l'horloge brute de l'appareil.

   L'heure locale vient du fuseau IANA de la ville (Intl).
   La saison se déduit de la date + latitude (hémisphère).
   ============================================================ */

/* Renvoie l'heure locale de la ville sous forme exploitable.
   { y, mo, d, h, m, s, hourFloat, dayKey, weekday } */
export function localNow(tz, baseDate = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false, weekday: "short"
  });
  const parts = {};
  for (const p of fmt.formatToParts(baseDate)) parts[p.type] = p.value;

  let h = parseInt(parts.hour, 10);
  if (h === 24) h = 0; // certains environnements rendent 24:00
  const m = parseInt(parts.minute, 10);
  const s = parseInt(parts.second, 10);

  return {
    y: parseInt(parts.year, 10),
    mo: parseInt(parts.month, 10),
    d: parseInt(parts.day, 10),
    h, m, s,
    hourFloat: h + m / 60 + s / 3600,
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: parts.weekday
  };
}

/* Clé de jour locale (YYYY-MM-DD) pour la persistance. */
export function dayKeyFor(tz, baseDate = new Date()) {
  return localNow(tz, baseDate).dayKey;
}

/* Moment de la journée — sert au regroupement et aux relances. */
export function dayPart(hourFloat) {
  if (hourFloat < 5) return "nuit";
  if (hourFloat < 11) return "matin";
  if (hourFloat < 18) return "journee";
  if (hourFloat < 22) return "soir";
  return "nuit";
}

/* Salutation chaleureuse selon l'heure locale. */
export function greeting(hourFloat) {
  if (hourFloat < 5) return "Encore debout ?";
  if (hourFloat < 11) return "Bonjour";
  if (hourFloat < 18) return "Bel après-midi";
  if (hourFloat < 22) return "Bonne soirée";
  return "Douce nuit";
}

/* Heure locale formatée HH:MM. */
export function clockLabel(local) {
  return `${String(local.h).padStart(2, "0")}:${String(local.m).padStart(2, "0")}`;
}

/* ----------------------------------------------------------
   Saison — déduite automatiquement (pas de réglage manuel).
   - Cône sud (lat < 0, zone 'south'/'subtropics') : saisons
     inversées (été en déc–fév).
   - Tropiques (zone 'tropics') : saison sèche / saison des
     pluies plutôt que les 4 saisons.
   ---------------------------------------------------------- */
export function inferSeason(city, local) {
  const month = local.mo; // 1..12
  const south = city.lat < 0;

  if (city.zone === "tropics") {
    // Approximation : pluies ~ avril→novembre, sèche ~ déc→mars.
    // (Varie selon la région ; on reste indicatif et bienveillant.)
    const wet = month >= 4 && month <= 11;
    return {
      kind: "tropical",
      key: wet ? "pluies" : "seche",
      label: wet ? "Saison des pluies" : "Saison sèche",
      hint: wet ? "Averses possibles l'après-midi." : "Ciel souvent dégagé."
    };
  }

  // Quatre saisons (inversées au sud)
  // Hémisphère nord : déc–fév hiver, mar–mai printemps, etc.
  const nMonth = south ? ((month + 5) % 12) + 1 : month; // décale de 6 mois au sud
  let key, label;
  if (nMonth === 12 || nMonth <= 2) { key = "hiver"; label = "Hiver"; }
  else if (nMonth <= 5) { key = "printemps"; label = "Printemps"; }
  else if (nMonth <= 8) { key = "ete"; label = "Été"; }
  else { key = "automne"; label = "Automne"; }

  return {
    kind: "temperate",
    key, label,
    hemisphere: south ? "sud" : "nord",
    hint: south ? "Saisons inversées (hémisphère sud)." : ""
  };
}
