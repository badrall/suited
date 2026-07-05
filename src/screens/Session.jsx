import { useState, useEffect, useMemo } from 'react'
import Drill from './Drill'
import Feedback from './Feedback'
import SessionEnd from './SessionEnd'
import rangesData from '../data/ranges-open-raise-9max-live.json'
import explicationsData from '../data/explications-mains-frontieres.json'
import equitesData from '../data/equites-preflop.json'
import { generateSessionHands } from '../lib/hands'
import { addXp, recordAnswer, markPlayedToday, xpForAnswer, XP_PERFECT_BONUS } from '../lib/storage'

const SESSION_SIZE = 10

/** Orchestre une session complète : 10 mains, feedback après chacune, récap final. */
export default function Session({ onFinish }) {
  const questions = useMemo(() => generateSessionHands(rangesData, equitesData, SESSION_SIZE), [])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('question') // 'question' | 'feedback' | 'end'
  const [answers, setAnswers] = useState([])
  const [lastAnswer, setLastAnswer] = useState(null)
  const [bonusXp, setBonusXp] = useState(0)

  useEffect(() => {
    markPlayedToday()
  }, [])

  const question = questions[index]

  function handleAnswer(userAction) {
    const correct = userAction === question.correctAction
    const xpGain = xpForAnswer(correct)
    addXp(xpGain)
    recordAnswer({
      group: question.group,
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
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1)
      setPhase('question')
      return
    }
    const perfect = answers.length === questions.length && answers.every((a) => a.correct)
    if (perfect) {
      addXp(XP_PERFECT_BONUS)
      setBonusXp(XP_PERFECT_BONUS)
    }
    setPhase('end')
  }

  if (phase === 'end') {
    return (
      <SessionEnd
        answers={answers}
        bonusXp={bonusXp}
        explicationsData={explicationsData}
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
        total={questions.length}
        onNext={handleNext}
        explicationsData={explicationsData}
        equitesData={equitesData}
      />
    )
  }

  return (
    <Drill question={question} index={index} total={questions.length} onAnswer={handleAnswer} onQuit={onFinish} />
  )
}
