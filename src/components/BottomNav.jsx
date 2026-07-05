import { Icon } from './Icons'

const TABS = [
  { key: 'home', label: 'ACCUEIL', icon: 'home' },
  { key: 'series', label: 'SÉRIES', icon: 'target' },
  { key: 'charts', label: 'CHARTS', icon: 'cards' },
  { key: 'jargon', label: 'JARGON', icon: 'book' },
  { key: 'progress', label: 'PROGRÈS', icon: 'chart' },
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
