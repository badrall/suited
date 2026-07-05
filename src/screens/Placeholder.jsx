import { Icon } from '../components/Icons'

/** Écran "Bientôt" propre pour Séries / Charts / Jargon (non développés dans ce premier jet). */
export default function Placeholder({ title, text, icon }) {
  return (
    <div className="screen">
      <div className="topbar">
        <b style={{ fontSize: 17, fontWeight: 900 }}>{title}</b>
      </div>
      <div className="placeholder">
        <Icon name={icon} />
        <h3>Bientôt</h3>
        <p>{text}</p>
      </div>
    </div>
  )
}
