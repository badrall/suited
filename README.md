# Suited

Entraîneur de poker préflop façon Duolingo — mobile-first, en français, PWA-ready.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (par défaut http://localhost:5173).

## Build de production

```bash
npm run build
npm run preview
```

## Structure

- `src/screens` — écrans (Accueil, Drill, Feedback, Fin de session, Progrès, Placeholder)
- `src/components` — composants partagés (table, cartes, icônes, barres de progression)
- `src/lib` — logique (tirage des mains, persistance localStorage)
- `src/data` — données préflop fournies (ranges, explications, équités)
