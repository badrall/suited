import { Icon } from '../components/Icons'
import MasteryRing from '../components/MasteryRing'
import { loadState, getOverallMastery, getAllMastery, getPokerIQ } from '../lib/storage'
import { ALL_HERO_GROUPS } from '../lib/hands'

export default function Home({ onPlay, onNavigate }) {
  const state = loadState()
  const overall = getOverallMastery(state.history)
  const byPosition = getAllMastery(state.history)
  const iq = getPokerIQ(state.history)

  const weakest = ALL_HERO_GROUPS.map((g) => ({ g, v: byPosition[g] }))
    .filter((p) => p.v != null && p.v < 75)
    .sort((a, b) => a.v - b.v)[0]

  return (
    <div className="screen with-nav">
      <div className="watermark">
        <span style={{ bottom: 60, right: -30 }}>♠</span>
      </div>

      <div className="topbar">
        <div className="chip fire">
          <Icon name="flame" />
          {state.streak.count}
        </div>
        <div className="chip iq">
          <Icon name="brain" />
          IQ {iq.score}
        </div>
        <div className="chip xp">
          <Icon name="star" />
          {state.xp.toLocaleString('fr-FR')}
        </div>
      </div>

      <div className="hero">
        <div className="suits">♠♥</div>
        <h3>Session du jour</h3>
        <p>10 mains · 3 min · mix des positions</p>
        <button type="button" className="btn" onClick={onPlay}>
          JOUER
        </button>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="ringwrap">
          <MasteryRing percent={overall} />
          <div>
            <b style={{ fontSize: 14 }}>Maîtrise préflop</b>
            <br />
            <small style={{ fontWeight: 800, color: 'var(--gray)' }}>
              {weakest
                ? `Point faible : ${weakest.g} (${weakest.v}%) → entraîne cette position`
                : state.history.length > 0
                  ? 'Toutes les positions sont solides. Continue !'
                  : 'Joue ta première session pour débloquer tes stats.'}
            </small>
          </div>
        </div>
      </div>

      <button type="button" className="btn b" style={{ marginBottom: 10 }} onClick={() => onNavigate('series')}>
        SÉRIES PAR POSITION
      </button>
      <button type="button" className="btn ghost" onClick={() => onNavigate('charts')}>
        Consulter les charts
      </button>
    </div>
  )
}
