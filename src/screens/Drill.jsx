import PlayingCard from '../components/PlayingCard'
import PokerTable from '../components/PokerTable'
import ProgressBar from '../components/ProgressBar'
import { seatPhrase } from '../lib/hands'

export default function Drill({ question, index, total, onAnswer, onQuit }) {
  const percent = (index / total) * 100

  return (
    <div className="screen">
      <div className="progress">
        <button type="button" onClick={onQuit} aria-label="Quitter la session">
          ✕
        </button>
        <ProgressBar percent={percent} />
        <b style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 900 }}>
          {index + 1}/{total}
        </b>
      </div>

      <PokerTable heroSeat={question.seat} potLabel="1,5 bb" />

      <div className="ctx">
        Tu es <b>{seatPhrase(question.seat)}</b> · 100bb · foldé jusqu'à toi
      </div>

      <div className="hole">
        {question.cards.map((c, i) => (
          <PlayingCard key={i} rank={c.rank} suit={c.suit} size="lg" />
        ))}
      </div>

      <div className="answers">
        <button type="button" className="btn r" onClick={() => onAnswer('fold')}>
          FOLD
        </button>
        <button type="button" className="btn b" onClick={() => onAnswer('call')}>
          CALL
        </button>
        <button type="button" className="btn g" onClick={() => onAnswer('raise')}>
          RAISE
        </button>
      </div>
    </div>
  )
}
