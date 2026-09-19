import { describe, it, expect } from 'vitest'
import {
  estimateLevel,
  TIERS,
  PROVISIONAL_THRESHOLD,
  CONSOLIDATED_THRESHOLD,
  MIN_PER_SPOT_FOR_CONSOLIDATED,
  WEAK_LINK_TOLERANCE,
} from './levelEstimator'

// Notations et contextKeys réels (cf. src/data/*.json) — peu importe qu'une notation soit "frontière"
// ou non pour ces tests : quand un lot est 100% correct ou 100% faux, la précision pondérée vaut
// 100% ou 0% quels que soient les poids individuels (chaque terme contribue proportionnellement au
// numérateur et au dénominateur).
function makeEntries(spot, contextKey, notation, correct, count) {
  return Array.from({ length: count }, () => ({ spot, contextKey, notation, correct }))
}

describe('estimateLevel — déblocage (locked / countdown)', () => {
  it('reste verrouillé avant le seuil provisoire, avec le compte à rebours exact', () => {
    const history = makeEntries('open', 'EP', 'AA', true, PROVISIONAL_THRESHOLD - 40)
    const result = estimateLevel(history)
    expect(result.status).toBe('locked')
    expect(result.countdown).toBe(40)
    expect(result.tier).toBeNull()
  })

  it('se débloque pile au seuil provisoire (plus "locked")', () => {
    const history = [
      ...makeEntries('open', 'EP', 'AA', true, 50),
      ...makeEntries('bb_defense', 'vs_EP', 'QQ', true, 50),
      ...makeEntries('vs_3bet', 'open_EP_MP', 'KK', true, 50),
    ]
    expect(history.length).toBe(PROVISIONAL_THRESHOLD)
    const result = estimateLevel(history)
    expect(result.status).not.toBe('locked')
    expect(result.tier).not.toBeNull()
  })
})

describe('estimateLevel — calcul du palier', () => {
  it('atteint le palier le plus haut quand tous les spots sont à 100% de précision', () => {
    const history = [
      ...makeEntries('open', 'EP', 'AA', true, 50),
      ...makeEntries('bb_defense', 'vs_EP', 'QQ', true, 50),
      ...makeEntries('vs_3bet', 'open_EP_MP', 'KK', true, 50),
    ]
    const result = estimateLevel(history)
    expect(result.effectiveScore).toBe(100)
    expect(result.tier).toBe(TIERS[TIERS.length - 1])
    expect(result.tier.label).toBe('Élite préflop')
    expect(result.subScore).toBe(100)
    expect(result.blockingSpot).toBeNull()
  })

  it('atteint le premier palier quand tous les spots sont à 0% de précision', () => {
    const history = [
      ...makeEntries('open', 'EP', 'AA', false, 50),
      ...makeEntries('bb_defense', 'vs_EP', 'QQ', false, 50),
      ...makeEntries('vs_3bet', 'open_EP_MP', 'KK', false, 50),
    ]
    const result = estimateLevel(history)
    expect(result.effectiveScore).toBe(0)
    expect(result.tier).toBe(TIERS[0])
    expect(result.tier.label).toBe('Découverte')
  })
})

describe('estimateLevel — maillon faible (plafonnement)', () => {
  it('plafonne le palier sur le spot le plus faible quand l\'écart dépasse la tolérance', () => {
    const history = [
      ...makeEntries('open', 'EP', 'AA', true, 50), // 100%
      ...makeEntries('bb_defense', 'vs_EP', 'QQ', true, 50), // 100%
      ...makeEntries('vs_3bet', 'open_EP_MP', 'KK', false, 50), // 0% — le maillon faible
    ]
    const result = estimateLevel(history)
    // Score global nettement > 0 (2 spots sur 3 à 100%), mais le pire spot (0%) + tolérance plafonne
    // le score effectif à son niveau, quel que soit le score global exact.
    expect(result.effectiveScore).toBeLessThanOrEqual(WEAK_LINK_TOLERANCE)
    expect(result.blockingSpot).toBe('vs_3bet')
    expect(result.tier).toBe(TIERS[0])
  })

  it('ne plafonne PAS quand l\'écart entre le pire spot et le score global reste dans la tolérance', () => {
    // Les 3 spots sont proches (aucun décrochage) : pas de spot bloquant, score global inchangé.
    const history = [
      ...makeEntries('open', 'EP', 'AA', true, 50),
      ...makeEntries('bb_defense', 'vs_EP', 'QQ', true, 50),
      ...makeEntries('vs_3bet', 'open_EP_MP', 'KK', true, 50),
    ]
    const result = estimateLevel(history)
    expect(result.blockingSpot).toBeNull()
  })
})

describe('estimateLevel — transitions de fiabilité', () => {
  it('la fiabilité grandit continûment avec le volume, plafonnée à 100', () => {
    const at0 = estimateLevel([])
    const atHalf = estimateLevel(makeEntries('open', 'EP', 'AA', true, CONSOLIDATED_THRESHOLD / 2))
    const atFull = estimateLevel(makeEntries('open', 'EP', 'AA', true, CONSOLIDATED_THRESHOLD))
    const beyond = estimateLevel(makeEntries('open', 'EP', 'AA', true, CONSOLIDATED_THRESHOLD + 200))

    expect(at0.reliabilityPercent).toBe(0)
    expect(atHalf.reliabilityPercent).toBe(50)
    expect(atFull.reliabilityPercent).toBe(100)
    expect(beyond.reliabilityPercent).toBe(100)
  })

  it('reste "provisional" à 400 réponses si la couverture par spot est insuffisante', () => {
    // 400 réponses au total, mais uniquement sur le spot "open" : pas de couverture bb_defense/vs_3bet.
    const history = makeEntries('open', 'EP', 'AA', true, CONSOLIDATED_THRESHOLD)
    const result = estimateLevel(history)
    expect(result.status).toBe('provisional')
  })

  it('passe "consolidated" à 400 réponses avec une couverture ≥30 par spot dans la fenêtre récente', () => {
    const history = [
      ...makeEntries('open', 'EP', 'AA', true, 200),
      ...makeEntries('bb_defense', 'vs_EP', 'QQ', true, 100),
      ...makeEntries('vs_3bet', 'open_EP_MP', 'KK', true, 100),
    ]
    expect(history.length).toBe(CONSOLIDATED_THRESHOLD)
    // Chaque spot a bien >= MIN_PER_SPOT_FOR_CONSOLIDATED dans les 300 dernières réponses.
    const result = estimateLevel(history)
    expect(result.status).toBe('consolidated')
    expect(MIN_PER_SPOT_FOR_CONSOLIDATED).toBeLessThanOrEqual(100)
  })
})
