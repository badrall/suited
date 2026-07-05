import { describe, it, expect } from 'vitest'
import { ALL_NOTATIONS, weightFor, weightedChoice } from './hands'

describe('ALL_NOTATIONS', () => {
  it('couvre exactement les 169 combos canoniques (13 paires + 78 suitées + 78 offsuit)', () => {
    expect(ALL_NOTATIONS.length).toBe(169)
    expect(new Set(ALL_NOTATIONS).size).toBe(169)
  })
})

describe('weightFor (tirage pondéré)', () => {
  it('donne un poids de 3 à une main frontière', () => {
    const frontier = new Set(['A9s', 'KJs'])
    expect(weightFor('A9s', frontier)).toBe(3)
  })

  it('donne un poids réduit à une main triviale (AA, KK, junk off-suit)', () => {
    const frontier = new Set()
    expect(weightFor('AA', frontier)).toBeLessThan(1)
    expect(weightFor('KK', frontier)).toBeLessThan(1)
    expect(weightFor('72o', frontier)).toBeLessThan(1)
  })

  it('donne un poids normal (1) à une main ni frontière ni triviale', () => {
    const frontier = new Set()
    expect(weightFor('87s', frontier)).toBe(1)
  })

  it('priorise toujours la frontière même si la main est par ailleurs triviale', () => {
    // AA ne peut pas être une main frontière dans ce jeu de données, mais on vérifie la priorité
    // de branchement : si une main est dans le set frontière, elle garde le poids 3.
    const frontier = new Set(['AA'])
    expect(weightFor('AA', frontier)).toBe(3)
  })
})

describe('weightedChoice (distribution statistique)', () => {
  it('tire les mains frontières nettement plus souvent que les mains normales', () => {
    const frontier = new Set(['A9s'])
    const counts = { A9s: 0, '72o': 0, '87s': 0 }
    const N = 20000
    for (let i = 0; i < N; i++) {
      const pick = weightedChoice(['A9s', '72o', '87s'], (n) => weightFor(n, frontier))
      counts[pick] += 1
    }
    // Poids relatifs : A9s=3, 87s=1, 72o=0.25 → ratios attendus ~3x et ~4x, on vérifie large pour éviter le flake.
    expect(counts.A9s).toBeGreaterThan(counts['87s'] * 2)
    expect(counts['72o']).toBeLessThan(counts['87s'])
  })

  it('respecte des poids simples de façon déterministe (2 items, poids identiques)', () => {
    const counts = { a: 0, b: 0 }
    for (let i = 0; i < 2000; i++) {
      counts[weightedChoice(['a', 'b'], () => 1)] += 1
    }
    // Avec des poids égaux, aucune des deux options ne doit dominer largement (± tolérance statistique).
    expect(counts.a).toBeGreaterThan(700)
    expect(counts.b).toBeGreaterThan(700)
  })
})
