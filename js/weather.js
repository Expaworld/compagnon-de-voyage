/* ============================================================
   Météo — SEULE fonctionnalité qui dépend du réseau.
   API gratuite sans clé (Open-Meteo). On récupère en ligne, on
   met en cache la dernière valeur connue, et on l'affiche avec
   sa date quand on est hors-ligne.
   ============================================================ */

import { getState, update } from "./store.js";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

/* Code météo Open-Meteo -> libellé + emoji doux. */
const WMO = {
  0:  ["Ciel clair", "☀️"],
  1:  ["Plutôt clair", "🌤️"],
  2:  ["Partiellement nuageux", "⛅"],
  3:  ["Couvert", "☁️"],
  45: ["Brouillard", "🌫️"], 48: ["Brouillard givrant", "🌫️"],
  51: ["Bruine légère", "🌦️"], 53: ["Bruine", "🌦️"], 55: ["Bruine dense", "🌧️"],
  61: ["Pluie légère", "🌦️"], 63: ["Pluie", "🌧️"], 65: ["Forte pluie", "🌧️"],
  66: ["Pluie verglaçante", "🌧️"], 67: ["Pluie verglaçante", "🌧️"],
  71: ["Neige légère", "🌨️"], 73: ["Neige", "🌨️"], 75: ["Forte neige", "❄️"],
  77: ["Grains de neige", "🌨️"],
  80: ["Averses", "🌦️"], 81: ["Averses", "🌧️"], 82: ["Fortes averses", "⛈️"],
  85: ["Averses de neige", "🌨️"], 86: ["Averses de neige", "❄️"],
  95: ["Orage", "⛈️"], 96: ["Orage grêle", "⛈️"], 99: ["Orage violent", "⛈️"]
};

export function describeWeather(code) {
  return WMO[code] || ["—", "🌡️"];
}

/* Récupère la météo de la ville. Met à jour le cache du store.
   Renvoie l'objet météo (frais ou null si échec et pas de cache). */
export async function fetchWeather(city, nowTs = Date.now()) {
  const url = `${ENDPOINT}?latitude=${city.lat}&longitude=${city.lon}`
    + `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m`
    + `&timezone=auto`;

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const cur = data.current || {};
    const weather = {
      cityId: city.id,
      temp: Math.round(cur.temperature_2m),
      feels: Math.round(cur.apparent_temperature),
      humidity: cur.relative_humidity_2m,
      wind: Math.round(cur.wind_speed_10m),
      code: cur.weather_code,
      fetchedAt: nowTs,
      online: true
    };
    update((s) => { s.weather = weather; }, "weather");
    return weather;
  } catch (e) {
    // Hors-ligne ou échec : on retombe sur la dernière valeur connue.
    const cached = getState().weather;
    if (cached) return { ...cached, online: false };
    return null;
  }
}

/* Indice d'hydratation : pousse gentiment vers un peu plus d'eau
   quand il fait chaud (ou en altitude). Jamais culpabilisant. */
export function hydrationHint(weather, city) {
  if (!weather) return null;
  const hot = weather.temp >= 28 || weather.feels >= 30;
  const altitude = city && ["Bogotá", "La Paz", "Quito", "Cusco", "San Pedro de Atacama"].some((n) => city.name.includes(n));
  if (hot && altitude) return "Chaud et en altitude — pense à boire un peu plus aujourd'hui.";
  if (hot) return "Il fait chaud — un verre d'eau de plus serait bienvenu.";
  if (altitude) return "En altitude, le corps se déshydrate vite — bois régulièrement.";
  return null;
}

/* Âge lisible de la dernière mesure (pour l'affichage hors-ligne). */
export function weatherAge(weather, nowTs = Date.now()) {
  if (!weather) return "";
  const mins = Math.round((nowTs - weather.fetchedAt) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  const days = Math.round(hrs / 24);
  return `il y a ${days} j`;
}
