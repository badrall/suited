import PlayingCard from '../components/PlayingCard'
import PokerTable from '../components/PokerTable'
import ProgressBar from '../components/ProgressBar'
import JargonText from '../components/JargonText'
import { seatPhrase, seatLabel, buttonsForSpot } from '../lib/hands'

// Sizings illustratifs par spot (pot au moment de la question), juste pour donner le contexte visuel.
const POT_LABEL_BY_SPOT = { open: '1,5 bb', bb_defense: '5,5 bb', vs_3bet: '25 bb' }

export default function Drill({ question, index, total, onAnswer, onQuit }) {
  const percent = (index / total) * 100
  const buttons = buttonsForSpot(question.spot)
  const markedSeat = question.spot === 'bb_defense' ? question.openerSeat : question.spot === 'vs_3bet' ? question.villainSeat : null

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

      <PokerTable heroSeat={question.seat} markedSeat={markedSeat} potLabel={POT_LABEL_BY_SPOT[question.spot]} />

      <div className="ctx">
        {question.spot === 'open' && (
          <>
            Tu es{' '}
            <b>
              <JargonText text={seatPhrase(question.seat)} />
            </b>{' '}
            · <JargonText text="100bb · foldé jusqu'à toi" />
          </>
        )}
        {question.spot === 'bb_defense' && (
          <>
            <b>
              <JargonText text={seatLabel(question.openerSeat)} />
            </b>{' '}
            <JargonText text="ouvre" /> · <JargonText text="tu es en" /> <b>BIG BLIND</b> · 100bb
          </>
        )}
        {question.spot === 'vs_3bet' && (
          <>
            <JargonText text="Tu as ouvert" /> <JargonText text={seatPhrase(question.seat)} /> ·{' '}
            <b>
              <JargonText text={seatLabel(question.villainSeat)} />
            </b>{' '}
            <JargonText text="te 3-bette · 100bb" />
          </>
        )}
      </div>

      <div className="hole">
        {question.cards.map((c, i) => (
          <PlayingCard key={i} rank={c.rank} suit={c.suit} size="lg" />
        ))}
      </div>

      <div className="answers">
        {buttons.map((b) => (
          <button key={b.action} type="button" className={`btn ${b.cls}`} onClick={() => onAnswer(b.action)}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}
