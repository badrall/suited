import { RANKS } from '../lib/hands'

// Mêmes couleurs que les boutons du drill : FOLD = rouge, CALL = bleu, RAISE/3-BET/4-BET = vert (action « forte »).
// "hidden" : case neutre (non colorée) — utilisée par le mode Quiz de Charts avant révélation.
export const ACTION_COLOR = {
  raise: 'var(--green)',
  '3bet': 'var(--green)',
  '4bet': 'var(--green)',
  call: 'var(--blue)',
  fold: 'var(--red)',
  hidden: 'rgba(255, 255, 255, 0.07)',
}
const ACTION_TEXT_COLOR = { raise: '#fff', '3bet': '#fff', '4bet': '#fff', call: '#fff', fold: '#fff', hidden: 'var(--text-muted)' }

// Convention standard : diagonale = paires ; au-dessus = suitées (ligne haute x colonne basse) ; en dessous = off-suit.
function notationForCell(rowIndex, colIndex) {
  if (rowIndex === colIndex) return RANKS[rowIndex] + RANKS[rowIndex]
  if (rowIndex < colIndex) return RANKS[rowIndex] + RANKS[colIndex] + 's'
  return RANKS[colIndex] + RANKS[rowIndex] + 'o'
}

/**
 * Matrice 13×13 des mains de poker, réutilisable et purement d'affichage : la couleur de chaque case
 * vient de getAction(notation), jamais recalculée ici (une seule source de vérité : correctActionFor).
 */
export default function RangeMatrix({ getAction, frontierSet, selected, onCellTap }) {
  return (
    <div className="range-matrix">
      <div className="range-row">
        <span className="range-corner" />
        {RANKS.map((r) => (
          <span className="range-col-label" key={r}>
            {r}
          </span>
        ))}
      </div>
      {RANKS.map((rowRank, i) => (
        <div className="range-row" key={rowRank}>
          <span className="range-row-label">{rowRank}</span>
          {RANKS.map((_, j) => {
            const notation = notationForCell(i, j)
            const action = getAction(notation)
            return (
              <button
                key={notation}
                type="button"
                className={`range-cell${frontierSet.has(notation) ? ' range-frontier' : ''}${selected === notation ? ' range-selected' : ''}`}
                style={{ background: ACTION_COLOR[action], color: ACTION_TEXT_COLOR[action] }}
                onClick={() => onCellTap(notation, action)}
              >
                {notation}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
