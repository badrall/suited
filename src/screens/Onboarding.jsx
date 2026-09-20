import { useEffect, useState } from 'react'
import OnboardingIntro from './OnboardingIntro'
import OnboardingQuestion from './OnboardingQuestion'
import OnboardingFeedback from './OnboardingFeedback'
import OnboardingResult from './OnboardingResult'
import { drawTestQuestions, computeThemeScores, scoreToStartingPokerIQ } from '../lib/onboarding'
import { skipOnboarding, recordOnboardingResult, getLastTestQuestionIds, setLastTestQuestionIds } from '../lib/storage'

/**
 * Test de positionnement : 20 QCM, un par un, feedback immédiat, puis restitution.
 * Plein écran, hors ruban (même principe que Session) — onFinish(startSessionAfter) referme l'écran,
 * et démarre en plus une session si l'appelant le demande (CTA final "Commence ton entraînement").
 */
export default function Onboarding({ onFinish }) {
  const [phase, setPhase] = useState('intro') // 'intro' | 'question' | 'feedback' | 'result'
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [lastCorrect, setLastCorrect] = useState(false)
  const [result, setResult] = useState(null)

  // Tirage fait une fois au montage (aucun effet de bord ici : les ids ne sont mémorisés qu'au démarrage réel du test).
  const [questions] = useState(() => drawTestQuestions({ previousIds: getLastTestQuestionIds() }))
  const total = questions.length

  function handleStart() {
    setLastTestQuestionIds(questions.map((q) => q.id))
    setPhase('question')
  }

  // Ne se déclenche qu'une fois, au passage réel en phase "result" (pas au montage) : pas de risque
  // de double-écriture sous React StrictMode, qui ne double-invoque que les effets de montage.
  useEffect(() => {
    if (phase !== 'result') return
    const themeScores = computeThemeScores(questions, answers)
    const totalScore = answers.filter((a) => a?.correct).length
    const startingPokerIQ = scoreToStartingPokerIQ(totalScore)
    recordOnboardingResult({ themeScores, totalScore, startingPokerIQ })
    setResult({ themeScores, totalScore, startingPokerIQ })
    // "answers" est bien lu ici, mais le guard ci-dessus rend l'effet sans effet tant que phase !== 'result' :
    // il se déclenche donc réellement une seule fois, exactement au passage en phase "result".
  }, [phase, answers, questions])

  function handleSkip() {
    skipOnboarding()
    onFinish(false)
  }

  function handleAnswer(optionIndex) {
    const question = questions[index]
    const correct = optionIndex === question.reponse
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = { correct }
      return next
    })
    setLastCorrect(correct)
    setPhase('feedback')
  }

  function handleNext() {
    if (index + 1 < total) {
      setIndex((i) => i + 1)
      setPhase('question')
      return
    }
    setPhase('result')
  }

  if (phase === 'intro') {
    return <OnboardingIntro onStart={handleStart} onSkip={handleSkip} />
  }

  if (phase === 'result') {
    if (!result) return null // le temps que l'effet ci-dessus calcule et sauvegarde le résultat
    return (
      <OnboardingResult
        totalScore={result.totalScore}
        themeScores={result.themeScores}
        startingPokerIQ={result.startingPokerIQ}
        onFinish={onFinish}
      />
    )
  }

  const question = questions[index]

  if (phase === 'feedback') {
    return <OnboardingFeedback question={question} correct={lastCorrect} isLast={index + 1 === total} onNext={handleNext} />
  }

  return <OnboardingQuestion question={question} index={index} total={total} onAnswer={handleAnswer} />
}
