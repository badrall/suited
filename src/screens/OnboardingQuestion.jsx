import ProgressBar from '../components/ProgressBar'
import { ONBOARDING_THEMES } from '../lib/onboarding'

export default function OnboardingQuestion({ question, index, total, onAnswer }) {
  const percent = (index / total) * 100

  return (
    <div className="screen">
      <div className="progress">
        <span style={{ width: 20 }} />
        <ProgressBar percent={percent} />
        <b style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 900 }}>
          {index + 1}/{total}
        </b>
      </div>

      <div className="quiz-theme">{ONBOARDING_THEMES[question.theme]}</div>
      <h3 className="quiz-question">{question.q}</h3>

      <div className="quiz-options">
        {question.options.map((option, i) => (
          <button key={i} type="button" className="quiz-option" onClick={() => onAnswer(i)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
