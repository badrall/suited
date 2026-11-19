import { useState } from 'react'
import { PREMIUM_OFFERS } from '../lib/premium'

const COPY = {
  'daily-limit': {
    title: 'Tu as fait ta session du jour',
    subtitle: "Passe en illimité pour t'entraîner autant que tu veux.",
  },
  'premium-spot': {
    title: 'Le spot vs 3-bet est premium',
    subtitle: "Débloque tous les spots et l'entraînement illimité.",
  },
  'premium-feature': {
    title: 'Fonctionnalité premium',
    subtitle: "Débloque ce mode et l'entraînement illimité.",
  },
}

/**
 * Paywall réutilisable : overlay plein écran avec les 3 offres. Les achats ne sont pas encore branchés.
 * Props : reason ('daily-limit' | 'premium-spot' | 'premium-feature'), onClose.
 */
export default function Paywall({ reason, onClose }) {
  const [notice, setNotice] = useState('')
  const copy = COPY[reason] ?? COPY['premium-feature']

  // TODO RevenueCat : lancer l'achat de l'offre `id`, puis setPremium(true) à la validation.
  function onSubscribe(id) {
    console.log('Paywall : offre choisie', id)
    setNotice('Les achats arriveront bientôt')
  }

  return (
    <div className="paywall-overlay" role="dialog" aria-modal="true" aria-label={copy.title}>
      <div className="card light paywall-card">
        <h2 className="paywall-title">{copy.title}</h2>
        <p className="paywall-sub">{copy.subtitle}</p>

        <div className="paywall-offers">
          {PREMIUM_OFFERS.map((offer) => (
            <button key={offer.id} type="button" className="paywall-offer" onClick={() => onSubscribe(offer.id)}>
              <span className="po-label">
                {offer.label}
                {offer.note && <em className="po-note">{offer.note}</em>}
              </span>
              <span className="po-price">{offer.price}</span>
              <span className="po-period">{offer.period}</span>
            </button>
          ))}
        </div>

        <p className="paywall-notice" aria-live="polite">
          {notice}
        </p>

        <button type="button" className="btn ghost" onClick={onClose}>
          Plus tard
        </button>
      </div>
    </div>
  )
}
