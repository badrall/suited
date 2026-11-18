import { Icon } from './Icons'

const TABS = [
  { key: 'home', label: 'Accueil', icon: 'nav-home' },
  { key: 'series', label: 'Séries', icon: 'nav-series' },
  { key: 'charts', label: 'Charts', icon: 'nav-charts' },
  { key: 'jargon', label: 'Jargon', icon: 'nav-jargon' },
  { key: 'progress', label: 'Progrès', icon: 'nav-progress' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="nav">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={tab.key === active ? 'on' : ''}
          onClick={() => onChange(tab.key)}
        >
          <Icon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
