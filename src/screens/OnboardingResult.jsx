import ProgressBar, { masteryColor } from '../components/ProgressBar'
import { ONBOARDING_THEMES, THEME_ORIENTATION, getWeakestThemes, themeScorePercent } from '../lib/onboarding'

export default function OnboardingResult({ totalScore, themeScores, startingPokerIQ, onFinish }) {
  const weakest = getWeakestThemes(themeScores, 3)

  return (
    <div className="screen">
      <div className="topbar">
        <b>Ton point de départ</b>
      </div>

      <div className="hero">
        <div className="suits">♠♣</div>
        <h3>{totalScore}/20</h3>
        <p>Score au test de positionnement</p>
      </div>

      <div className="iqcard">
        <div className="label">POKER IQ · ESTIMATION PROVISOIRE</div>
        <div className="score">{startingPokerIQ}</div>
        <div className="next">Se précisera au fil de tes sessions — ce n'est qu'un point de départ.</div>
      </div>

      <h5>Score par thème</h5>
      <div className="card" style={{ marginBottom: 14 }}>
        {Object.keys(ONBOARDING_THEMES).map((id) => {
          const pct = themeScorePercent(themeScores[id])
          return (
            <div className="pos" key={id}>
              <span style={{ width: 112, fontSize: 10.5, textAlign: 'left' }}>{ONBOARDING_THEMES[id]}</span>
              <ProgressBar percent={pct} color={masteryColor(pct)} />
              <b style={{ width: 36 }}>
                {themeScores[id].correct}/{themeScores[id].total}
              </b>
            </div>
          )
        })}
      </div>

      <h5>Tes 3 chantiers prioritaires</h5>
      <div className="card" style={{ marginBottom: 14 }}>
        {weakest.map((theme, i) => (
          <div className="miss-row" key={theme.id}>
            <div className="top">
              <span>
                {i + 1}. {theme.label}
              </span>
              <span className="badge">
                {theme.correct}/{theme.total}
              </span>
            </div>
            <p>{THEME_ORIENTATION[theme.id]}</p>
          </div>
        ))}
      </div>

      <button type="button" className="btn g" style={{ marginTop: 'auto', marginBottom: 14 }} onClick={() => onFinish(true)}>
        COMMENCE TON ENTRAÎNEMENT
      </button>
    </div>
  )
}
