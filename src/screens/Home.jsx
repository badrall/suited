import { useEffect } from 'react'
import Logo from '../components/Logo'
import StreakWeek from '../components/StreakWeek'
import { loadState } from '../lib/storage'
import { scheduleDailyReminder } from '../lib/notifications'
import { pickTermOfDay } from '../lib/jargon'
import { useJargonNavigate } from '../lib/JargonNavigation'

/** Accueil épuré : logo, série de la semaine, héros « Session du jour », mot du jour. */
export default function Home({ onPlay }) {
  const state = loadState()

  // Seedé par la date du jour (pas Math.random) : stable toute la journée, change le lendemain.
  const termOfDay = pickTermOfDay()
  const goToJargon = useJargonNavigate()

  // Le bouton d'activation du rappel n'est plus sur l'accueil, mais un rappel déjà autorisé reste planifié
  // (no-op tant que la permission n'est pas accordée).
  useEffect(() => {
    scheduleDailyReminder()
  }, [])

  return (
    <div className="screen with-nav">
      <div className="topbar">
        <div className="brand">
          <Logo />
          <div className="wordmark">Suited</div>
        </div>
      </div>

      <StreakWeek streak={state.streak} />

      <div className="hero hero-home">
        <div className="suits">♠</div>
        <div className="hero-tag">Content de te revoir</div>
        <h3>
          Session
          <br />
          du jour
        </h3>
        <p>10 mains · 3 min</p>
        <div className="hero-cards">
          <span className="pch b">A♠</span>
          <span className="pch r">K♦</span>
        </div>
        <button type="button" className="btn" onClick={onPlay}>
          JOUER
        </button>
      </div>

      <button type="button" className="word" onClick={() => goToJargon(termOfDay.core)}>
        <span className="word-term">
          <b>{termOfDay.displayName}</b>
          <em>mot du jour</em>
        </span>
        <span className="word-def">{termOfDay.definition}</span>
      </button>
    </div>
  )
}
