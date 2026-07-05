// Persistance locale (localStorage) : XP, streak, historique de réponses, maîtrise.
// Pas de backend, pas de compte : tout vit dans le navigateur.

import { POSITION_GROUPS } from './hands'

const STORAGE_KEY = 'suited_state_v1'
const MASTERY_WINDOW = 50
const MAX_HISTORY = 1000

const XP_CORRECT = 10
const XP_WRONG = 3
export const XP_PERFECT_BONUS = 20

// Date locale "YYYY-MM-DD" (toISOString() donnerait la date UTC, décalée d'un jour selon le fuseau).
function todayStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function defaultState() {
  return {
    xp: 0,
    streak: { count: 0, lastPlayedDate: null, playedDates: [] },
    history: [],
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return { ...defaultState(), ...parsed }
  } catch {
    return defaultState()
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function xpForAnswer(correct) {
  return correct ? XP_CORRECT : XP_WRONG
}

export function addXp(amount) {
  const state = loadState()
  state.xp += amount
  saveState(state)
  return state.xp
}

/** Enregistre une réponse de drill dans l'historique (utilisé pour la maîtrise). */
export function recordAnswer({ group, seat, notation, correctAction, userAction, correct }) {
  const state = loadState()
  state.history.push({
    ts: Date.now(),
    group,
    seat,
    notation,
    correctAction,
    userAction,
    correct,
  })
  if (state.history.length > MAX_HISTORY) {
    state.history = state.history.slice(-MAX_HISTORY)
  }
  saveState(state)
}

/** Marque le jour courant comme joué et met à jour la streak (à appeler une fois par session). */
export function markPlayedToday() {
  const state = loadState()
  const today = todayStr()
  const { streak } = state
  if (streak.lastPlayedDate !== today) {
    const yesterday = todayStr(new Date(Date.now() - 86400000))
    streak.count = streak.lastPlayedDate === yesterday ? streak.count + 1 : 1
    streak.lastPlayedDate = today
  }
  if (!streak.playedDates.includes(today)) streak.playedDates.push(today)
  saveState(state)
  return streak
}

function accuracy(entries) {
  if (!entries.length) return null
  const correct = entries.filter((e) => e.correct).length
  return Math.round((correct / entries.length) * 100)
}

export function getMasteryByPosition(history, group) {
  const entries = history.filter((e) => e.group === group).slice(-MASTERY_WINDOW)
  return accuracy(entries)
}

export function getAllMastery(history) {
  const result = {}
  for (const group of POSITION_GROUPS) result[group] = getMasteryByPosition(history, group)
  return result
}

export function getOverallMastery(history) {
  return accuracy(history.slice(-MASTERY_WINDOW))
}

const IQ_LEVELS = [
  { min: 0, label: 'Débutant' },
  { min: 50, label: 'ABC Player' },
  { min: 65, label: 'Solide' },
  { min: 80, label: 'Sharp' },
  { min: 92, label: 'Crusher' },
]

/** Traduit une précision (%) en "Poker IQ" affiché sur l'accueil / progrès. */
export function getPokerIQ(history) {
  const score = getOverallMastery(history) ?? 0
  let levelIndex = 0
  for (let i = 0; i < IQ_LEVELS.length; i++) {
    if (score >= IQ_LEVELS[i].min) levelIndex = i
  }
  const level = IQ_LEVELS[levelIndex]
  const next = IQ_LEVELS[levelIndex + 1]
  return { score, level: level.label, next: next ? { threshold: next.min, label: next.label } : null }
}

export function getTopMissedHands(history, n = 5) {
  const counts = new Map()
  for (const entry of history) {
    if (entry.correct) continue
    counts.set(entry.notation, (counts.get(entry.notation) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([notation, count]) => ({ notation, count }))
}

/** Grille du mois courant pour le calendrier de streak (Progrès). */
export function getMonthCalendar(playedDates, date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const played = new Set(playedDates)
  const days = []
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    days.push({ day, played: played.has(todayStr(d)) })
  }
  return { days, monthLabel: date.toLocaleDateString('fr-FR', { month: 'long' }) }
}
