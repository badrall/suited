// Persistance locale (localStorage) : XP, streak, historique de réponses, maîtrise, répétition espacée.
// Pas de backend, pas de compte : tout vit dans le navigateur.

import { ALL_HERO_GROUPS, SPOTS, SPOT_LABELS } from './hands'

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
    srs: {},
    totalAnswered: 0,
    lastSeenRankIndex: 0,
    pseudo: null,
    sessionLog: [],
    onboarding: { status: 'pending', completedAt: null, themeScores: null, totalScore: null, startingPokerIQ: null },
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

// --- Répétition espacée (par main × position × spot) ------------------------------

export const SRS_INTERVALS = [3, 10, 30]

/**
 * Calcule le nouvel état de répétition espacée pour une main, à partir de son état précédent.
 * Fonction pure (aucun accès à localStorage) pour rester facilement testable :
 * - un échec relance toujours au premier palier (revoir dans 3 mains) ;
 * - une réussite fait avancer au palier suivant (3 -> 10 -> 30) ;
 * - 3 réussites consécutives depuis le dernier échec = main "maîtrisée" : on arrête de la suivre
 *   spécialement (retour null = pas d'entrée à conserver, elle rejoint le tirage normal) ;
 * - une main jamais ratée n'est jamais suivie (retourne null si correct et pas d'état existant).
 */
export function scheduleSrsUpdate(existingItem, correct, totalAnswered) {
  if (!correct) {
    return { intervalIndex: 0, streak: 0, dueAt: totalAnswered + SRS_INTERVALS[0] }
  }
  if (!existingItem) return null
  const streak = existingItem.streak + 1
  if (streak >= 3) return null
  const intervalIndex = Math.min(existingItem.intervalIndex + 1, SRS_INTERVALS.length - 1)
  return { intervalIndex, streak, dueAt: totalAnswered + SRS_INTERVALS[intervalIndex] }
}

/** Enregistre une réponse de drill : historique, compteur global, et mise à jour de la répétition espacée. */
export function recordAnswer({ spot, group, contextKey, seat, notation, correctAction, userAction, correct }) {
  const state = loadState()
  state.history.push({
    ts: Date.now(),
    spot,
    group,
    contextKey,
    seat,
    notation,
    correctAction,
    userAction,
    correct,
  })
  if (state.history.length > MAX_HISTORY) {
    state.history = state.history.slice(-MAX_HISTORY)
  }
  state.totalAnswered += 1

  const key = `${spot}|${group}|${contextKey}|${notation}`
  const updated = scheduleSrsUpdate(state.srs[key], correct, state.totalAnswered)
  if (updated) state.srs[key] = updated
  else delete state.srs[key]

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

/** L'objectif du jour est atteint dès qu'une session a été complétée aujourd'hui (alimente la streak). */
export function hasPlayedToday(streak) {
  return streak.lastPlayedDate === todayStr()
}

/** Enregistre la fin d'une session (pour "N sessions cette semaine"), indépendamment de la streak. */
export function recordSessionCompleted() {
  const state = loadState()
  state.sessionLog.push(Date.now())
  saveState(state)
}

// Lundi 00:00 de la semaine courante (heure locale), pour compter les sessions "cette semaine".
function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const mondayOffset = (d.getDay() + 6) % 7 // getDay(): 0=dimanche -> on veut 0=lundi
  d.setDate(d.getDate() - mondayOffset)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getSessionsThisWeek(sessionLog) {
  const start = startOfWeek().getTime()
  return sessionLog.filter((ts) => ts >= start).length
}

export function getPseudo() {
  return loadState().pseudo
}

export function setPseudo(pseudo) {
  const state = loadState()
  state.pseudo = pseudo
  saveState(state)
}

// --- Test de positionnement (onboarding) --------------------------------------------
// Le résultat n'est verrouillé (1×/mois) que s'il a déjà été COMPLÉTÉ pour de vrai — un simple
// "passer" laisse le test entièrement disponible, à tout moment.

const ONBOARDING_RETAKE_DELAY_MS = 30 * 24 * 60 * 60 * 1000

export function canRetakeOnboarding(onboarding) {
  return !onboarding.completedAt || Date.now() - onboarding.completedAt >= ONBOARDING_RETAKE_DELAY_MS
}

export function daysUntilOnboardingRetake(onboarding) {
  if (canRetakeOnboarding(onboarding)) return 0
  return Math.ceil((ONBOARDING_RETAKE_DELAY_MS - (Date.now() - onboarding.completedAt)) / 86400000)
}

/** L'utilisateur passe le test : pas de placement, départ = débutant, mais le test reste proposable. */
export function skipOnboarding() {
  const state = loadState()
  state.onboarding.status = 'skipped'
  saveState(state)
}

export function recordOnboardingResult({ themeScores, totalScore, startingPokerIQ }) {
  const state = loadState()
  state.onboarding = { status: 'done', completedAt: Date.now(), themeScores, totalScore, startingPokerIQ }
  saveState(state)
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

/** Maîtrise par position (EP/MP/CO/BTN/SB + BB dès qu'il y a de la défense de blind jouée). */
export function getAllMastery(history) {
  const result = {}
  for (const group of ALL_HERO_GROUPS) result[group] = getMasteryByPosition(history, group)
  return result
}

/** Maîtrise pour un filtre de position de Séries : "Blinds" regroupe SB (open) et BB (défense). */
export function getMasteryForPositionFilter(history, filterGroup) {
  if (filterGroup === 'Blinds') {
    const entries = history.filter((e) => e.group === 'SB' || e.group === 'BB').slice(-MASTERY_WINDOW)
    return accuracy(entries)
  }
  return getMasteryByPosition(history, filterGroup)
}

export function getMasteryBySpot(history, spot) {
  const entries = history.filter((e) => e.spot === spot).slice(-MASTERY_WINDOW)
  return accuracy(entries)
}

/** Précision toutes réponses confondues, mais seulement celles d'aujourd'hui (pour la fin de session). */
export function getTodayAccuracy(history) {
  const today = todayStr()
  const entries = history.filter((e) => todayStr(new Date(e.ts)) === today)
  return accuracy(entries)
}

/**
 * Capture la maîtrise "concernée" par la config d'une session (celle affichée en fin de session
 * si elle progresse) : la position si la Série filtre par position, le spot sinon, rien pour le mix.
 */
export function getSessionMasterySnapshot(history, config) {
  if (!config) return null
  if (config.group === 'Blinds') return { label: 'Blinds', value: getMasteryForPositionFilter(history, 'Blinds') }
  if (config.group) return { label: config.group, value: getMasteryByPosition(history, config.group) }
  if (config.spot) return { label: SPOT_LABELS[config.spot], value: getMasteryBySpot(history, config.spot) }
  return null
}

export function getAllMasteryBySpot(history) {
  const result = {}
  for (const spot of SPOTS) result[spot] = getMasteryBySpot(history, spot)
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

/**
 * Traduit une précision (%) en "Poker IQ" affiché sur l'accueil / progrès.
 * fallbackScore : utilisé tant qu'il n'y a pas encore de vraies données de jeu — le point de départ
 * provisoire du test de positionnement (ou 0 si le test a été passé/non fait).
 */
export function getPokerIQ(history, fallbackScore = 0) {
  const score = getOverallMastery(history) ?? fallbackScore
  let levelIndex = 0
  for (let i = 0; i < IQ_LEVELS.length; i++) {
    if (score >= IQ_LEVELS[i].min) levelIndex = i
  }
  const level = IQ_LEVELS[levelIndex]
  const next = IQ_LEVELS[levelIndex + 1]
  return { score, level: level.label, next: next ? { threshold: next.min, label: next.label } : null }
}

// --- Rang d'entraînement (assiduité, basé sur l'XP cumulé) -------------------------
// Distinct du Poker IQ ci-dessus (qui mesure le niveau de jeu) : ici on ne mesure que l'engagement.
// L'XP ne fait qu'augmenter dans cette app (aucune fonction ne la diminue), donc ce rang ne peut
// jamais redescendre.

export const TRAINING_RANKS = [
  { min: 0, label: 'Petit nouveau' },
  { min: 200, label: 'Habitué' },
  { min: 500, label: 'Passionné' },
  { min: 1000, label: 'Accro' },
  { min: 2000, label: 'Mordu' },
  { min: 3500, label: 'Acharné' },
  { min: 5500, label: 'Machine' },
  { min: 8000, label: 'Légende' },
]

/** Traduit l'XP cumulé en rang d'entraînement + progression vers le rang suivant (0-1). */
export function getTrainingRank(xp) {
  let index = 0
  for (let i = 0; i < TRAINING_RANKS.length; i++) {
    if (xp >= TRAINING_RANKS[i].min) index = i
  }
  const current = TRAINING_RANKS[index]
  const next = TRAINING_RANKS[index + 1]
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1
  return {
    index,
    label: current.label,
    next: next ? { label: next.label, threshold: next.min, xpRemaining: next.min - xp } : null,
    progress: Math.max(0, Math.min(1, progress)),
  }
}

/**
 * À appeler une fois par montage de l'Accueil : renvoie true la première fois qu'on détecte un
 * nouveau rang (pour déclencher l'animation), puis mémorise qu'on l'a vu.
 */
export function acknowledgeRankUp(xp) {
  const state = loadState()
  const currentIndex = getTrainingRank(xp).index
  const rankedUp = currentIndex > state.lastSeenRankIndex
  if (rankedUp) {
    state.lastSeenRankIndex = currentIndex
    saveState(state)
  }
  return rankedUp
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
