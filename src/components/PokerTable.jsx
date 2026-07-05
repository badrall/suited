// Table 9-max vue de dessus, sièges positionnés sur une ellipse, siège du héros surligné.

const SEATS_ORDER = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']

function seatPosition(index, total) {
  // Départ en haut, sens horaire, ellipse un peu aplatie pour ressembler à une table ovale.
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total
  const rx = 44
  const ry = 40
  const left = 50 + rx * Math.cos(angle)
  const top = 50 + ry * Math.sin(angle)
  return { left: `${left}%`, top: `${top}%` }
}

export default function PokerTable({ heroSeat, potLabel }) {
  return (
    <div className="table">
      {SEATS_ORDER.map((seat, i) => {
        const isHero = seat === heroSeat
        const { left, top } = seatPosition(i, SEATS_ORDER.length)
        return (
          <div
            key={seat}
            className={`seat${isHero ? ' me' : ''}`}
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
