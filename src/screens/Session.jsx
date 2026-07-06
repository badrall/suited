import { useState } from 'react'
import Drill from './Drill'
import Feedback from './Feedback'
import SessionEnd from './SessionEnd'
import rangesOpenData from '../data/ranges-open-raise-9max-live.json'
import rangesDefenseData from '../data/ranges-defense-bb-et-vs-3bet.json'
import explicationsOpenData from '../data/explications-mains-frontieres.json'
import explicationsSpotsData from '../data/explications-spots-2-3.json'
import equitesData from '../data/equites-preflop.json'
import { generateNextQuestion } from '../lib/hands'
import {
  loadState,
  addXp,
  recordAnswer,
  markPlayedToday,
  recordSessionCompleted,
  getSessionMasterySnapshot,
  getTodayAccuracy,
  xpForAnswer,
  XP_PERFECT_BONUS,
} from '../lib/storage'

const SESSION_SIZE = 10

// Relit l'état frais (srs + totalAnswered) à chaque tirage, pour que la répétition espacée
// tienne compte des réponses qui viennent d'être enregistrées (y compris d'une session précédente).
function buildQuestion(config) {
  const state = loadState()
  return generateNextQuestion(config, state.srs, state.totalAnswered, rangesOpenData, rangesDefenseData)
}

/**
 * Orchestre une session complète : 10 mains, feedback après chacune, récap final.
 * config filtre les mains tirées (voir hands.eligibleContexts) : { spot, group } ou {} pour le mix.
 */
export default function Session({ config, onFinish }) {
  const [questions, setQuestions] = useState(() => [buildQuestion(config)])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('question') // 'question' | 'feedback' | 'end'
  const [answers, setAnswers] = useState([])
  const [lastAnswer, setLastAnswer] = useState(null)
  const [bonusXp, setBonusXp] = useState(0)
  // Capturée une seule fois, avant toute réponse : sert de "avant" pour la progression de fin de session.
  const [startMastery] = useState(() => getSessionMasterySnapshot(loadState().history, config))

  const question = questions[index]

  function handleAnswer(userAction) {
    const correct = userAction === question.correctAction
    const xpGain = xpForAnswer(correct)
    addXp(xpGain)
    recordAnswer({
      spot: question.spot,
      group: question.group,
      contextKey: question.contextKey,
      seat: question.seat,
      notation: question.notation,
      correctAction: question.correctAction,
      userAction,
      correct,
    })
    const result = { ...question, userAction, correct, xpGain }
    setAnswers((prev) => [...prev, result])
    setLastAnswer(result)
    setPhase('feedback')
  }

  function handleNext() {
    if (index + 1 < SESSION_SIZE) {
      setQuestions((prev) => (prev[index + 1] ? prev : [...prev, buildQuestion(config)]))
      setIndex((i) => i + 1)
      setPhase('question')
      return
    }
    const perfect = answers.length === SESSION_SIZE && answers.every((a) => a.correct)
    if (perfect) {
      addXp(XP_PERFECT_BONUS)
      setBonusXp(XP_PERFECT_BONUS)
    }
    // "Objectif du jour" = une session complétée (pas juste commencée) : la streak et le compteur
    // hebdomadaire ne bougent que si la session va jusqu'au bout.
    markPlayedToday()
    recordSessionCompleted()
    setPhase('end')
  }

  if (phase === 'end') {
    const state = loadState()
    return (
      <SessionEnd
        answers={answers}
        bonusXp={bonusXp}
        streakCount={state.streak.count}
        todayAccuracy={getTodayAccuracy(state.history)}
        startMastery={startMastery}
        endMastery={getSessionMasterySnapshot(state.history, config)}
        explicationsOpenData={explicationsOpenData}
        explicationsSpotsData={explicationsSpotsData}
        onFinish={onFinish}
      />
    )
  }

  if (phase === 'feedback') {
    return (
      <Feedback
        question={question}
        lastAnswer={lastAnswer}
        index={index}
        total={SESSION_SIZE}
        onNext={handleNext}
        explicationsOpenData={explicationsOpenData}
        explicationsSpotsData={explicationsSpotsData}
        equitesData={equitesData}
      />
    )
  }

  return <Drill question={question} index={index} total={SESSION_SIZE} onAnswer={handleAnswer} onQuit={onFinish} />
}
