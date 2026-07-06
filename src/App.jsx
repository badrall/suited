import { useState } from 'react'
import { IconSprite } from './components/Icons'
import BottomNav from './components/BottomNav'
import Home from './screens/Home'
import Series from './screens/Series'
import Jargon from './screens/Jargon'
import Placeholder from './screens/Placeholder'
import Progress from './screens/Progress'
import Session from './screens/Session'
import { JargonNavigationProvider } from './lib/JargonNavigation'

// L'app est une simple machine à onglets + un mode "session" plein écran pour le drill.
export default function App() {
  const [tab, setTab] = useState('home')
  const [sessionConfig, setSessionConfig] = useState(null) // null hors session, sinon { spot, group }
  const [refreshTick, setRefreshTick] = useState(0)
  const [jargonTermCore, setJargonTermCore] = useState(null)

  function startSession(config) {
    setSessionConfig(config)
  }

  function endSession() {
    setSessionConfig(null)
    setTab('home')
    setRefreshTick((t) => t + 1) // force Home/Progrès/Séries à relire le localStorage
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
        {sessionConfig ? (
          <Session config={sessionConfig} onFinish={endSession} />
        ) : (
          <>
            {tab === 'home' && (
              <Home key={refreshTick} onPlay={() => startSession({ spot: null, group: null })} onNavigate={setTab} />
            )}
            {tab === 'series' && <Series key={`s${refreshTick}`} onStart={startSession} />}
            {tab === 'charts' && (
              <Placeholder
                title="Charts"
                text="Les tables d'ouverture consultables arrivent bientôt."
                icon="cards"
              />
            )}
            {tab === 'jargon' && <Jargon highlightTerm={jargonTermCore} />}
            {tab === 'progress' && <Progress key={`p${refreshTick}`} />}
            <BottomNav active={tab} onChange={setTab} />
          </>
        )}
      </JargonNavigationProvider>
    </div>
  )
}
