import { Icon } from '../components/Icons'
import PlayingCard from '../components/PlayingCard'
import ProgressBar from '../components/ProgressBar'
import { getExplanation, getEquity, getTwin } from '../lib/hands'

const ACTION_LABELS = { fold: 'FOLD', call: 'CALL', raise: 'RAISE' }

export default function Feedback({ question, lastAnswer, index, total, onNext, explicationsData, equitesData }) {
  const { group, notation, cards, correctAction } = question
  const { userAction, correct } = lastAnswer

  const explanation = getExplanation(group, notation, explicationsData, correctAction)
  const equity = getEquity(notation, equitesData)
  const twin = getTwin(notation, equitesData)
  const nugget = equitesData.pepites_pedagogiques.find((p) => p.includes(notation))

  return (
    <div className="screen">
      <div className="progress">
        <span style={{ color: 'var(--gray)', fontWeight: 900 }}>✕</span>
        <ProgressBar percent={((index + 1) / total) * 100} />
        <b style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 900 }}>
          {index + 1}/{total}
        </b>
      </div>

      <div className="hole" style={{ marginTop: 2 }}>
        {cards.map((c, i) => (
          <PlayingCard key={i} rank={c.rank} suit={c.suit} size="sm" />
        ))}
      </div>

      <div className={`fb${correct ? ' correct' : ''}`}>
        <h4>
          <Icon name={correct ? 'check' : 'cross'} style={{ width: 16, height: 16 }} />
          {correct ? 'Bien joué !' : 'Pas tout à fait…'}
        </h4>
        <div style={{ fontSize: 13, fontWeight: 800 }}>
          La bonne action : <span className="good">{ACTION_LABELS[correctAction]} ✓</span>{' '}
          {!correct && (
            <span style={{ color: 'var(--gray)' }}>(tu as répondu {ACTION_LABELS[userAction]})</span>
          )}
        </div>
        {userAction === 'call' && (
          <p className="limp-note">
            Limper = le pire des deux mondes : tu investis sans initiative et tu annonces une main
            faible.
          </p>
        )}
        <p>{explanation.text}</p>
      </div>

      <div className="stat">
        <b>
          <Icon name="chart" style={{ width: 14, height: 14 }} /> LA STAT
        </b>
        <div className="equity">
          <span>{notation} vs main aléatoire</span>
          <ProgressBar percent={equity} color="var(--blue)" />
          <b>{equity}%</b>
        </div>
        {twin && (
          <div className="equity">
            <span>
              {twin.notation} ({notation.endsWith('s') ? 'non suité' : 'suité'})
            </span>
            <ProgressBar percent={twin.equity} color="#b8c4ce" />
            <b>{twin.equity}%</b>
          </div>
        )}
        {nugget && <div className="nugget">{nugget}</div>}
      </div>

      {correctAction === 'raise' && (
        <div className="stat sizing">
          <b>
            <Icon name="bulb" style={{ width: 14, height: 14 }} /> SIZING
          </b>
          <p>En live, ouvre à 4bb (20 € à 2/5) — les petits sizings ne font folder personne.</p>
        </div>
      )}

      <button type="button" className="btn b" style={{ marginTop: 'auto', marginBottom: 14 }} onClick={onNext}>
        {index + 1 < total ? 'COMPRIS, SUIVANT' : 'VOIR LE RÉCAP'}
      </button>
    </div>
  )
}
