// Génération de mains, notation, sièges et lookups poker (169 combos, préflop 9-max).
// Couvre 3 spots : open-raise, défense de BB, face à un 3-bet.

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
export const SUITS = ['♠', '♥', '♦', '♣']
export const RED_SUITS = new Set(['♥', '♦'])

export const POSITION_GROUPS = ['EP', 'MP', 'CO', 'BTN', 'SB']
// Groupes utilisés pour la maîtrise par position : les 5 positions d'open + BB (uniquement en défense).
export const ALL_HERO_GROUPS = [...POSITION_GROUPS, 'BB']

export const SPOTS = ['open', 'bb_defense', 'vs_3bet']
export const SPOT_LABELS = {
  open: 'Open-raise',
  bb_defense: 'Défense de BB',
  vs_3bet: 'Face à un 3-bet',
}

export const POSITION_LABELS = {
  EP: 'PREMIÈRE POSITION',
  MP: 'MILIEU DE TABLE',
  CO: 'CUTOFF',
  BTN: 'BOUTON',
  SB: 'SMALL BLIND',
}

// Ordre des 9 sièges autour de la table (utilisé par PokerTable et pour tirer un siège adverse).
export const SEATS_ORDER = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']

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
  BB: 'BIG BLIND',
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
  BB: 'en BIG BLIND',
}

// Bascule un groupe d'ouverture vers le "bucket" utilisé par ranges-defense-bb-et-vs-3bet.json (vs_3bet).
const VS3BET_BUCKET = { EP: 'open_EP_MP', MP: 'open_EP_MP', CO: 'open_CO_BTN', BTN: 'open_CO_BTN', SB: 'open_SB' }

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

/** Choisit un siège concret à l'intérieur d'un groupe (ex: EP -> UTG+1). */
export function pickSeatForGroup(group) {
  const seats = SEATS_BY_GROUP[group]
  return seats[Math.floor(Math.random() * seats.length)]
}

/** Choisit un siège au hasard parmi les 9, en excluant un siège donné (utilisé pour le 3-betteur adverse). */
export function pickRandomOtherSeat(excludeSeat) {
  const options = SEATS_ORDER.filter((s) => s !== excludeSeat)
  return options[Math.floor(Math.random() * options.length)]
}

export function seatLabel(seat) {
  return SEAT_LABELS[seat] ?? seat
}

export function seatPhrase(seat) {
  return SEAT_PHRASES[seat] ?? seatLabel(seat)
}

// --- 169 combos + tirage pondéré -------------------------------------------------

/** Les 169 notations canoniques (13 paires + 78 suitées + 78 offsuit), indépendamment des JSON de ranges. */
export const ALL_NOTATIONS = (() => {
  const list = []
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = i; j < RANKS.length; j++) {
      if (i === j) list.push(RANKS[i] + RANKS[j])
      else {
        list.push(RANKS[i] + RANKS[j] + 's')
        list.push(RANKS[i] + RANKS[j] + 'o')
      }
    }
  }
  return list
})()

const RANK_STRENGTH = Object.fromEntries(RANKS.map((r, i) => [r, RANKS.length - i])) // A=13 ... 2=1

function parseNotation(notation) {
  if (notation.length === 2) return { r1: notation[0], r2: notation[0], suited: false, pair: true }
  return { r1: notation[0], r2: notation[1], suited: notation[2] === 's', pair: false }
}

// Approximation pédagogique (pas une classification GTO) : sert juste à rendre AA/KK et les pires
// mains off-suit (72o, 82o, 93o...) plus rares à l'entraînement, puisqu'elles n'apprennent rien.
function isTrivial(notation) {
  const { r1, r2, suited, pair } = parseNotation(notation)
  if (pair && RANK_STRENGTH[r1] >= RANK_STRENGTH.K) return true // AA, KK
  if (!pair && !suited) {
    const hi = Math.max(RANK_STRENGTH[r1], RANK_STRENGTH[r2])
    const lo = Math.min(RANK_STRENGTH[r1], RANK_STRENGTH[r2])
    if (hi <= RANK_STRENGTH['9'] && hi - lo >= 4) return true // junk du type 72o, 82o, 93o...
  }
  return false
}

/** Poids de tirage d'une notation : ~3x plus pour les mains frontières, réduit pour les mains triviales. */
export function weightFor(notation, frontierSet) {
  if (frontierSet.has(notation)) return 3
  if (isTrivial(notation)) return 0.25
  return 1
}

/** Tirage pondéré générique parmi une liste, selon une fonction de poids. */
export function weightedChoice(items, weightFn) {
  const weights = items.map(weightFn)
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

// --- Contextes (spot + position) --------------------------------------------------

/**
 * Liste les contextes (spot + position héros + clé de lookup) éligibles pour un filtre de Séries.
 * filter: { spot: 'open'|'bb_defense'|'vs_3bet'|null, group: 'EP'|'MP'|'CO'|'BTN'|'SB'|'BB'|'Blinds'|null }
 */
export function eligibleContexts(filter = {}) {
  const { spot: spotFilter, group: groupFilter } = filter
  const groups =
    groupFilter === 'Blinds' ? ['SB', 'BB'] : groupFilter ? [groupFilter] : [...POSITION_GROUPS, 'BB']
  const spots = spotFilter ? [spotFilter] : SPOTS
  const contexts = []
  for (const spot of spots) {
    if (spot === 'open') {
      for (const g of groups) if (POSITION_GROUPS.includes(g)) contexts.push({ spot, group: g, contextKey: g })
    }
    if (spot === 'bb_defense' && groups.includes('BB')) {
      for (const openerGroup of POSITION_GROUPS) {
        contexts.push({ spot, group: 'BB', contextKey: `vs_${openerGroup}` })
      }
    }
    if (spot === 'vs_3bet') {
      for (const g of groups) if (POSITION_GROUPS.includes(g)) contexts.push({ spot, group: g, contextKey: VS3BET_BUCKET[g] })
    }
  }
  return contexts
}

function getFrontierSet(spot, contextKey, rangesOpenData, rangesDefenseData) {
  if (spot === 'open') {
    const d = rangesOpenData.positions[contextKey]
    return new Set([...d.frontier_raise, ...d.frontier_fold])
  }
  if (spot === 'bb_defense') {
    const d = rangesDefenseData.bb_defense[contextKey]
    return new Set([...d.frontier_3bet, ...d.frontier_call, ...d.frontier_fold])
  }
  const d = rangesDefenseData.vs_3bet[contextKey]
  return new Set([...d.frontier_4bet, ...d.frontier_call, ...d.frontier_fold])
}

/** Détermine la bonne action pour une main, selon le spot et la structure réelle du JSON concerné. */
export function correctActionFor(spot, contextKey, notation, rangesOpenData, rangesDefenseData) {
  if (spot === 'open') {
    return rangesOpenData.positions[contextKey].raise.includes(notation) ? 'raise' : 'fold'
  }
  if (spot === 'bb_defense') {
    const d = rangesDefenseData.bb_defense[contextKey]
    if (d['3bet'].includes(notation)) return '3bet'
    if (d.call.includes(notation)) return 'call'
    return 'fold'
  }
  const d = rangesDefenseData.vs_3bet[contextKey]
  if (d['4bet'].includes(notation)) return '4bet'
  if (d.call.includes(notation)) return 'call'
  return 'fold'
}

/**
 * Boutons de réponse à afficher pour un spot donné.
 * En open-raise, CALL reste affiché même si ce n'est jamais la bonne réponse : c'est le piège du
 * limp, qu'on veut volontairement laisser le débutant tester (feedback dédié à la clé).
 */
export function buttonsForSpot(spot) {
  if (spot === 'open') {
    return [
      { action: 'fold', label: 'FOLD', cls: 'r' },
      { action: 'call', label: 'CALL', cls: 'b' },
      { action: 'raise', label: 'RAISE', cls: 'g' },
    ]
  }
  if (spot === 'bb_defense') {
    return [
      { action: 'fold', label: 'FOLD', cls: 'r' },
      { action: 'call', label: 'CALL', cls: 'b' },
      { action: '3bet', label: '3-BET', cls: 'g' },
    ]
  }
  return [
    { action: 'fold', label: 'FOLD', cls: 'r' },
    { action: 'call', label: 'CALL', cls: 'b' },
    { action: '4bet', label: '4-BET', cls: 'g' },
  ]
}

/** Texte du sizing conseillé (encart doré), ou null si le spot/l'action ne s'y prête pas. */
export function sizingNote(spot, correctAction) {
  if (spot === 'open' && correctAction === 'raise') {
    return 'En live, ouvre à 4bb (20 € à 2/5) — les petits sizings ne font folder personne.'
  }
  if (spot === 'bb_defense' && correctAction === '3bet') {
    return "En live, 3-bette à environ 3x l'open (12bb face à un open à 4bb) : assez gros pour retirer la cote aux mains marginales."
  }
  if (spot === 'vs_3bet' && correctAction === '4bet') {
    return 'En live, 4-bette à 2,2-2,5x le 3-bet adverse — assez gros pour ne laisser aucune cote de suite.'
  }
  return null
}

function genericExplanation(spot, contextKey, group, correctAction) {
  if (spot === 'open') {
    const label = POSITION_LABELS[group]
    return correctAction === 'raise'
      ? `Main assez forte pour ouvrir depuis ${label} : sur la durée, elle rapporte plus qu'elle ne coûte.`
      : `Main trop faible pour ouvrir depuis ${label} : elle perd de la valeur plus souvent qu'elle n'en gagne ici.`
  }
  if (spot === 'bb_defense') {
    const openerLabel = POSITION_LABELS[contextKey.replace('vs_', '')]
    const actionLabel = { '3bet': 'un 3-bet', call: 'un call', fold: 'un fold' }[correctAction]
    return `Face à un open depuis ${openerLabel}, cette main justifie ${actionLabel} depuis la BB.`
  }
  const label = POSITION_LABELS[group]
  const actionLabel = { '4bet': 'un 4-bet', call: 'un call', fold: 'un fold' }[correctAction]
  return `Après ton open en ${label} suivi d'un 3-bet, cette main justifie ${actionLabel}.`
}

/** Renvoie { action, text } pour le feedback, avec repli générique si la main n'est pas référencée. */
export function getExplanation(
  spot,
  group,
  contextKey,
  notation,
  explicationsOpenData,
  explicationsSpotsData,
  correctAction,
) {
  let entry
  if (spot === 'open') entry = explicationsOpenData[contextKey]?.[notation]
  else if (spot === 'bb_defense') entry = explicationsSpotsData.bb_defense[contextKey]?.[notation]
  else entry = explicationsSpotsData.vs_3bet[contextKey]?.[notation]
  if (entry) return entry
  return { action: correctAction, text: genericExplanation(spot, contextKey, group, correctAction) }
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

// --- Génération des questions (avec répétition espacée) --------------------------

function parseSrsKey(key) {
  const [spot, group, contextKey, notation] = key.split('|')
  return { spot, group, contextKey, notation }
}

function assembleQuestion(spot, group, contextKey, notation, rangesOpenData, rangesDefenseData) {
  const cards = cardsForNotation(notation)
  const correctAction = correctActionFor(spot, contextKey, notation, rangesOpenData, rangesDefenseData)
  if (spot === 'open') {
    const seat = pickSeatForGroup(group)
    return { spot, group, contextKey, seat, notation, cards, correctAction }
  }
  if (spot === 'bb_defense') {
    const openerGroup = contextKey.replace('vs_', '')
    const openerSeat = pickSeatForGroup(openerGroup)
    return { spot, group, contextKey, seat: 'BB', openerSeat, notation, cards, correctAction }
  }
  const seat = pickSeatForGroup(group)
  const villainSeat = pickRandomOtherSeat(seat)
  return { spot, group, contextKey, seat, villainSeat, notation, cards, correctAction }
}

/**
 * Choisit la prochaine question d'une session : priorité aux mains dues en répétition espacée
 * (parmi les contextes éligibles au filtre), sinon tirage pondéré frais.
 * srsMap / totalAnswered viennent de storage.loadState() (lus par l'appelant, pas importés ici
 * pour éviter un import circulaire avec storage.js).
 */
export function generateNextQuestion(config, srsMap, totalAnswered, rangesOpenData, rangesDefenseData) {
  let contexts = eligibleContexts(config)
  if (contexts.length === 0) contexts = eligibleContexts({}) // filet de sécurité si le filtre est dégénéré

  const due = Object.entries(srsMap)
    .map(([key, item]) => ({ ...parseSrsKey(key), ...item }))
    .filter((item) => item.dueAt <= totalAnswered)
    .filter((item) => contexts.some((c) => c.spot === item.spot && c.contextKey === item.contextKey))

  if (due.length) {
    const chosen = due[Math.floor(Math.random() * due.length)]
    return assembleQuestion(chosen.spot, chosen.group, chosen.contextKey, chosen.notation, rangesOpenData, rangesDefenseData)
  }

  const ctx = contexts[Math.floor(Math.random() * contexts.length)]
  const frontierSet = getFrontierSet(ctx.spot, ctx.contextKey, rangesOpenData, rangesDefenseData)
  const notation = weightedChoice(ALL_NOTATIONS, (n) => weightFor(n, frontierSet))
  return assembleQuestion(ctx.spot, ctx.group, ctx.contextKey, notation, rangesOpenData, rangesDefenseData)
}
