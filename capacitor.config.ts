import type { CapacitorConfig } from '@capacitor/cli'

// Capacitor ne fait que charger le build Vite (dist) dans une coquille native iOS/Android.
// Couleur de fond = token --bg du design system (src/index.css).
const config: CapacitorConfig = {
  appId: 'app.suited.poker',
  appName: 'Suited',
  webDir: 'dist',
  backgroundColor: '#0f2033',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#0f2033',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK', // « DARK » = texte clair, pour un fond sombre
      backgroundColor: '#0f2033',
    },
  },
}

export default config
