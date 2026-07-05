import { describe, it, expect } from 'vitest'
import { scheduleSrsUpdate, SRS_INTERVALS } from './storage'

describe('scheduleSrsUpdate (répétition espacée)', () => {
  it('ne suit pas une main jamais ratée quand la réponse est correcte', () => {
    expect(scheduleSrsUpdate(null, true, 10)).toBeNull()
  })

  it('planifie le premier palier (3 mains) après un échec', () => {
    const result = scheduleSrsUpdate(null, false, 10)
    expect(result).toEqual({ intervalIndex: 0, streak: 0, dueAt: 10 + SRS_INTERVALS[0] })
  })

  it('avance au deuxième palier (10 mains) après une réussite en remédiation', () => {
    const afterMiss = scheduleSrsUpdate(null, false, 10) // dueAt = 13
    const afterFirstSuccess = scheduleSrsUpdate(afterMiss, true, 13)
    expect(afterFirstSuccess).toEqual({ intervalIndex: 1, streak: 1, dueAt: 13 + SRS_INTERVALS[1] })
  })

  it('avance au troisième palier (30 mains) après une deuxième réussite', () => {
    const afterMiss = scheduleSrsUpdate(null, false, 0)
    const afterFirst = scheduleSrsUpdate(afterMiss, true, 3)
    const afterSecond = scheduleSrsUpdate(afterFirst, true, 13)
    expect(afterSecond).toEqual({ intervalIndex: 2, streak: 2, dueAt: 13 + SRS_INTERVALS[2] })
  })

  it('marque la main comme maîtrisée après 3 réussites consécutives (retour au rythme normal)', () => {
    const afterMiss = scheduleSrsUpdate(null, false, 0)
    const afterFirst = scheduleSrsUpdate(afterMiss, true, 3)
    const afterSecond = scheduleSrsUpdate(afterFirst, true, 13)
    const afterThird = scheduleSrsUpdate(afterSecond, true, 43)
    expect(afterThird).toBeNull()
  })

  it('relance au premier palier si la main est ratée à nouveau pendant la remédiation', () => {
    const afterMiss = scheduleSrsUpdate(null, false, 0) // dueAt = 3
    const afterSuccess = scheduleSrsUpdate(afterMiss, true, 3) // intervalIndex 1, dueAt 13
    const afterSecondMiss = scheduleSrsUpdate(afterSuccess, false, 20)
    expect(afterSecondMiss).toEqual({ intervalIndex: 0, streak: 0, dueAt: 20 + SRS_INTERVALS[0] })
  })
})
