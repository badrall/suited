import { useEffect, useState } from 'react'
import { Icon } from '../components/Icons'
import JargonText from '../components/JargonText'
import { getExplanation, seatPhrase } from '../lib/hands'

// Compte de 0 jusqu'à target en ~700ms (easeOutCubic) — juste pour la satisfaction du chiffre qui monte.
// Filet de sécurité : si requestAnimationFrame ne se déclenche pas (onglet en arrière-plan, économie
// d'énergie...), un timeout force la valeur finale — sans ça l'XP peut rester bloqué à 0 affiché.
function useCountUp(target, durationMs = 700) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf
    let done = false
    const start = performance.now()
    function tick(now) {
      if (done) return
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - t) ** 3
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const fallback = setTimeout(() => {
      done = true
      setValue(target)
    }, durationMs + 80)
    return () => {
      done = true
      cancelAnimationFrame(raf)
      clearTimeout(fallback)
    }
  }, [target, durationMs])
  return value
}

export default function SessionEnd({
  answers,
  bonusXp,
  streakCount,
  todayAccuracy,
  startMastery,
  endMastery,
  explicationsOpenData,
  explicationsSpotsData,
  onFinish,
}) {
  const total = answers.length
  const correctCount = answers.filter((a) => a.correct).length
  const accuracy = Math.round((correctCount / total) * 100)
  const earnedXp = answers.reduce((sum, a) => sum + a.xpGain, 0) + bonusXp
  const animatedXp = useCountUp(earnedXp)
  const mistakes = answers.filter((a) => !a.correct)

  // On ne célèbre que la progression (pas une régression ponctuelle sur 10 mains).
  const masteryGained =
    startMastery && endMastery && startMastery.value != null && endMastery.value != null && endMastery.value > startMastery.value
      ? { label: endMastery.label, before: startMastery.value, after: endMastery.value }
      : null

  return (
    <div className="screen">
      <div className="topbar">
        <b>Session terminée</b>
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
            <b>+{animatedXp}</b>
            <span>XP gagné</span>
          </div>
          <div>
            <b>{todayAccuracy == null ? '—' : `${todayAccuracy}%`}</b>
            <span>Précision du jour</span>
          </div>
          <div>
            <b>{streakCount}</b>
            <span>Streak</span>
          </div>
        </div>
        {bonusXp > 0 && (
          <div className="nugget" style={{ borderTop: 'none', paddingTop: 0, textAlign: 'center' }}>
            Bonus session parfaite : +{bonusXp} XP
          </div>
        )}
      </div>

      {masteryGained && (
        <div className="mastery-gain">
          {masteryGained.label} : {masteryGained.before}% → {masteryGained.after}% 📈
        </div>
      )}

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
                  <p>
                    <JargonText text={explanation.text} />
                  </p>
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
