import { Icon } from '../components/Icons'
import JargonText from '../components/JargonText'

export default function OnboardingFeedback({ question, correct, isLast, onNext }) {
  return (
    <div className="screen">
      <div className={`fb${correct ? ' correct' : ''}`}>
        <h4>
          <Icon name={correct ? 'check' : 'cross'} style={{ width: 16, height: 16 }} />
          {correct ? 'Bien joué !' : 'Pas tout à fait…'}
        </h4>
        <div style={{ fontSize: 13, fontWeight: 800 }}>
          Bonne réponse : <span className="good">{question.options[question.reponse]}</span>
        </div>
        <p>
          <JargonText text={question.explication} />
        </p>
      </div>

      <button type="button" className="btn b" style={{ marginTop: 'auto', marginBottom: 14 }} onClick={onNext}>
        {isLast ? 'VOIR MES RÉSULTATS' : 'SUIVANT'}
      </button>
    </div>
  )
}
