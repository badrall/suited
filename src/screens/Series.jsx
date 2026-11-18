import { useState } from 'react'
import BackHeader from '../components/BackHeader'
import JargonText from '../components/JargonText'
import PositionPicker from '../components/PositionPicker'
import ProgressBar, { masteryColor } from '../components/ProgressBar'
import { loadState, getMasteryForPositionFilter, getMasteryBySpot } from '../lib/storage'
import { SPOTS, SPOT_LABELS } from '../lib/hands'

const POSITION_GROUPS_UI = ['EP', 'MP', 'CO', 'BTN', 'Blinds']

// Une phrase par situation : on doit comprendre de quoi on parle avant de s'entraîner dessus.
const SPOT_DESCRIPTIONS = {
  open: 'Tu es le premier à parler : tu ouvres la mise ou tu te couches ?',
  bb_defense: 'Un joueur ouvre et tu es en big blind : tu défends ou tu te couches ?',
  vs_3bet: "Tu as ouvert et on te 3-bet : tu continues ou tu te couches ?",
}

const MASTERY_LEGEND = [
  { color: 'var(--red)', label: 'À travailler' },
  { color: 'var(--gold)', label: 'En progrès' },
  { color: 'var(--green)', label: 'Solide' },
  { color: 'var(--cream-2)', label: 'Pas encore joué' },
]

function masteryLabel(percent) {
  return percent == null ? 'Pas encore joué' : `${percent}% de maîtrise`
}

// Visuels des 3 grandes boxes (SVG simples, aux couleurs du design system).
function MixVisual() {
  return (
    <svg viewBox="0 0 84 68" className="sb-visual" aria-hidden="true">
      <g transform="rotate(-14 30 40)">
        <rect x="14" y="10" width="34" height="48" rx="6" fill="#f3ead9" />
        <text x="31" y="42" textAnchor="middle" fontSize="26" fontFamily="Georgia, serif" fill="#0f2033">
          ♠
        </text>
      </g>
      <g transform="rotate(12 56 38)">
        <rect x="38" y="8" width="34" height="48" rx="6" fill="#fff" />
        <text x="55" y="40" textAnchor="middle" fontSize="26" fontFamily="Georgia, serif" fill="#c0392b">
          ♥
        </text>
      </g>
    </svg>
  )
}

function PositionsVisual() {
  const seats = [
    [42, 8],
    [68, 18],
    [74, 36],
    [58, 56],
    [26, 56],
    [10, 36],
    [16, 18],
  ]
  return (
    <svg viewBox="0 0 84 68" className="sb-visual" aria-hidden="true">
      <ellipse cx="42" cy="34" rx="34" ry="24" fill="#2c745b" stroke="#6b4a2b" strokeWidth="4" />
      {seats.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 3 ? 6.5 : 5} fill={i === 3 ? '#e0a655' : '#f1e4cc'} />
      ))}
    </svg>
  )
}

function SituationsVisual() {
  const rows = [
    ['var(--green)', 52],
    ['var(--blue)', 40],
    ['var(--red)', 30],
  ]
  return (
    <svg viewBox="0 0 84 68" className="sb-visual" aria-hidden="true">
      {rows.map(([color, width], i) => (
        <g key={i}>
          <circle cx="14" cy={16 + i * 18} r="6" fill={color} />
          <rect x="28" y={12 + i * 18} width={width} height="8" rx="4" fill="#f3ead9" opacity="0.85" />
        </g>
      ))}
    </svg>
  )
}

/**
 * Écran Séries, navigation à 2 niveaux :
 *  niveau 1 = 3 grandes boxes (Le Mix lance directement, Les positions / Les situations ouvrent le niveau 2) ;
 *  niveau 2 = table de positions colorée par la maîtrise, ou liste des situations avec leur maîtrise.
 */
export default function Series({ onStart }) {
  const [view, setView] = useState('root') // 'root' | 'positions' | 'situations'
  const state = loadState()
  const masteryByGroup = Object.fromEntries(
    POSITION_GROUPS_UI.map((g) => [g, getMasteryForPositionFilter(state.history, g)]),
  )

  if (view === 'positions') {
    return (
      <div className="screen with-nav">
        <BackHeader title="Les positions" onBack={() => setView('root')} />
        <p className="series-intro">Touche une position pour t'y entraîner. La couleur montre où tu es le moins à l'aise.</p>
        <PositionPicker masteryByGroup={masteryByGroup} onSelect={(group) => onStart({ spot: null, group })} />
        <div className="mastery-legend">
          {MASTERY_LEGEND.map((item) => (
            <div className="chart-legend-item" key={item.label}>
              <span className="chart-legend-swatch" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (view === 'situations') {
    return (
      <div className="screen with-nav">
        <BackHeader title="Les situations" onBack={() => setView('root')} />
        <p className="series-intro">Choisis le moment de la main que tu veux travailler.</p>
        {SPOTS.map((spot) => {
          const percent = getMasteryBySpot(state.history, spot)
          return (
            <button key={spot} type="button" className="situation-row" onClick={() => onStart({ spot, group: null })}>
              <span className="situation-title">
                <JargonText text={SPOT_LABELS[spot]} />
              </span>
              <span className="situation-desc">{SPOT_DESCRIPTIONS[spot]}</span>
              <span className="situation-mastery">
                <ProgressBar percent={percent ?? 0} color={masteryColor(percent)} />
                <small>{masteryLabel(percent)}</small>
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="screen with-nav">
      <div className="topbar">
        <b>Entraînement</b>
      </div>
      <p className="series-intro">Comment veux-tu t'entraîner ?</p>

      <button type="button" className="series-box mix" onClick={() => onStart({ spot: null, group: null })}>
        <span className="sb-text">
          <span className="sb-title">Le Mix</span>
          <span className="sb-sub">Toutes les positions et toutes les situations. Tu joues tout de suite.</span>
        </span>
        <MixVisual />
      </button>

      <button type="button" className="series-box" onClick={() => setView('positions')}>
        <span className="sb-text">
          <span className="sb-title">Les positions</span>
          <span className="sb-sub">Choisis où t'entraîner : EP, milieu, cutoff, bouton ou blinds.</span>
        </span>
        <PositionsVisual />
      </button>

      <button type="button" className="series-box" onClick={() => setView('situations')}>
        <span className="sb-text">
          <span className="sb-title">Les situations</span>
          <span className="sb-sub">Ouvrir la mise, défendre ta big blind ou répondre à un 3-bet.</span>
        </span>
        <SituationsVisual />
      </button>
    </div>
  )
}
