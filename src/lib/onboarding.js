// Logique du test de positionnement (onboarding) : scoring, thèmes, mapping vers un Poker IQ de départ.
// Ce score est une ESTIMATION PROVISOIRE — l'estimateur de niveau réel (basé sur le jeu, ~300 réponses)
// est une feature séparée. Ne jamais présenter ce résultat comme un verdict définitif.

import bank from '../data/test-questions-bank.json'

// Source du test : la banque de questions (test-questions-bank.json). Chaque passage tire 20 questions
// selon meta.blueprint_tirage (formes parallèles) : questions différentes, instances comparables.
export const ONBOARDING_BANK = bank.questions
export const ONBOARDING_THEMES = bank.meta.themes // { A: 'Ranges préflop', ... }
const BLUEPRINT = bank.meta.blueprint_tirage
const MAX_DRAW_ATTEMPTS = 300

function shuffle(items, rng) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function difficultyDistance(questions, target) {
  const counts = {}
  for (const q of questions) counts[q.difficulte] = (counts[q.difficulte] || 0) + 1
  return Object.keys(target).reduce((sum, d) => sum + Math.abs((counts[d] || 0) - target[d]), 0)
}

/**
 * Tire les questions d'un test selon le blueprint : nb exact par thème, tirage aléatoire dans chaque thème,
 * dosage de difficulté le plus proche possible de la cible (meilleur de plusieurs tirages), aucun doublon.
 * previousIds : ids servis au test précédent — évités en priorité (réutilisés seulement si le stock d'un thème
 * ne suffit pas). Ordre final mélangé.
 */
export function drawTestQuestions({ questions = ONBOARDING_BANK, blueprint = BLUEPRINT, previousIds = [], rng = Math.random } = {}) {
  const seen = new Set(previousIds)
  let best = null
  let bestDistance = Infinity
  for (let attempt = 0; attempt < MAX_DRAW_ATTEMPTS && bestDistance > 0; attempt++) {
    const draw = []
    for (const [theme, count] of Object.entries(blueprint.par_theme)) {
      const pool = questions.filter((q) => q.theme === theme)
      const ordered = [...shuffle(pool.filter((q) => !seen.has(q.id)), rng), ...shuffle(pool.filter((q) => seen.has(q.id)), rng)]
      draw.push(...ordered.slice(0, count))
    }
    const distance = difficultyDistance(draw, blueprint.dosage_difficulte)
    if (distance < bestDistance) {
      best = draw
      bestDistance = distance
    }
  }
  return shuffle(best, rng)
}

export const THEME_ORIENTATION = {
  A: "Travaille les ranges d'ouverture et de défense position par position : c'est la base de tout le reste.",
  B: 'Muscle ta lecture de la position — elle dicte à elle seule combien de mains tu peux jouer.',
  C: 'Reprends les bases de calcul (équités, cotes, outs) : elles évitent les erreurs les plus coûteuses.',
  D: "Le Jargon (onglet dédié) t'aidera à assimiler le vocabulaire au fil des drills.",
  E: "Les tables live ont leurs propres codes (sizings, joueurs passifs) : les spots dédiés t'y prépareront.",
}

function parseRange(key) {
  const [lo, hi] = key.split('-').map(Number)
  return { lo, hi }
}

/** Traduit le score /20 en Poker IQ de départ, via meta.mapping_poker_iq (ex: "12-14" -> 55). */
export function scoreToStartingPokerIQ(totalScore) {
  for (const [rangeKey, iq] of Object.entries(bank.meta.mapping_poker_iq)) {
    const { lo, hi } = parseRange(rangeKey)
    if (totalScore >= lo && totalScore <= hi) return iq
  }
  return 30
}

/** questions : les questions du test en cours ; answers : tableau aligné dessus, { correct: boolean } par réponse. */
export function computeThemeScores(questions, answers) {
  const scores = {}
  for (const id of Object.keys(ONBOARDING_THEMES)) scores[id] = { correct: 0, total: 0 }
  questions.forEach((question, i) => {
    const answer = answers[i]
    if (!answer) return
    scores[question.theme].total += 1
    if (answer.correct) scores[question.theme].correct += 1
  })
  return scores
}

export function themeScorePercent(themeScore) {
  return themeScore.total ? Math.round((themeScore.correct / themeScore.total) * 100) : 0
}

/** Les n thèmes les plus faibles (par %), pour les "chantiers prioritaires". */
export function getWeakestThemes(themeScores, n = 3) {
  return Object.entries(themeScores)
    .map(([id, score]) => ({ id, label: ONBOARDING_THEMES[id], pct: themeScorePercent(score), ...score }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, n)
}
