// Estimateur de niveau réel (préflop) — design Notion page 2.8 (v0.2, validée 06/07).
// Mesure la SOLIDITÉ PRÉFLOP à partir des vraies réponses de jeu — pas un score abstrait, un palier
// ancré au réel (freerolls → calibre WSOP). Ne mesure PAS le postflop (cf. PREFLOP_ONLY_CAVEAT).

import rangesOpenData from '../data/ranges-open-raise-9max-live.json'
import rangesDefenseData from '../data/ranges-defense-bb-et-vs-3bet.json'
import { getFrontierSet, SPOTS } from './hands'

// --- Constantes réglables (textes/seuils validés en 2.8 ; scores de palier = valeurs illustratives
// à recalibrer une fois de vraies données de jeu disponibles) -----------------------------------

export const RECENT_WINDOW = 300 // "période récente" prise en compte (design : 200-300 dernières réponses)
export const PROVISIONAL_THRESHOLD = 150 // estimation provisoire débloquée à partir de ce nombre de réponses
export const CONSOLIDATED_THRESHOLD = 400 // estimation consolidée à partir de ce nombre de réponses...
export const MIN_PER_SPOT_FOR_CONSOLIDATED = 30 // ...ET cette couverture mini par spot (fenêtre récente)
export const FRONTIER_ACCURACY_WEIGHT = 2 // poids d'une réponse sur main frontière dans le score (vs 1 sinon)
export const WEAK_LINK_TOLERANCE = 6 // points de tolérance avant qu'un spot faible plafonne le palier

export const PREFLOP_ONLY_CAVEAT =
  'Cet estimateur mesure ta solidité préflop. Le poker gagnant, c\'est aussi le postflop, la lecture et la gestion — non mesurés ici. Un préflop solide est la fondation, pas le toit.'

// Les 5 paliers (textes repris de la page Notion 2.8, v0.2 pour les ancrages réels).
export const TIERS = [
  {
    id: 1,
    label: 'Découverte',
    min: 0,
    meaning: 'Préflop encore fragile : erreurs sur des situations simples.',
    realWorld: 'Freerolls, home games, satellites à quelques €.',
    unlocks: 'Arrêter de te saborder avant le flop. Objectif : les fondamentaux par position.',
  },
  {
    id: 2,
    label: 'Amateur solide',
    min: 45,
    meaning: 'Préflop propre sur les situations standard ; quelques fuites sur les frontières.',
    realWorld: 'Petits tournois casino / deepstacks 40-100€ (type WiPT, dailies).',
    unlocks: 'Ne plus perdre ta cave au préflop. Tu survis, sans edge net encore.',
  },
  {
    id: 3,
    label: 'Reg local',
    min: 62,
    meaning: 'Préflop rigoureux, frontières incluses, cohérent sur les 3 spots.',
    realWorld: "Side events de festival 200-300€ (FPO Closer/KO), jusqu'à la Cup 550€ / FPO Main 600€.",
    unlocks: "Le préflop n'est plus une fuite : tu peux viser un cashflow positif (si le postflop suit).",
  },
  {
    id: 4,
    label: 'Fort régional',
    min: 78,
    meaning: 'Préflop quasi sans fuite ; discipline sur défenses et 3/4-bets.',
    realWorld: 'Main events & high rollers de circuit 1000-2200€ (PokerStars Open Main 1100€, HR 2200€).',
    unlocks: 'Jouer plus haut sans que le préflop te trahisse.',
  },
  {
    id: 5,
    label: 'Élite préflop',
    min: 90,
    meaning: 'Rigueur préflop irréprochable et constante.',
    realWorld: 'Grands tournois internationaux, calibre WSOP Main Event (~10 000 $).',
    unlocks: 'Rappel : le postflop reste un chantier distinct — c\'est lui qui fera la différence à ce niveau.',
  },
]

function tierForScore(score) {
  let tier = TIERS[0]
  for (const t of TIERS) if (score >= t.min) tier = t
  return tier
}

// Précision pondérée d'un lot de réponses : chaque réponse sur une main frontière (pour son propre
// spot/contexte) pèse FRONTIER_ACCURACY_WEIGHT fois plus — "tout le monde couche 72o et ouvre AA,
// le niveau se lit sur les décisions limites".
function weightedAccuracy(entries) {
  if (!entries.length) return null
  let correct = 0
  let total = 0
  for (const entry of entries) {
    const frontierSet = getFrontierSet(entry.spot, entry.contextKey, rangesOpenData, rangesDefenseData)
    const weight = frontierSet.has(entry.notation) ? FRONTIER_ACCURACY_WEIGHT : 1
    total += weight
    if (entry.correct) correct += weight
  }
  return Math.round((correct / total) * 100)
}

/**
 * Estime le niveau réel (préflop) à partir de l'historique complet des réponses.
 * Pure (aucun accès à localStorage) : l'appelant lit `history` via storage.loadState().
 */
export function estimateLevel(history) {
  const totalAnswered = history.length
  const reliabilityPercent = Math.round(Math.min(100, (totalAnswered / CONSOLIDATED_THRESHOLD) * 100))

  if (totalAnswered < PROVISIONAL_THRESHOLD) {
    return {
      status: 'locked',
      countdown: PROVISIONAL_THRESHOLD - totalAnswered,
      reliabilityPercent,
      tier: null,
      nextTier: null,
      subScore: null,
      effectiveScore: null,
      spotScores: {},
      blockingSpot: null,
    }
  }

  const recent = history.slice(-RECENT_WINDOW)
  const spotEntries = {}
  for (const spot of SPOTS) spotEntries[spot] = recent.filter((e) => e.spot === spot)

  const spotScores = {}
  for (const spot of SPOTS) spotScores[spot] = { score: weightedAccuracy(spotEntries[spot]), count: spotEntries[spot].length }

  const globalScore = weightedAccuracy(recent) ?? 0

  // Maillon faible = plafond, avec une petite tolérance pour qu'une série malchanceuse sur un spot
  // ne fasse pas chuter le niveau affiché (cf. 2.8, Q4).
  let weakest = null
  for (const spot of SPOTS) {
    const { score } = spotScores[spot]
    if (score == null) continue
    if (!weakest || score < weakest.score) weakest = { spot, score }
  }

  let effectiveScore = globalScore
  let blockingSpot = null
  if (weakest && weakest.score + WEAK_LINK_TOLERANCE < globalScore) {
    effectiveScore = weakest.score + WEAK_LINK_TOLERANCE
    blockingSpot = weakest.spot
  }
  effectiveScore = Math.max(0, Math.min(100, Math.round(effectiveScore)))

  const tier = tierForScore(effectiveScore)
  const nextTier = TIERS[TIERS.indexOf(tier) + 1] ?? null
  const subScore = nextTier
    ? Math.round(Math.max(0, Math.min(100, ((effectiveScore - tier.min) / (nextTier.min - tier.min)) * 100)))
    : 100

  const coverageOk = SPOTS.every((spot) => spotEntries[spot].length >= MIN_PER_SPOT_FOR_CONSOLIDATED)
  const status = totalAnswered >= CONSOLIDATED_THRESHOLD && coverageOk ? 'consolidated' : 'provisional'

  return { status, countdown: 0, reliabilityPercent, tier, nextTier, subScore, effectiveScore, spotScores, blockingSpot }
}
