// Socle premium (sans paiement réel pour l'instant) : un flag local, un cap de sessions gratuites,
// et la liste des spots verrouillés. Aucun compte, aucun backend : tout vit dans localStorage.
// Quand RevenueCat sera branché, SEULE isPremium() changera (elle lira l'entitlement au lieu du flag).

import { getSessionsToday } from './storage'

export const FREE_SESSIONS_PER_DAY = 1

// Spots accessibles gratuitement ; tous les autres (donc vs_3bet) sont premium.
export const FREE_SPOTS = ['open', 'bb_defense']

const PREMIUM_KEY = 'suited_premium'

export function isSpotPremium(spot) {
  return !FREE_SPOTS.includes(spot)
}

// TODO RevenueCat : remplacer la lecture du flag local par l'entitlement actif.
export function isPremium() {
  try {
    return localStorage.getItem(PREMIUM_KEY) === '1'
  } catch {
    return false
  }
}

/** Simule (ou retire) l'abonnement : sert au toggle DEV et, plus tard, de point de synchro avec RevenueCat. */
export function setPremium(value) {
  try {
    if (value) localStorage.setItem(PREMIUM_KEY, '1')
    else localStorage.removeItem(PREMIUM_KEY)
  } catch {
    // stockage indisponible (navigation privée...) : on reste en gratuit
  }
}

/**
 * Override de test par URL (réservé à nous, aucun lien dans l'UI) : ?premium=on / ?premium=off
 * règle le flag, puis le paramètre est retiré de l'URL. À appeler une fois au démarrage (main.jsx).
 */
export function applyPremiumUrlOverride() {
  try {
    const url = new URL(window.location.href)
    const value = url.searchParams.get('premium')
    if (value !== 'on' && value !== 'off') return
    setPremium(value === 'on')
    url.searchParams.delete('premium')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  } catch {
    // URL ou history indisponible : on ignore, l'app démarre normalement
  }
}

/** Le cap se base sur les sessions TERMINÉES aujourd'hui (state.sessionLog). */
export function canStartSession(state) {
  return isPremium() || getSessionsToday(state.sessionLog) < FREE_SESSIONS_PER_DAY
}

/** Sessions gratuites restantes aujourd'hui, ou null si premium (illimité). */
export function freeSessionsLeft(state) {
  if (isPremium()) return null
  return Math.max(0, FREE_SESSIONS_PER_DAY - getSessionsToday(state.sessionLog))
}

// Données d'affichage uniquement pour le paywall : aucune logique d'achat ici.
export const PREMIUM_OFFERS = [
  { id: 'monthly', label: 'Mensuel', price: '6,99 €', period: 'par mois' },
  { id: 'yearly', label: 'Annuel', price: '49,99 €', period: 'par an', note: '-40 %' },
  { id: 'lifetime', label: 'À vie', price: '89,99 €', period: 'paiement unique' },
]
