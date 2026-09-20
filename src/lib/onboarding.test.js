import { describe, it, expect } from 'vitest'
import bank from '../data/test-questions-bank.json'
import { drawTestQuestions, ONBOARDING_BANK } from './onboarding'

const { blueprint_tirage: blueprint } = bank.meta

function countBy(questions, key) {
  const counts = {}
  for (const q of questions) counts[q[key]] = (counts[q[key]] || 0) + 1
  return counts
}

// PRNG déterministe (mulberry32) pour des tests reproductibles.
function seeded(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('drawTestQuestions — respect du blueprint', () => {
  it('tire 20 questions, le bon nombre par thème, sans doublon, sur 50 tirages', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const draw = drawTestQuestions({ rng: seeded(seed) })
      expect(draw).toHaveLength(blueprint.total_par_test)
      expect(countBy(draw, 'theme')).toEqual(blueprint.par_theme)
      expect(new Set(draw.map((q) => q.id)).size).toBe(draw.length)
    }
  })

  it('respecte approximativement le dosage de difficulté (écart total ≤ 2)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const counts = countBy(drawTestQuestions({ rng: seeded(seed) }), 'difficulte')
      const distance = Object.entries(blueprint.dosage_difficulte).reduce(
        (sum, [d, n]) => sum + Math.abs((counts[d] || 0) - n),
        0,
      )
      expect(distance).toBeLessThanOrEqual(2)
    }
  })

  it('les questions tirées viennent de la banque, avec les champs attendus', () => {
    const draw = drawTestQuestions({ rng: seeded(7) })
    for (const q of draw) {
      expect(ONBOARDING_BANK).toContain(q)
      expect(q.options.length).toBeGreaterThan(1)
      expect(q.reponse).toBeLessThan(q.options.length)
    }
  })
})

describe('drawTestQuestions — anti-répétition', () => {
  it('évite les ids du test précédent tant que le stock le permet', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const first = drawTestQuestions({ rng: seeded(seed) })
      const second = drawTestQuestions({ previousIds: first.map((q) => q.id), rng: seeded(seed + 1000) })
      const firstIds = new Set(first.map((q) => q.id))
      expect(second.filter((q) => firstIds.has(q.id))).toHaveLength(0)
      expect(countBy(second, 'theme')).toEqual(blueprint.par_theme)
    }
  })

  it('réutilise des ids déjà vus quand le stock frais d\'un thème est insuffisant, sans doublon', () => {
    const previousIds = bank.questions.filter((q) => q.theme === 'E').map((q) => q.id) // tout le thème E "déjà vu"
    const draw = drawTestQuestions({ previousIds, rng: seeded(3) })
    expect(countBy(draw, 'theme')).toEqual(blueprint.par_theme)
    expect(new Set(draw.map((q) => q.id)).size).toBe(draw.length)
  })
})
