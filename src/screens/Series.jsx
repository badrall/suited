import JargonText from '../components/JargonText'
import PositionPicker from '../components/PositionPicker'
import { loadState, getMasteryForPositionFilter, getMasteryBySpot } from '../lib/storage'
import { SPOT_LABELS } from '../lib/hands'

const POSITION_GROUPS_UI = ['EP', 'MP', 'CO', 'BTN', 'Blinds']

const SITUATION_TILES = [
  { key: 'open', color: '#00C2B8', glyph: '↑' },
  { key: 'bb_defense', color: 'var(--blue)', glyph: '◉' },
  { key: 'vs_3bet', color: 'var(--purple)', glyph: '▲' },
]

function masteryLabel(percent) {
  return percent == null ? 'Pas encore joué' : `${percent}% de maîtrise`
}

/** Écran Séries : Mix du jour, Focus par position, Par situation — chaque tuile lance une session filtrée. */
export default function Series({ onStart }) {
  const state = loadState()
  const masteryByGroup = Object.fromEntries(
    POSITION_GROUPS_UI.map((g) => [g, getMasteryForPositionFilter(state.history, g)]),
  )

  return (
    <div className="screen with-nav">
      <div className="topbar">
        <b>Entraînement</b>
      </div>

      <h5>Le mix</h5>
      <button
        type="button"
        className="mode"
        style={{
          background: 'linear-gradient(135deg,#58CC02,#2FB57C)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          minHeight: 62,
          marginBottom: 16,
        }}
        onClick={() => onStart({ spot: null, group: null })}
      >
        <i>♠♥</i>
        <div>
          Mix du jour
          <br />
          <small style={{ fontWeight: 800, opacity: 0.9 }}>toutes positions · toutes situations</small>
        </div>
      </button>

      <h5>Focus par position</h5>
      <PositionPicker masteryByGroup={masteryByGroup} onSelect={(group) => onStart({ spot: null, group })} />

      <h5>Par situation</h5>
      <div className="grid">
        {SITUATION_TILES.map((tile) => (
          <button
            key={tile.key}
            type="button"
            className="mode"
            style={{ background: tile.color }}
            onClick={() => onStart({ spot: tile.key, group: null })}
          >
            <i>{tile.glyph}</i>
            <JargonText text={SPOT_LABELS[tile.key]} />
            <small>{masteryLabel(getMasteryBySpot(state.history, tile.key))}</small>
          </button>
        ))}
      </div>
    </div>
  )
}
