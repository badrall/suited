import { Icon } from '../components/Icons'
import { getExplanation, seatPhrase } from '../lib/hands'

export default function SessionEnd({ answers, bonusXp, explicationsOpenData, explicationsSpotsData, onFinish }) {
  const total = answers.length
  const correctCount = answers.filter((a) => a.correct).length
  const accuracy = Math.round((correctCount / total) * 100)
  const earnedXp = answers.reduce((sum, a) => sum + a.xpGain, 0) + bonusXp
  const mistakes = answers.filter((a) => !a.correct)

  return (
    <div className="screen">
      <div className="topbar">
        <b style={{ fontSize: 17, fontWeight: 900 }}>Session terminée</b>
      </div>

      <div className="hero">
        <div className="suits">♠♣</div>
        <h3>{bonusXp > 0 ? 'Session parfaite !' : 'Bien joué !'}</h3>
        <p>
          {correctCount}/{total} bonnes réponses · {accuracy}% de précision
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="recap-stat">
          <div>
            <b>+{earnedXp}</b>
            <span>XP gagné</span>
          </div>
          <div>
            <b>{accuracy}%</b>
            <span>Précision</span>
          </div>
          <div>
            <b>{mistakes.length}</b>
            <span>Erreurs</span>
          </div>
        </div>
        {bonusXp > 0 && (
          <div className="nugget" style={{ borderTop: 'none', paddingTop: 0, textAlign: 'center' }}>
            Bonus session parfaite : +{bonusXp} XP
          </div>
        )}
      </div>

      {mistakes.length > 0 && (
        <>
          <h5>Tes erreurs</h5>
          <div className="card" style={{ marginBottom: 14 }}>
            {mistakes.map((m, i) => {
              const explanation = getExplanation(
                m.spot,
                m.group,
                m.contextKey,
                m.notation,
                explicationsOpenData,
                explicationsSpotsData,
                m.correctAction,
              )
              return (
                <div className="miss-row" key={i}>
                  <div className="top">
                    <span>
                      {m.notation} · {seatPhrase(m.seat)}
                    </span>
                    <span className="badge">
                      <Icon name="cross" style={{ width: 12, height: 12, color: 'var(--red)' }} />
                    </span>
                  </div>
                  <p>{explanation.text}</p>
                </div>
              )
            })}
          </div>
        </>
      )}

      <button type="button" className="btn g" style={{ marginTop: 'auto', marginBottom: 14 }} onClick={onFinish}>
        TERMINER
      </button>
    </div>
  )
}
