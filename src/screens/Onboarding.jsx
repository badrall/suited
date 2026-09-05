import { useEffect, useState } from 'react'
import OnboardingIntro from './OnboardingIntro'
import OnboardingQuestion from './OnboardingQuestion'
import OnboardingFeedback from './OnboardingFeedback'
import OnboardingResult from './OnboardingResult'
import { ONBOARDING_QUESTIONS, computeThemeScores, scoreToStartingPokerIQ } from '../lib/onboarding'
import { skipOnboarding, recordOnboardingResult } from '../lib/storage'

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

  const total = ONBOARDING_QUESTIONS.length

  // Ne se déclenche qu'une fois, au passage réel en phase "result" (pas au montage) : pas de risque
  // de double-écriture sous React StrictMode, qui ne double-invoque que les effets de montage.
  useEffect(() => {
    if (phase !== 'result') return
    const themeScores = computeThemeScores(answers)
    const totalScore = answers.filter((a) => a?.correct).length
    const startingPokerIQ = scoreToStartingPokerIQ(totalScore)
    recordOnboardingResult({ themeScores, totalScore, startingPokerIQ })
    setResult({ themeScores, totalScore, startingPokerIQ })
    // "answers" est bien lu ici, mais le guard ci-dessus rend l'effet sans effet tant que phase !== 'result' :
    // il se déclenche donc réellement une seule fois, exactement au passage en phase "result".
  }, [phase, answers])

  function handleSkip() {
    skipOnboarding()
    onFinish(false)
  }

  function handleAnswer(optionIndex) {
    const question = ONBOARDING_QUESTIONS[index]
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
    return <OnboardingIntro onStart={() => setPhase('question')} onSkip={handleSkip} />
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

  const question = ONBOARDING_QUESTIONS[index]

  if (phase === 'feedback') {
    return <OnboardingFeedback question={question} correct={lastCorrect} isLast={index + 1 === total} onNext={handleNext} />
  }

  return <OnboardingQuestion question={question} index={index} total={total} onAnswer={handleAnswer} />
}
