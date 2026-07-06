// Petit contexte pour que n'importe quel composant profondément imbriqué (Drill, Feedback, Séries...)
// puisse déclencher "Voir dans Le Jargon" sans faire remonter un callback à travers chaque écran
// intermédiaire qui n'en a lui-même pas besoin.

import { createContext, useContext } from 'react'

const JargonNavigationContext = createContext(() => {})

export function JargonNavigationProvider({ onNavigate, children }) {
  return <JargonNavigationContext.Provider value={onNavigate}>{children}</JargonNavigationContext.Provider>
}

/** Renvoie une fonction (query?: string) => void qui ouvre l'onglet Jargon, avec une recherche pré-remplie. */
export function useJargonNavigate() {
  return useContext(JargonNavigationContext)
}
