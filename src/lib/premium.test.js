import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { canStartSession, freeSessionsLeft, isSpotPremium, isPremium, setPremium } from './premium'
import { getSessionsToday } from './storage'

// localStorage minimal en mémoire (même approche que storage.test.js).
let store
beforeEach(() => {
  store = {}
  globalThis.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => {
      store[k] = String(v)
    },
    removeItem: (k) => {
      delete store[k]
    },
  }
})
afterEach(() => {
  delete globalThis.localStorage
})

const now = Date.now()
const YESTERDAY = now - 2 * 86400000 // 48 h : jamais « aujourd'hui », quel que soit le fuseau

describe('isSpotPremium', () => {
  it('open et bb_defense sont gratuits', () => {
    expect(isSpotPremium('open')).toBe(false)
    expect(isSpotPremium('bb_defense')).toBe(false)
  })

  it('vs_3bet est premium', () => {
    expect(isSpotPremium('vs_3bet')).toBe(true)
  })
})

describe('getSessionsToday', () => {
  it('ne compte que les sessions terminées aujourd\'hui', () => {
    expect(getSessionsToday([YESTERDAY, now, now])).toBe(2)
  })
})

describe('canStartSession (cap de sessions gratuites)', () => {
  it('gratuit, 0 session aujourd\'hui : autorisé', () => {
    expect(canStartSession({ sessionLog: [] })).toBe(true)
    expect(canStartSession({ sessionLog: [YESTERDAY] })).toBe(true)
  })

  it('gratuit, 1 session aujourd\'hui : bloqué', () => {
    expect(canStartSession({ sessionLog: [now] })).toBe(false)
  })

  it('premium : toujours autorisé', () => {
    setPremium(true)
    expect(canStartSession({ sessionLog: [now, now, now] })).toBe(true)
  })
})

describe('flag premium et sessions restantes', () => {
  it('setPremium écrit puis supprime la clé', () => {
    expect(isPremium()).toBe(false)
    setPremium(true)
    expect(store.suited_premium).toBe('1')
    expect(isPremium()).toBe(true)
    setPremium(false)
    expect(store.suited_premium).toBeUndefined()
    expect(isPremium()).toBe(false)
  })

  it('freeSessionsLeft : 1 à 0 session, 0 à 1 session, null en premium', () => {
    expect(freeSessionsLeft({ sessionLog: [] })).toBe(1)
    expect(freeSessionsLeft({ sessionLog: [now] })).toBe(0)
    setPremium(true)
    expect(freeSessionsLeft({ sessionLog: [now] })).toBeNull()
  })
})
