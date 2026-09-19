import { Icon } from './Icons'
import ProgressBar from './ProgressBar'
import { SPOT_LABELS } from '../lib/hands'
import { PREFLOP_ONLY_CAVEAT } from '../lib/levelEstimator'

const GAUGE_TRACK = { background: 'rgba(255,255,255,.25)' }

/** Carte "Ton niveau réel" (écran Progrès) : remplace l'ancien Poker IQ abstrait. */
export default function LevelCard({ level, onboardingStartingIQ }) {
  if (level.status === 'locked') {
    return (
      <div className="iqcard">
        <div className="label">TON NIVEAU RÉEL · PRÉFLOP</div>
        {onboardingStartingIQ != null ? (
          <>
            <div className="score">{onboardingStartingIQ}</div>
            <div className="lvl">Point de départ (test de positionnement)</div>
          </>
        ) : (
          <div className="lvl">Pas encore assez de données</div>
        )}
        <div className="next">Ton niveau réel se débloque dans {level.countdown} réponses.</div>
        <ProgressBar percent={level.reliabilityPercent} color="#fff" trackStyle={GAUGE_TRACK} />
        <small className="level-progress-label">Progression vers le déblocage : {level.reliabilityPercent}%</small>
      </div>
    )
  }

  const { tier, nextTier, subScore, reliabilityPercent, status, blockingSpot } = level

  return (
    <>
      <div className="iqcard">
        <div className="label">TON NIVEAU RÉEL · PRÉFLOP</div>
        <div className="score" style={{ fontSize: 28 }}>
          {tier.label}
        </div>
        <div className="lvl">Palier {tier.id}/5</div>

        {nextTier && (
          <>
            <ProgressBar percent={subScore} color="#fff" trackStyle={GAUGE_TRACK} />
            <small className="level-progress-label">
              {subScore}% vers « {nextTier.label} »
            </small>
          </>
        )}

        <div className="level-detail">
          {tier.meaning}
          <br />
          <b>Équivalent réel :</b> {tier.realWorld}
          <br />
          <b>Ça te permet de viser :</b> {tier.unlocks}
        </div>
      </div>

      {blockingSpot && (
        <div className="level-blocker">
          <b>
            <Icon name="target" style={{ width: 14, height: 14 }} /> SPOT LIMITANT
          </b>
          <p>
            Ton palier est limité par ta {SPOT_LABELS[blockingSpot]} → travaille-la pour débloquer le niveau suivant.
          </p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="level-reliability-row">
          <b style={{ fontSize: 13 }}>Fiabilité de l'estimation</b>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--gray)' }}>
            {status === 'consolidated' ? 'Consolidée' : 'Provisoire'}
          </span>
        </div>
        <ProgressBar percent={reliabilityPercent} color={status === 'consolidated' ? 'var(--green)' : 'var(--orange)'} />
        <small className="level-caveat">{PREFLOP_ONLY_CAVEAT}</small>
      </div>
    </>
  )
}
