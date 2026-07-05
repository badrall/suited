import { useState } from 'react'
import { IconSprite } from './components/Icons'
import BottomNav from './components/BottomNav'
import Home from './screens/Home'
import Placeholder from './screens/Placeholder'
import Progress from './screens/Progress'
import Session from './screens/Session'

// L'app est une simple machine à onglets + un mode "session" plein écran pour le drill.
export default function App() {
  const [tab, setTab] = useState('home')
  const [inSession, setInSession] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  function startSession() {
    setInSession(true)
  }

  function endSession() {
    setInSession(false)
    setTab('home')
    setRefreshTick((t) => t + 1) // force Home/Progrès à relire le localStorage
  }

  return (
    <div className="app-shell">
      <IconSprite />
      {inSession ? (
        <Session onFinish={endSession} />
      ) : (
        <>
          {tab === 'home' && <Home key={refreshTick} onPlay={startSession} onNavigate={setTab} />}
          {tab === 'series' && (
            <Placeholder
              title="Séries"
              text="Les parcours par position et par situation arrivent bientôt."
              icon="target"
            />
          )}
          {tab === 'charts' && (
            <Placeholder
              title="Charts"
              text="Les tables d'ouverture consultables arrivent bientôt."
              icon="cards"
            />
          )}
          {tab === 'jargon' && (
            <Placeholder
              title="Le Jargon"
              text="Le lexique du poker en clair arrive bientôt."
              icon="book"
            />
          )}
          {tab === 'progress' && <Progress key={`p${refreshTick}`} />}
          <BottomNav active={tab} onChange={setTab} />
        </>
      )}
    </div>
  )
}
