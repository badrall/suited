// Logique du test de positionnement (onboarding) : scoring, thèmes, mapping vers un Poker IQ de départ.
// Ce score est une ESTIMATION PROVISOIRE — l'estimateur de niveau réel (basé sur le jeu, ~300 réponses)
// est une feature séparée. Ne jamais présenter ce résultat comme un verdict définitif.

import testData from '../data/test-positionnement.json'

export const ONBOARDING_QUESTIONS = testData.questions
export const ONBOARDING_THEMES = testData.meta.themes // { A: 'Ranges préflop', ... }
export const ONBOARDING_FORMAT = testData.meta.format

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
  for (const [rangeKey, iq] of Object.entries(testData.meta.mapping_poker_iq)) {
    const { lo, hi } = parseRange(rangeKey)
    if (totalScore >= lo && totalScore <= hi) return iq
  }
  return 30
}

/** answers : tableau aligné sur ONBOARDING_QUESTIONS, { correct: boolean } pour chaque question répondue. */
export function computeThemeScores(answers) {
  const scores = {}
  for (const id of Object.keys(ONBOARDING_THEMES)) scores[id] = { correct: 0, total: 0 }
  ONBOARDING_QUESTIONS.forEach((question, i) => {
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
