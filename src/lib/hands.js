// Génération de mains, notation et lookups poker (169 combos, préflop 9-max).

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
export const SUITS = ['♠', '♥', '♦', '♣']
export const RED_SUITS = new Set(['♥', '♦'])

export const POSITION_GROUPS = ['EP', 'MP', 'CO', 'BTN', 'SB']

export const POSITION_LABELS = {
  EP: 'PREMIÈRE POSITION',
  MP: 'MILIEU DE TABLE',
  CO: 'CUTOFF',
  BTN: 'BOUTON',
  SB: 'SMALL BLIND',
}

// Sièges concrets par groupe, pour l'affichage de la table 9-max.
const SEATS_BY_GROUP = {
  EP: ['UTG', 'UTG+1', 'UTG+2'],
  MP: ['LJ', 'HJ'],
  CO: ['CO'],
  BTN: ['BTN'],
  SB: ['SB'],
}

const SEAT_LABELS = {
  UTG: 'UTG',
  'UTG+1': 'UTG+1',
  'UTG+2': 'UTG+2',
  LJ: 'LOJACK',
  HJ: 'HIJACK',
  CO: 'CUTOFF',
  BTN: 'BOUTON',
  SB: 'SMALL BLIND',
}


/** Génère 2 cartes concrètes correspondant à une notation ("A9s" -> As 9s par ex). */
export function cardsForNotation(notation) {
  if (notation.length === 2) {
    const rank = notation[0]
    const suits = [...SUITS].sort(() => Math.random() - 0.5)
    return [
      { rank, suit: suits[0] },
      { rank, suit: suits[1] },
    ]
  }
  const [r1, r2, type] = notation
  if (type === 's') {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)]
    return [
      { rank: r1, suit },
      { rank: r2, suit },
    ]
  }
  const suit1 = SUITS[Math.floor(Math.random() * SUITS.length)]
  const rest = SUITS.filter((s) => s !== suit1)
  const suit2 = rest[Math.floor(Math.random() * rest.length)]
  return [
    { rank: r1, suit: suit1 },
    { rank: r2, suit: suit2 },
  ]
}

/** Choisit un groupe de position au hasard (mix de session). */
export function pickPositionGroup() {
  return POSITION_GROUPS[Math.floor(Math.random() * POSITION_GROUPS.length)]
}

/** Choisit un siège concret à l'intérieur d'un groupe (ex: EP -> UTG+1). */
export function pickSeatForGroup(group) {
  const seats = SEATS_BY_GROUP[group]
  return seats[Math.floor(Math.random() * seats.length)]
}

export function seatLabel(seat) {
  return SEAT_LABELS[seat] ?? seat
}

// Article correct pour la phrase de contexte ("Tu es {phrase} · 100bb ...").
const SEAT_PHRASES = {
  UTG: 'en UTG',
  'UTG+1': 'en UTG+1',
  'UTG+2': 'en UTG+2',
  LJ: 'en LOJACK',
  HJ: 'en HIJACK',
  CO: 'au CUTOFF',
  BTN: 'au BOUTON',
  SB: 'en SMALL BLIND',
}

export function seatPhrase(seat) {
  return SEAT_PHRASES[seat] ?? seatLabel(seat)
}

/**
 * Tire une main pour un groupe de position donné.
 * 65% du temps : une main "frontière" (celles qui ont une explication pédagogique dédiée).
 * 35% du temps : une main au hasard parmi celles référencées dans equites-preflop.json,
 * pour varier l'exposition tout en garantissant que "LA STAT" du feedback est toujours disponible.
 */
export function pickHandForPosition(group, rangesData, equitesData) {
  const posData = rangesData.positions[group]
  const frontier = [...posData.frontier_raise, ...posData.frontier_fold]
  if (frontier.length && Math.random() < 0.65) {
    const notation = frontier[Math.floor(Math.random() * frontier.length)]
    return { notation, cards: cardsForNotation(notation) }
  }
  const known = Object.keys(equitesData.equites)
  const notation = known[Math.floor(Math.random() * known.length)]
  return { notation, cards: cardsForNotation(notation) }
}

export function correctActionFor(group, notation, rangesData) {
  return rangesData.positions[group].raise.includes(notation) ? 'raise' : 'fold'
}

/** Génère les N mains d'une session : position + siège + main + cartes + bonne action. */
export function generateSessionHands(rangesData, equitesData, count = 10) {
  const questions = []
  for (let i = 0; i < count; i++) {
    const group = pickPositionGroup()
    const seat = pickSeatForGroup(group)
    const { notation, cards } = pickHandForPosition(group, rangesData, equitesData)
    const correctAction = correctActionFor(group, notation, rangesData)
    questions.push({ group, seat, notation, cards, correctAction })
  }
  return questions
}

function genericExplanation(group, correctAction) {
  const label = POSITION_LABELS[group]
  return correctAction === 'raise'
    ? `Main assez forte pour ouvrir depuis ${label} : sur la durée, elle rapporte plus qu'elle ne coûte.`
    : `Main trop faible pour ouvrir depuis ${label} : elle perd de la valeur plus souvent qu'elle n'en gagne ici.`
}

/** Renvoie { action, text } pour le feedback, avec repli générique si la main n'est pas référencée. */
export function getExplanation(group, notation, explicationsData, correctAction) {
  const entry = explicationsData[group]?.[notation]
  if (entry) return entry
  return { action: correctAction, text: genericExplanation(group, correctAction) }
}

export function getEquity(notation, equitesData) {
  return equitesData.equites[notation]
}

/** Renvoie l'équité de la main "jumelle" (suité <-> off-suit) pour la comparaison pédagogique. */
export function getTwin(notation, equitesData) {
  if (notation.length !== 3) return null
  const base = notation.slice(0, 2)
  const twinType = notation[2] === 's' ? 'o' : 's'
  const twinNotation = base + twinType
  const equity = equitesData.equites[twinNotation]
  if (equity === undefined) return null
  return { notation: twinNotation, equity }
}
