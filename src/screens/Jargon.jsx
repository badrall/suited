import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icons'
import { CATEGORIES, findTermByCore } from '../lib/jargon'

const CATEGORY_COLORS = {
  bases: 'var(--green)',
  actions: 'var(--blue)',
  positions: 'var(--purple)',
  mains: 'var(--orange)',
  metajeu: '#FF6DA3',
  tournois: '#00C2B8',
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
        <b style={{ fontSize: 17, fontWeight: 900 }}>Le Jargon</b>
      </div>

      <div className="search">
        <Icon name="search" style={{ width: 16, height: 16 }} />
        <input type="text" placeholder="Chercher un terme…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {filteredCategories.length === 0 && (
        <small style={{ fontWeight: 800, color: 'var(--gray)' }}>Aucun terme ne correspond à ta recherche.</small>
      )}

      {filteredCategories.map((category) => {
        const isOpen = isSearching || openCategory === category.id
        return (
          <div className="cat" key={category.id} style={{ borderLeftColor: CATEGORY_COLORS[category.id] }}>
            <button
              type="button"
              className="head"
              onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
            >
              <span>{category.nom}</span>
              <span className="count">
                {category.entries.length} {isOpen ? '▾' : '▸'}
              </span>
            </button>
            {isOpen &&
              category.entries.map(([name, definition]) => (
                <div
                  className={`term${target?.key === name ? ' term-highlight' : ''}`}
                  key={name}
                  ref={target?.key === name ? highlightRef : undefined}
                >
                  <b>{name}</b> — {definition}
                </div>
              ))}
          </div>
        )
      })}
    </div>
  )
}
