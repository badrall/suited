import { Icon } from './Icons'

/** En-tête du niveau 2 d'un écran : flèche retour, titre serif, et un élément optionnel à droite. */
export default function BackHeader({ title, onBack, right }) {
  return (
    <div className="subnav">
      <button type="button" className="back-btn" onClick={onBack} aria-label="Retour">
        <Icon name="back" style={{ width: 22, height: 22 }} />
      </button>
      <b>{title}</b>
      {right}
    </div>
  )
}
