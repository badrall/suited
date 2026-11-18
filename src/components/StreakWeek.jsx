import { getWeekCalendar } from '../lib/storage'

/**
 * Carte « Ta série » : flamme SVG + nombre de jours, puis la semaine en cours (L→D).
 * Jours validés en or avec coche, aujourd'hui entouré. Alimentée par state.streak (storage).
 * La flamme et le dégradé #gFlame viennent d'IconSprite (toujours monté dans App).
 */
export default function StreakWeek({ streak }) {
  const week = getWeekCalendar(streak.playedDates)
  const count = streak.count

  return (
    <div className="streak-week">
      <div className="sw-head">
        <div className="sw-fire">
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M13 2c1 4-2 5-2 8 0 1.5 1 2.5 2 2.5 1.3 0 2.2-1 2.2-2.4 1.6 1.4 2.8 3.3 2.8 5.4A6.8 6.8 0 1 1 7 16.5C7 11 12 9 13 2z"
              fill="url(#gFlame)"
            />
          </svg>
          <b>
            {count} {count > 1 ? 'jours' : 'jour'}
          </b>
        </div>
        <div className="sw-sub">TA SÉRIE</div>
      </div>
      <div className="sw-days">
        {week.map((d) => (
          <div className="sw-day" key={d.date}>
            <div className={`sw-dot${d.played ? ' done' : ''}${d.isToday ? ' today' : ''}`}>
              {d.played && (
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="3.5" aria-label="validé">
                  <path d="M5 12l4 4L19 7" />
                </svg>
              )}
            </div>
            <span>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
