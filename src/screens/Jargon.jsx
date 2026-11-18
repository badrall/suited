import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icons'
import { CATEGORIES, findTermByCore } from '../lib/jargon'

const CATEGORY_COLORS = {
  bases: 'var(--green)',
  actions: 'var(--blue)',
  positions: 'var(--violet)',
  mains: 'var(--gold)',
  metajeu: 'var(--rose)',
  tournois: 'var(--teal)',
}

const CATEGORY_ICONS = {
  bases: 'bulb',
  actions: 'target',
  positions: 'cards',
  mains: 'spade',
  metajeu: 'brain',
  tournois: 'star',
}

/** Écran "Le Jargon" : 6 catégories en accordéons + recherche en temps réel (nom et définition). */
export default function Jargon({ highlightTerm }) {
  const target = highlightTerm ? findTermByCore(highlightTerm) : null
  const [query, setQuery] = useState('')
  const [openCategory, setOpenCategory] = useState(target?.categoryId ?? null)
  const highlightRef = useRef(null)

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const isSearching = normalizedQuery.length > 0

  const filteredCategories = CATEGORIES.map((category) => ({
    ...category,
    entries: Object.entries(category.termes).filter(
      ([name, definition]) =>
        !isSearching || name.toLowerCase().includes(normalizedQuery) || definition.toLowerCase().includes(normalizedQuery),
    ),
  })).filter((category) => category.entries.length > 0)

  return (
    <div className="screen with-nav">
      <div className="topbar">
        <b>Le Jargon</b>
      </div>
      <p className="series-intro">Le vocabulaire du poker, expliqué simplement.</p>

      <div className="search">
        <Icon name="search" style={{ width: 18, height: 18 }} />
        <input
          type="text"
          placeholder="Chercher un terme…"
          aria-label="Chercher un terme"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filteredCategories.length === 0 && (
        <div className="jargon-empty">
          <Icon name="search" style={{ width: 28, height: 28 }} />
          <b>Aucun terme trouvé</b>
          <span>Essaie un autre mot, ou seulement le début du mot.</span>
        </div>
      )}

      {filteredCategories.map((category) => {
        const isOpen = isSearching || openCategory === category.id
        return (
          <div className={`cat${isOpen ? ' open' : ''}`} key={category.id} style={{ '--cat': CATEGORY_COLORS[category.id] }}>
            <button
              type="button"
              className="head"
              aria-expanded={isOpen}
              onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
            >
              <span className="cat-badge">
                <Icon name={CATEGORY_ICONS[category.id]} style={{ width: 18, height: 18 }} />
              </span>
              <span className="cat-name">{category.nom}</span>
              <span className="count">{category.entries.length}</span>
              <Icon name="back" className="ico chev" style={{ width: 18, height: 18 }} />
            </button>
            {isOpen && (
              <div className="terms">
                {category.entries.map(([name, definition]) => (
                  <div
                    className={`term${target?.key === name ? ' term-highlight' : ''}`}
                    key={name}
                    ref={target?.key === name ? highlightRef : undefined}
                  >
                    <b>{name}</b>
                    <span>{definition}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
