// Moteur du glossaire : segmentation de texte en portions "cliquables" (termes détectés) + mot du jour.
// Détection stricte : mots entiers uniquement (jamais en sous-chaîne), et les abréviations courtes
// (UTG, EP, MP, CO, HJ, EV, bb...) sont sensibles à la casse pour ne jamais matcher par accident
// (ex: "CO" ne doit jamais matcher dans "COMPRIS" ou "contre").

import glossaryData from '../data/glossaire-jargon.json'

export const CATEGORIES = glossaryData.categories

const BY_KEY = new Map()
const ALL_TERMS = []

for (const category of glossaryData.categories) {
  for (const [key, definition] of Object.entries(category.termes)) {
    const core = key.replace(/\s*\([^)]*\)\s*$/, '').trim()
    const info = { key, displayName: key, definition, categoryId: category.id, core }
    BY_KEY.set(key, info)
    ALL_TERMS.push(info)
  }
}

// Abréviations qui ne doivent JAMAIS matcher hors de leur casse exacte (protège "BB" vs "bb", etc.).
const CASE_SENSITIVE_ONLY = new Set(['UTG', 'EP', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB', 'IP', 'OOP', 'EV', 'GTO', 'MTT', 'ITM', 'ICM', 'bb'])

// Formes fléchies explicitement demandées : le nom du terme seul ne suffit pas à couvrir l'usage réel.
const MANUAL_VARIANT_GROUPS = [
  {
    key: 'Fold',
    forms: ['Fold', 'fold', 'Folder', 'folder', 'Foldé', 'foldé', 'Foldée', 'foldée', 'Folde', 'folde', 'Couché', 'couché', 'Couchée', 'couchée'],
  },
  { key: '3-bet', forms: ['3-bet', '3-bette', '3-better', '3-betté', '3-bettée', '3-bettent', '3-bettes'] },
  { key: '4-bet', forms: ['4-bet', '4-bette', '4-better', '4-betté', '4-bettée', '4-bettent'] },
  { key: 'Suité (s)', forms: ['Suité', 'suité', 'Suitée', 'suitée', 'Suités', 'suités', 'Suitées', 'suitées'] },
  {
    key: 'Open (open-raise)',
    forms: ['Open', 'open', 'Open-raise', 'open-raise', 'Ouvre', 'ouvre', 'Ouvert', 'ouvert', 'Ouverture', 'ouverture', 'Ouvrir', 'ouvrir', 'Ouvrent', 'ouvrent'],
  },
  { key: 'TAG / LAG', forms: ['TAG', 'LAG'] },
]

const manualKeys = new Set(MANUAL_VARIANT_GROUPS.map((g) => g.key))

// variante littérale exacte -> infos du terme (une seule table, entièrement sensible à la casse :
// c'est ce qui permet à "Fold"/"fold" de matcher largement tout en gardant "CO" strictement exact).
const VARIANT_LOOKUP = new Map()

for (const group of MANUAL_VARIANT_GROUPS) {
  const info = BY_KEY.get(group.key)
  for (const form of group.forms) VARIANT_LOOKUP.set(form, info)
}

for (const info of ALL_TERMS) {
  if (manualKeys.has(info.key)) continue
  VARIANT_LOOKUP.set(info.core, info)
  if (!CASE_SENSITIVE_ONLY.has(info.core)) {
    const lower = info.core.charAt(0).toLowerCase() + info.core.slice(1)
    if (lower !== info.core) VARIANT_LOOKUP.set(lower, info)
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Un seul regex combiné (pas une boucle par terme) : les alternatives les plus longues sont essayées
// en premier, ce qui règle naturellement les préfixes partagés ("Check" vs "Check-raise", "Fold" vs
// "Fold equity"...). Limites de mot Unicode-safe (\p{L}) pour ne pas casser les accents (Équité, Suité).
const MASTER_REGEX = (() => {
  const patterns = [...VARIANT_LOOKUP.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp)
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${patterns.join('|')})(?![\\p{L}\\p{N}_])`, 'gu')
})()

/**
 * Découpe un texte en segments { type: 'text', content } | { type: 'term', content, term }.
 * Ne rend cliquable que la PREMIÈRE occurrence d'un terme donné dans ce texte.
 */
export function splitIntoSegments(text) {
  if (!text) return [{ type: 'text', content: text ?? '' }]

  const segments = []
  const seen = new Set()
  let lastIndex = 0
  MASTER_REGEX.lastIndex = 0
  let match = MASTER_REGEX.exec(text)
  while (match !== null) {
    const raw = match[0]
    const start = match.index
    const end = start + raw.length
    if (start > lastIndex) segments.push({ type: 'text', content: text.slice(lastIndex, start) })

    const term = VARIANT_LOOKUP.get(raw)
    if (term && !seen.has(term.key)) {
      seen.add(term.key)
      segments.push({ type: 'term', content: raw, term })
    } else {
      segments.push({ type: 'text', content: raw })
    }
    lastIndex = end
    match = MASTER_REGEX.exec(text)
  }
  if (lastIndex < text.length) segments.push({ type: 'text', content: text.slice(lastIndex) })
  return segments
}

/** Retrouve un terme par son "core" (ex: "CO", "Fold") — utilisé pour le deep-link "Voir dans Le Jargon". */
export function findTermByCore(core) {
  return ALL_TERMS.find((t) => t.core === core)
}

/** Choisit un terme du glossaire de façon déterministe pour une date donnée (stable dans la journée). */
export function pickTermOfDay(date = new Date()) {
  const seed = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return ALL_TERMS[hash % ALL_TERMS.length]
}
