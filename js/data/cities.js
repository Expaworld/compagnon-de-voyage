/* ============================================================
   Villes de départ — Amérique latine.
   L'itinéraire n'est PAS figé : l'utilisateur peut ajouter /
   retirer pays et villes (voir espace Voyage). Rien de codé en
   dur ailleurs ne doit dépendre de cette liste précise.

   Chaque ville porte tout ce dont l'app a besoin :
   - tz   : fuseau IANA (heure locale, ciel, rappels)
   - lat  : latitude signée (hémisphère + saison)
   - lon  : longitude (position du soleil, plus tard)
   - zone : 'tropics' | 'subtropics' | 'south' (logique de saison)
   ============================================================ */

export const SEED_COUNTRIES = [
  {
    id: "gt",
    name: "Guatemala",
    flag: "🇬🇹",
    accent: "#3f6b52",      // vert jungle / altiplano
    cities: [
      { id: "gt-gua", name: "Guatemala City", tz: "America/Guatemala", lat: 14.63, lon: -90.51, zone: "tropics" },
      { id: "gt-ant", name: "Antigua",        tz: "America/Guatemala", lat: 14.56, lon: -90.73, zone: "tropics" },
      { id: "gt-flo", name: "Flores",         tz: "America/Guatemala", lat: 16.93, lon: -89.89, zone: "tropics" },
      { id: "gt-xel", name: "Quetzaltenango", tz: "America/Guatemala", lat: 14.84, lon: -91.52, zone: "tropics" }
    ]
  },
  {
    id: "co",
    name: "Colombie",
    flag: "🇨🇴",
    accent: "#e0794a",
    cities: [
      { id: "co-bog", name: "Bogotá",     tz: "America/Bogota", lat: 4.71,  lon: -74.07, zone: "tropics" },
      { id: "co-med", name: "Medellín",   tz: "America/Bogota", lat: 6.24,  lon: -75.57, zone: "tropics" },
      { id: "co-car", name: "Carthagène", tz: "America/Bogota", lat: 10.39, lon: -75.51, zone: "tropics" },
      { id: "co-cal", name: "Cali",       tz: "America/Bogota", lat: 3.45,  lon: -76.53, zone: "tropics" }
    ]
  },
  {
    id: "ar",
    name: "Argentine",
    flag: "🇦🇷",
    accent: "#5a7fb0",
    cities: [
      { id: "ar-bue", name: "Buenos Aires", tz: "America/Argentina/Buenos_Aires", lat: -34.60, lon: -58.38, zone: "south" },
      { id: "ar-men", name: "Mendoza",      tz: "America/Argentina/Mendoza",      lat: -32.89, lon: -68.85, zone: "south" },
      { id: "ar-bar", name: "Bariloche",    tz: "America/Argentina/Salta",        lat: -41.13, lon: -71.31, zone: "south" },
      { id: "ar-sal", name: "Salta",        tz: "America/Argentina/Salta",        lat: -24.79, lon: -65.41, zone: "subtropics" }
    ]
  },
  {
    id: "cl",
    name: "Chili",
    flag: "🇨🇱",
    accent: "#c75b39",
    cities: [
      { id: "cl-san", name: "Santiago",       tz: "America/Santiago", lat: -33.45, lon: -70.67, zone: "south" },
      { id: "cl-val", name: "Valparaíso",     tz: "America/Santiago", lat: -33.05, lon: -71.62, zone: "south" },
      { id: "cl-ata", name: "San Pedro de Atacama", tz: "America/Santiago", lat: -22.91, lon: -68.20, zone: "subtropics" },
      { id: "cl-pun", name: "Punta Arenas",   tz: "America/Punta_Arenas", lat: -53.16, lon: -70.92, zone: "south" }
    ]
  },
  {
    id: "uy",
    name: "Uruguay",
    flag: "🇺🇾",
    accent: "#5e8d6e",
    cities: [
      { id: "uy-mon", name: "Montevideo",     tz: "America/Montevideo", lat: -34.90, lon: -56.16, zone: "south" },
      { id: "uy-pun", name: "Punta del Este", tz: "America/Montevideo", lat: -34.96, lon: -54.95, zone: "south" },
      { id: "uy-col", name: "Colonia",        tz: "America/Montevideo", lat: -34.47, lon: -57.84, zone: "south" }
    ]
  }
];

export const DEFAULT_CITY_ID = "co-med";

/* Aplatit toutes les villes avec une réf vers leur pays. */
export function flattenCities(countries) {
  const out = [];
  for (const c of countries) {
    for (const city of c.cities) {
      out.push({ ...city, countryId: c.id, countryName: c.name, flag: c.flag, accent: c.accent });
    }
  }
  return out;
}

export function findCity(countries, cityId) {
  return flattenCities(countries).find((c) => c.id === cityId) || null;
}
