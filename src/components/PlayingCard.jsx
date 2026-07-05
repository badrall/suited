import { RED_SUITS } from '../lib/hands'

export default function PlayingCard({ rank, suit, size = 'lg' }) {
  const color = RED_SUITS.has(suit) ? 'redsuit' : 'black'
  return (
    <div className={`pcard ${color} pcard-${size}`}>
      <div className="r">{rank}</div>
      <div className="s">{suit}</div>
    </div>
  )
}
