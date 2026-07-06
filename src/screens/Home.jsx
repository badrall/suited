import { useEffect, useState } from 'react'
import { Icon } from '../components/Icons'
import MasteryRing from '../components/MasteryRing'
import ProgressBar from '../components/ProgressBar'
import { loadState, getOverallMastery, getAllMastery, getPokerIQ, getTrainingRank, acknowledgeRankUp, hasPlayedToday } from '../lib/storage'
import { ALL_HERO_GROUPS } from '../lib/hands'
import { getNotificationPermission, requestNotificationPermission, scheduleDailyReminder } from '../lib/notifications'

export default function Home({ onPlay, onNavigate }) {
  const state = loadState()
  const overall = getOverallMastery(state.history)
  const byPosition = getAllMastery(state.history)
  const iq = getPokerIQ(state.history)
  const rank = getTrainingRank(state.xp)
  const doneToday = hasPlayedToday(state.streak)

  // Si l'XP vient de faire passer un palier, on le célèbre brièvement puis on ne le remontre plus
  // (acknowledgeRankUp mémorise le dernier rang vu, donc ce n'affiche qu'une fois par nouveau rang).
  const [showRankUp, setShowRankUp] = useState(false)
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission())

  // Deux effets séparés (plutôt qu'un seul qui programme son propre timer) pour rester correct sous
  // React StrictMode en dev : celui-ci détecte le nouveau rang une fois (idempotent, mémorisé en
  // localStorage) ; l'auto-masquage ci-dessous se déclenche sur le changement d'état, pas au montage.
  useEffect(() => {
    if (acknowledgeRankUp(state.xp)) setShowRankUp(true)
  }, [state.xp])

  useEffect(() => {
    if (!showRankUp) return
    const timer = setTimeout(() => setShowRankUp(false), 3000)
    return () => clearTimeout(timer)
  }, [showRankUp])

  useEffect(() => {
    if (notifPermission === 'granted') scheduleDailyReminder()
  }, [notifPermission])

  async function handleEnableReminders() {
    const permission = await requestNotificationPermission()
    setNotifPermission(permission)
  }

  const weakest = ALL_HERO_GROUPS.map((g) => ({ g, v: byPosition[g] }))
    .filter((p) => p.v != null && p.v < 75)
    .sort((a, b) => a.v - b.v)[0]

  return (
    <div className="screen with-nav">
      <div className="watermark">
        <span style={{ bottom: 60, right: -30 }}>♠</span>
      </div>

      <div className="topbar">
        <div className="chip fire">
          <Icon name="flame" />
          {state.streak.count}
        </div>
        <div className="chip iq">
          <Icon name="brain" />
          IQ {iq.score}
        </div>
        <div className="chip xp">
          <Icon name="star" />
          {state.xp.toLocaleString('fr-FR')}
        </div>
      </div>

      {showRankUp && <div className="rank-up-banner">Nouveau rang débloqué : {rank.label} !</div>}

      <div className="hero">
        <div className="suits">♠♥</div>
        <h3>Session du jour</h3>
        <p>10 mains · 3 min · mix des positions</p>
        <button type="button" className="btn" onClick={onPlay}>
          JOUER
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Icon
          name={doneToday ? 'check' : 'target'}
          style={{ width: 14, height: 14, color: doneToday ? 'var(--green-dark)' : 'var(--gray)' }}
        />
        <small style={{ fontWeight: 800, color: doneToday ? 'var(--green-dark)' : 'var(--gray)' }}>
          {doneToday ? 'Objectif du jour atteint' : 'Objectif du jour : à faire'}
        </small>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <b style={{ fontSize: 14 }}>Rang d'entraînement</b>
          <span style={{ fontWeight: 900, fontSize: 13, color: 'var(--orange)' }}>{rank.label}</span>
        </div>
        <ProgressBar percent={rank.progress * 100} color="var(--orange)" />
        <small style={{ fontWeight: 800, color: 'var(--gray)', display: 'block', marginTop: 6 }}>
          {rank.next ? `${rank.next.xpRemaining} XP jusqu'à ${rank.next.label}` : 'Rang maximum atteint'}
        </small>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="ringwrap">
          <MasteryRing percent={overall} />
          <div>
            <b style={{ fontSize: 14 }}>Maîtrise préflop</b>
            <br />
            <small style={{ fontWeight: 800, color: 'var(--gray)' }}>
              {weakest
                ? `Point faible : ${weakest.g} (${weakest.v}%) → entraîne cette position`
                : state.history.length > 0
                  ? 'Toutes les positions sont solides. Continue !'
                  : 'Joue ta première session pour débloquer tes stats.'}
            </small>
          </div>
        </div>
      </div>

      <button type="button" className="btn b" style={{ marginBottom: 10 }} onClick={() => onNavigate('series')}>
        SÉRIES PAR POSITION
      </button>
      <button type="button" className="btn ghost" onClick={() => onNavigate('charts')}>
        Consulter les charts
      </button>

      {notifPermission === 'default' && (
        <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={handleEnableReminders}>
          Activer le rappel quotidien (19h)
        </button>
      )}
    </div>
  )
}
