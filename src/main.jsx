import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.jsx'
import { applyPremiumUrlOverride } from './lib/premium'

// Override de test du flag premium via ?premium=on|off (une seule fois, avant le rendu).
applyPremiumUrlOverride()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Initialisation native (Capacitor) : uniquement dans l'app iOS/Android, jamais sur le web.
// Les plugins sont importés dynamiquement pour ne rien charger côté web.
if (Capacitor.isNativePlatform()) {
  Promise.all([import('@capacitor/status-bar'), import('@capacitor/splash-screen')])
    .then(async ([{ StatusBar, Style }, { SplashScreen }]) => {
      // Texte clair sur fond sombre (token --bg).
      await StatusBar.setStyle({ style: Style.Dark })
      if (Capacitor.getPlatform() === 'android') await StatusBar.setBackgroundColor({ color: '#0f2033' })
      // Après le premier rendu : on retire le splash.
      requestAnimationFrame(() => SplashScreen.hide())
    })
    .catch((err) => console.warn('Init native Capacitor impossible', err))
}
