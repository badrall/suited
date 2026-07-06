# Suited — contexte projet (à lire avant toute modification)

App d'entraînement poker préflop (« le Duolingo du poker »). React 19 + Vite, données JSON statiques, localStorage, pas de backend. Déploiement Vercel.

## Modèle de travail — DEUX intervenants sur ce code

1. **Claude Code** (toi) : implémente les grosses features via des prompts que Guillaume te copie-colle depuis son projet Notion.
2. **Claude (Cowork)** : co-fondateur produit de Guillaume. Il applique parfois **de petits correctifs directement dans les fichiers** (CSS, bugs de logique ciblés, fichiers de données) et tient à jour le projet Notion + ce fichier.

**Règle de coordination :** les changements listés ci-dessous sont **VOLONTAIRES et validés**. Ne les « corrige » pas, ne les annule pas en pensant à un bug. Si un prompt te demande de retoucher une zone concernée, **préserve ces comportements** (ils sont aussi commentés dans le code).

## Décisions & correctifs appliqués en direct (ne pas revert)

- **Bouton CALL (limp) conservé en open-raise** (`buttonsForSpot`, `Drill`, `Feedback`) : CALL n'est jamais la bonne réponse en open-raise, mais on le laisse volontairement pour que le débutant puisse tester le limp et apprendre via le feedback dédié. Ne pas retirer ce bouton.
- **Place du ruban réservée sur tous les écrans** (`src/index.css`) : règle `.app-shell:has(> .nav) .screen { padding-bottom … }`. Corrige un contenu inatteignable sous le ruban fixe. Ne pas remplacer par un padding conditionnel qui oublierait certains écrans.
- **Tirage des mains restreint par spot** (`candidatePool` dans `src/lib/hands.js`) : en `bb_defense` et `vs_3bet`, on ne tire QUE dans les mains réellement en jeu (listées dans le JSON : continues + folds frontières), pas dans les 169 combos. En `vs_3bet` c'est indispensable : on n'atteint ce spot que si on a ouvert — tirer dans les 169 présentait des mains jamais ouvertes (fold absurde). L'`open` reste sur les 169 combos (volontaire).

## Conventions

- Ranges live (casino/cercle) 9-max 100bb, légèrement plus tight que le GTO online. Action par défaut : fold.
- Le suivi des décisions produit vit dans Notion (page « ♠️ Suited »). Ce fichier = uniquement le contrat technique entre les deux Claude.
- Quand tu fais une modif structurante, ajoute-la à la section ci-dessus pour que l'autre intervenant soit au courant.
