import { useState } from 'react'
import RangeMatrix, { ACTION_COLOR } from '../components/RangeMatrix'
import rangesOpenData from '../data/ranges-open-raise-9max-live.json'
import rangesDefenseData from '../data/ranges-defense-bb-et-vs-3bet.json'
import { SPOTS, SPOT_LABELS, POSITION_GROUPS, VS3BET_BUCKET, correctActionFor, getFrontierSet } from '../lib/hands'

const ACTION_LABEL = { raise: 'RAISE', '3bet': '3-BET', '4bet': '4-BET', call: 'CALL', fold: 'FOLD' }

const CONTEXTS_BY_SPOT = {
  open: POSITION_GROUPS.map((g) => ({ key: g, label: g })),
  bb_defense: POSITION_GROUPS.map((g) => ({ key: `vs_${g}`, label: `vs ${g}` })),
  vs_3bet: [...new Set(Object.values(VS3BET_BUCKET))].map((key) => ({
    key,
    label: key.replace('open_', '').replace('_', '-'),
  })),
}

const LEGEND_BY_SPOT = {
  open: ['raise', 'fold'],
  bb_defense: ['3bet', 'call', 'fold'],
  vs_3bet: ['4bet', 'call', 'fold'],
}

/** Écran Charts : les 169 mains en lecture seule, colorées via correctActionFor — même source que le drill. */
export default function Charts() {
  const [spot, setSpot] = useState('open')
  const [contextKey, setContextKey] = useState(CONTEXTS_BY_SPOT.open[0].key)
  const [selected, setSelected] = useState(null)

  function handleSpotChange(nextSpot) {
    setSpot(nextSpot)
    setContextKey(CONTEXTS_BY_SPOT[nextSpot][0].key)
    setSelected(null)
  }

  function getAction(notation) {
    return correctActionFor(spot, contextKey, notation, rangesOpenData, rangesDefenseData)
  }

  const frontierSet = getFrontierSet(spot, contextKey, rangesOpenData, rangesDefenseData)
  const vpip = spot === 'open' ? rangesOpenData.positions[contextKey].vpip_approx : null

  return (
    <div className="screen with-nav">
      <div className="topbar">
        <b>Charts</b>
        {vpip && <span className="chart-vpip">VPIP ~{vpip}</span>}
      </div>

      <div className="chart-tabs">
        {SPOTS.map((s) => (
          <button
            key={s}
            type="button"
            className={`chart-tab${spot === s ? ' on' : ''}`}
            onClick={() => handleSpotChange(s)}
          >
            {SPOT_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="chart-pills">
        {CONTEXTS_BY_SPOT[spot].map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`chart-pill${contextKey === opt.key ? ' on' : ''}`}
            onClick={() => {
              setContextKey(opt.key)
              setSelected(null)
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <RangeMatrix
        getAction={getAction}
        frontierSet={frontierSet}
        selected={selected}
        onCellTap={(notation) => setSelected(notation)}
      />

      <div className="chart-legend">
        {LEGEND_BY_SPOT[spot].map((action) => (
          <div className="chart-legend-item" key={action}>
            <span className="chart-legend-swatch" style={{ background: ACTION_COLOR[action] }} />
            {ACTION_LABEL[action]}
          </div>
        ))}
        <div className="chart-legend-item">
          <span className="chart-legend-swatch chart-legend-frontier" />
          Main frontière
        </div>
      </div>

      <div className="chart-selection">
        {selected ? (
          <>
            <b>{selected}</b> → {ACTION_LABEL[getAction(selected)]}
            {frontierSet.has(selected) && ' · main frontière (priorité du drill)'}
          </>
        ) : (
          <span style={{ color: 'var(--gray)' }}>Tape une case pour voir la main et l'action.</span>
        )}
      </div>
    </div>
  )
}
