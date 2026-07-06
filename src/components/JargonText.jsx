import { useMemo, useState } from 'react'
import { splitIntoSegments } from '../lib/jargon'
import { useJargonNavigate } from '../lib/JargonNavigation'

/**
 * Rend un texte en soulignant (pointillé, discret) les termes du glossaire qu'il contient.
 * Un tap ouvre une mini-popup (définition + lien vers Le Jargon) ; un tap n'importe où la referme.
 * À utiliser partout où du texte pédagogique s'affiche — jamais sur les libellés de boutons d'action.
 *
 * Tout est rendu en <span> (jamais <button>/<p>/<div>) : ce composant doit pouvoir s'insérer aussi
 * bien dans un <p> (Feedback, SessionEnd — contenu phrasing uniquement) que dans un <button> (tuiles
 * Séries). Un <button> ou <div> imbriqué y casserait le HTML et le clic remonterait au parent.
 */
export default function JargonText({ text }) {
  const segments = useMemo(() => splitIntoSegments(text), [text])
  const [openKey, setOpenKey] = useState(null)
  const goToJargon = useJargonNavigate()

  if (!text) return null

  function openLink(term) {
    setOpenKey(null)
    goToJargon(term.core)
  }

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === 'text') return <span key={i}>{segment.content}</span>

        const isOpen = openKey === segment.term.key
        return (
          <span
            key={i}
            className="jargon-term"
            onClick={(e) => {
              e.stopPropagation()
              setOpenKey(isOpen ? null : segment.term.key)
            }}
          >
            {segment.content}
            {isOpen && (
              <span className="jargon-popup" onClick={(e) => e.stopPropagation()}>
                <b>{segment.term.displayName}</b>
                <span className="jargon-popup-def">{segment.term.definition}</span>
                <span
                  className="link"
                  role="button"
                  tabIndex={0}
                  onClick={() => openLink(segment.term)}
                  onKeyDown={(e) => e.key === 'Enter' && openLink(segment.term)}
                >
                  Voir dans Le Jargon
                </span>
              </span>
            )}
          </span>
        )
      })}
      {openKey && <span className="jargon-backdrop" onClick={() => setOpenKey(null)} />}
    </>
  )
}
