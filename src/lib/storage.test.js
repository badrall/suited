import { describe, it, expect } from 'vitest'
import { scheduleSrsUpdate, SRS_INTERVALS, getTrainingRank, TRAINING_RANKS } from './storage'

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

describe('getTrainingRank (rang d\'assiduité basé sur l\'XP)', () => {
  it('démarre à "Petit nouveau" à 0 XP', () => {
    const rank = getTrainingRank(0)
    expect(rank.label).toBe('Petit nouveau')
    expect(rank.index).toBe(0)
  })

  it('reste au palier courant juste avant le seuil suivant', () => {
    expect(getTrainingRank(199).label).toBe('Petit nouveau')
    expect(getTrainingRank(999).label).toBe('Passionné')
  })

  it('passe au palier suivant exactement au seuil', () => {
    expect(getTrainingRank(200).label).toBe('Habitué')
    expect(getTrainingRank(1000).label).toBe('Accro')
    expect(getTrainingRank(8000).label).toBe('Légende')
  })

  it('donne le palier suivant et l\'XP restant pour l\'atteindre', () => {
    const rank = getTrainingRank(150)
    expect(rank.next).toEqual({ label: 'Habitué', threshold: 200, xpRemaining: 50 })
  })

  it('n\'a pas de palier suivant une fois "Légende" atteint', () => {
    const rank = getTrainingRank(8000)
    expect(rank.next).toBeNull()
    expect(rank.progress).toBe(1)
    const rankBeyond = getTrainingRank(50000)
    expect(rankBeyond.label).toBe('Légende')
    expect(rankBeyond.next).toBeNull()
  })

  it('calcule une progression entre 0 et 1 vers le palier suivant', () => {
    const rank = getTrainingRank(300) // Habitué (200) -> Passionné (500)
    expect(rank.progress).toBeCloseTo((300 - 200) / (500 - 200), 5)
  })

  it('ne redescend jamais : le rang est une fonction croissante de l\'XP', () => {
    let lastIndex = -1
    for (let xp = 0; xp <= 9000; xp += 50) {
      const index = getTrainingRank(xp).index
      expect(index).toBeGreaterThanOrEqual(lastIndex)
      lastIndex = index
    }
    expect(lastIndex).toBe(TRAINING_RANKS.length - 1)
  })
})
