import { SEATS_ORDER, SEATS_BY_GROUP } from '../lib/hands'
import { seatPosition } from './PokerTable'
import ProgressBar, { masteryColor } from './ProgressBar'

// Les 9 sièges se regroupent en 5 zones tappables : SB et BB fusionnent en "Blinds", comme partout
// ailleurs dans l'app (cf. getMasteryForPositionFilter / eligibleContexts).
const SEAT_GROUP = {}
for (const [group, seats] of Object.entries(SEATS_BY_GROUP)) {
  for (const seat of seats) SEAT_GROUP[seat] = group
}
SEAT_GROUP.SB = 'Blinds'
SEAT_GROUP.BB = 'Blinds'

const LEGEND_GROUPS = ['EP', 'MP', 'CO', 'BTN', 'Blinds']

// Pas encore de données : même look que le siège neutre du Drill. Sinon, coloré par la maîtrise.
function seatStyle(percent) {
  if (percent == null) return { background: '#fff', borderColor: 'var(--line)', color: '#999' }
  const color = masteryColor(percent)
  return { background: color, borderColor: color, color: '#fff' }
}

/**
 * Table 9-max cliquable (écran Séries, "Focus par position") : chaque siège lance une session
 * filtrée sur son groupe (EP/MP/CO/BTN/Blinds), coloré par la maîtrise déjà acquise.
 */
export default function PositionPicker({ masteryByGroup, onSelect }) {
  return (
    <>
      <div className="table pos-table">
        {SEATS_ORDER.map((seat, i) => {
          const group = SEAT_GROUP[seat]
          const percent = masteryByGroup[group]
          const { left, top } = seatPosition(i, SEATS_ORDER.length)
          return (
            <button
              key={seat}
              type="button"
              className="seat pos-seat"
              style={{ left, top, ...seatStyle(percent) }}
              onClick={() => onSelect(group)}
              aria-label={`Focus ${group} — ${percent == null ? 'pas encore joué' : `${percent}% de maîtrise`}`}
            >
              {seat}
            </button>
          )
        })}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        {LEGEND_GROUPS.map((group) => {
          const percent = masteryByGroup[group]
          return (
            <div className="pos" key={group}>
              <span style={{ width: 50 }}>{group}</span>
              <ProgressBar percent={percent ?? 0} color={masteryColor(percent)} />
              <b>{percent == null ? '—' : `${percent}%`}</b>
            </div>
          )
        })}
      </div>
    </>
  )
}
