import { Icon } from '../components/Icons'
import ProgressBar, { masteryColor } from '../components/ProgressBar'
import {
  loadState,
  getAllMastery,
  getPokerIQ,
  getTopMissedHands,
  getMonthCalendar,
} from '../lib/storage'
import { POSITION_GROUPS } from '../lib/hands'

export default function Progress() {
  const state = loadState()
  const mastery = getAllMastery(state.history)
  const iq = getPokerIQ(state.history)
  const missed = getTopMissedHands(state.history, 5)
  const { days, monthLabel } = getMonthCalendar(state.streak.playedDates)

  return (
    <div className="screen">
      <div className="watermark">
        <span style={{ bottom: 60, right: -36 }}>♥</span>
      </div>

      <div className="topbar">
        <b style={{ fontSize: 17, fontWeight: 900 }}>Ton niveau</b>
        <div className="chip fire">
          <Icon name="flame" />
          {state.streak.count}
        </div>
      </div>

      <div className="iqcard">
        <div className="label">POKER IQ · PRÉFLOP</div>
        <div className="score">{iq.score}</div>
        <div className="lvl">{iq.level}</div>
        {iq.next && (
          <div className="next">
            Prochain palier ({iq.next.threshold}) : <b>{iq.next.label}</b>
          </div>
        )}
      </div>

      <h5>Maîtrise par position</h5>
      <div className="card" style={{ marginBottom: 14 }}>
        {POSITION_GROUPS.map((group) => (
          <div className="pos" key={group}>
            <span>{group}</span>
            <ProgressBar percent={mastery[group] ?? 0} color={masteryColor(mastery[group])} />
            <b>{mastery[group] == null ? '—' : `${mastery[group]}%`}</b>
          </div>
        ))}
      </div>

      <h5>{capitalize(monthLabel)} · streak</h5>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="cal">
          {days.map(({ day, played }) => (
            <i key={day} className={played ? 'ok' : ''}>
              {day}
            </i>
          ))}
        </div>
      </div>

      <h5>Top 5 des mains ratées</h5>
      <div className="card">
        {missed.length === 0 && (
          <small style={{ fontWeight: 800, color: 'var(--gray)' }}>
            Aucune erreur pour l'instant — continue comme ça !
          </small>
        )}
        {missed.map(({ notation, count }) => (
          <div className="missed-hand" key={notation}>
            <span>{notation}</span>
            <span className="count">{count}×</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
