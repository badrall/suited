import { useState } from 'react'
import { IconSprite } from './components/Icons'
import BottomNav from './components/BottomNav'
import Home from './screens/Home'
import Series from './screens/Series'
import Charts from './screens/Charts'
import Jargon from './screens/Jargon'
import Progress from './screens/Progress'
import Session from './screens/Session'
import Onboarding from './screens/Onboarding'
import { JargonNavigationProvider } from './lib/JargonNavigation'
import { loadState } from './lib/storage'

// L'app est une simple machine à onglets + deux modes plein écran hors ruban : session et onboarding.
export default function App() {
  const [tab, setTab] = useState('home')
  const [sessionConfig, setSessionConfig] = useState(null) // null hors session, sinon { spot, group }
  const [refreshTick, setRefreshTick] = useState(0)
  const [jargonTermCore, setJargonTermCore] = useState(null)
  // Premier lancement (aucun état sauvegardé) : le test de positionnement s'affiche automatiquement.
  const [onboardingActive, setOnboardingActive] = useState(() => loadState().onboarding.status === 'pending')

  function startSession(config) {
    setSessionConfig(config)
  }

  function endSession() {
    setSessionConfig(null)
    setTab('home')
    setRefreshTick((t) => t + 1) // force Home/Progrès/Séries à relire le localStorage
  }

  function startOnboarding() {
    setOnboardingActive(true)
  }

  // startSessionAfter : true quand on vient du CTA final "Commence ton entraînement".
  function endOnboarding(startSessionAfter) {
    setOnboardingActive(false)
    setRefreshTick((t) => t + 1) // le Poker IQ de repli / les stats viennent de changer
    if (startSessionAfter) startSession({ spot: null, group: null })
    else setTab('home')
  }

  // Ouvre l'onglet Jargon directement sur le terme tappé (catégorie dépliée + entrée surlignée) ;
  // quitte la session en cours s'il y en a une (accessible depuis les popups, y compris pendant un drill).
  function openJargon(termCore) {
    setSessionConfig(null)
    setJargonTermCore(termCore ?? null)
    setTab('jargon')
  }

  return (
    <div className="app-shell">
      <IconSprite />
      <JargonNavigationProvider onNavigate={openJargon}>
        {onboardingActive ? (
          <Onboarding onFinish={endOnboarding} />
        ) : sessionConfig ? (
          <Session config={sessionConfig} onFinish={endSession} />
        ) : (
          <>
            {tab === 'home' && (
              <Home key={refreshTick} onPlay={() => startSession({ spot: null, group: null })} onNavigate={setTab} />
            )}
            {tab === 'series' && <Series key={`s${refreshTick}`} onStart={startSession} />}
            {tab === 'charts' && <Charts />}
            {tab === 'jargon' && <Jargon highlightTerm={jargonTermCore} />}
            {tab === 'progress' && (
              <Progress key={`p${refreshTick}`} onRetakeOnboarding={startOnboarding} />
            )}
            <BottomNav active={tab} onChange={setTab} />
          </>
        )}
      </JargonNavigationProvider>
    </div>
  )
}
