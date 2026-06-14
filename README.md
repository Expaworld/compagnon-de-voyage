# Compagnon de voyage

PWA personnelle, point d'ancrage pour un voyage en sac à dos. Calme,
premium, sans culpabilisation. La santé est le fil rouge ; la
progression du jour se montre par **l'avion qui décolle**, jamais par
un chiffre.

## Lancer

PWA statique, aucun build. Sers le dossier `app/` :

```bash
cd app
python3 -m http.server 8765
# puis ouvre http://localhost:8765 (sur iPhone : « Ajouter à l'écran d'accueil »)
```

Le service worker (`sw.js`) cache l'app shell : tout marche hors ligne,
sauf la météo (Open-Meteo, sans clé) dont la dernière valeur connue est
gardée et affichée avec sa date.

## Structure

```
index.html              app shell + couches de ciel
manifest.webmanifest    installable, plein écran
sw.js                   offline-first (précache shell)
css/                    tokens (palette), base, sky, components, today, travel
js/
  app.js                orchestrateur (store, ciel, météo, horloge, nav)
  store.js              persistance localStorage versionnée + réactif
  router.js             écrans + barre des espaces
  time.js               heure locale (fuseau ville) + saison déduite
  sky.js                ciel dynamique (interpolation par heure locale)
  plane.js              métaphore de l'avion (roulage → décollage)
  weather.js            Open-Meteo + cache hors-ligne
  messages.js           micro-copy (ton compagnon, relances à l'ouverture)
  icons.js · ui.js      SVG inline · helpers (toast, haptics, el)
  data/cities.js        villes (fuseau, lat/lon) — éditable
  data/anchors.js       repères du jour (essentiel / bonus) — éditable
  screens/              today, travel, placeholder (espaces à venir)
```

## État d'avancement

- ✅ Structure, navigation, app shell, offline, persistance
- ✅ **Aujourd'hui** : avion + piste, ciel dynamique, repères groupés,
  rituel « vision claire », relances douces, météo
- ✅ **Voyage** : sélecteur pays/ville (pilote heure, ciel, météo, saison)
- ✅ **Repas & eau** : « as-tu mangé » (3 repas, relances locales),
  gourde qui se remplit vers 2 L (tap verre/gourde), poussée douce
  chaud/altitude, rappel eau sûre, idées de repas simples
- ✅ **Sport** : 100 pompes du jour (+5/+10/+20, victoire), séance en
  rotation (3 types, complet/express, variantes sans bande/ancrage),
  ~15 exercices avec figures animées + consigne + progression douce,
  marche/rando comptent
- ✅ **Soin** : routines guidées matin/soir (étapes ordonnées
  cochables : minoxidil → visage/nettoyant), dents 3× (+1/+2/+3)
- ✅ **Respiration** : orbe guide qui se dilate/contracte, 4 exercices
  doux à expiration longue (endormissement, soupir physiologique,
  réveil, cohérence cardiaque), anneau de progression, sécurité (zéro
  hyperventilation / rétention)
- ✅ **Prises & décalage** : hub traitement + compléments (saisie libre,
  compléments vides au départ), prises du jour en timeline locale,
  décalage de fuseau progressif paramétrable et visualisé, suivi de
  stock optionnel — l'app reste un outil, jamais un décideur médical

**Tous les espaces sont construits.** 🎉

## Ajuster facilement

- **Villes** : `js/data/cities.js` (ajout/retrait pays & villes).
- **Repères du jour** : `js/data/anchors.js` (un objet = un repère ;
  `essential: true` le met dans l'essentiel qui fait décoller l'avion).
- **Horaires de prises** : saisis dans l'app (espace Prises, à venir) —
  l'app est un outil, jamais un décideur médical.
