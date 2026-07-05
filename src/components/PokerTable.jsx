// Table 9-max vue de dessus, sièges positionnés sur une ellipse, siège du héros surligné.

import { SEATS_ORDER } from '../lib/hands'

function seatPosition(index, total) {
  // Départ en haut, sens horaire, ellipse un peu aplatie pour ressembler à une table ovale.
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total
  const rx = 44
  const ry = 40
  const left = 50 + rx * Math.cos(angle)
  const top = 50 + ry * Math.sin(angle)
  return { left: `${left}%`, top: `${top}%` }
}

/**
 * markedSeat : siège adverse à surligner en plus du héros (l'ouvreur en défense de BB,
 * le 3-betteur face à un 3-bet). Reste sobre (anneau bleu) pour ne pas concurrencer le héros (or).
 */
export default function PokerTable({ heroSeat, markedSeat, potLabel }) {
  return (
    <div className="table">
      {SEATS_ORDER.map((seat, i) => {
        const isHero = seat === heroSeat
        const isMarked = !isHero && seat === markedSeat
        const { left, top } = seatPosition(i, SEATS_ORDER.length)
        return (
          <div
            key={seat}
            className={`seat${isHero ? ' me' : ''}${isMarked ? ' marked' : ''}`}
            style={{ left, top, transform: 'translate(-50%, -50%)' }}
          >
            {isHero ? 'MOI' : seat}
          </div>
        )
      })}
      <div className="pot">
        <span className="pot-label">POT</span>
        <span className="pot-value">{potLabel}</span>
      </div>
    </div>
  )
}
