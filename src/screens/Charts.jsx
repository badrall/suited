import { useState } from 'react'
import { Icon } from '../components/Icons'
import BackHeader from '../components/BackHeader'
import ProgressBar from '../components/ProgressBar'
import RangeMatrix, { ACTION_COLOR } from '../components/RangeMatrix'
import rangesOpenData from '../data/ranges-open-raise-9max-live.json'
import rangesDefenseData from '../data/ranges-defense-bb-et-vs-3bet.json'
import {
  SPOTS,
  SPOT_LABELS,
  POSITION_GROUPS,
  VS3BET_BUCKET,
  correctActionFor,
  candidatePool,
  buttonsForSpot,
} from '../lib/hands'

const ACTION_LABEL = { raise: 'RAISE', '3bet': '3-BET', '4bet': '4-BET', call: 'CALL', fold: 'FOLD' }

const CONTEXTS_BY_SPOT = {
  open: POSITION_GROUPS.map((g) => ({ key: g, label: g })),
  bb_defense: POSITION_GROUPS.map((g) => ({ key: `vs_${g}`, label: `vs ${g}` })),
  vs_3bet: [...new Set(Object.values(VS3BET_BUCKET))].map((key) => ({
    key,
    label: key.replace('open_', '').replace('_', '-'),
  })),
}

const LEGEND_BY_SPOT = {
  open: ['raise', 'fold'],
  bb_defense: ['3bet', 'call', 'fold'],
  vs_3bet: ['4bet', 'call', 'fold'],
}

const QUIZ_LENGTH = 15
const EMPTY_SET = new Set()

function drawQuizQueue(spot, contextKey) {
  const pool = candidatePool(spot, contextKey, rangesOpenData, rangesDefenseData)
  return Array.from({ length: QUIZ_LENGTH }, () => pool[Math.floor(Math.random() * pool.length)])
}

// Visuels des 2 grandes boxes d'entrée (SVG, mêmes couleurs d'action que la matrice).
const MINI_GRID_PATTERN = [
  'GGGGBRRR',
  'GGGBRRRR',
  'GGBRRRRR',
  'GBRRRRRR',
  'BRRRRRRR',
  'RRRRRRRR',
]
const MINI_COLORS = { G: 'var(--green)', B: 'var(--blue)', R: 'var(--red)' }

function ConsultVisual() {
  return (
    <svg viewBox="0 0 94 70" className="sb-visual" aria-hidden="true">
      {MINI_GRID_PATTERN.flatMap((row, r) =>
        [...row].map((c, i) => (
          <rect key={`${r}-${i}`} x={i * 12} y={r * 12} width="10" height="10" rx="2.5" fill={MINI_COLORS[c]} />
        )),
      )}
    </svg>
  )
}

function QuizVisual() {
  return (
    <svg viewBox="0 0 94 70" className="sb-visual" aria-hidden="true">
      {MINI_GRID_PATTERN.flatMap((row, r) =>
        [...row].map((_, i) => (
          <rect
            key={`${r}-${i}`}
            x={i * 12}
            y={r * 12}
            width="10"
            height="10"
            rx="2.5"
            fill="rgba(255,255,255,0.12)"
          />
        )),
      )}
      <rect x="48" y="24" width="10" height="10" rx="2.5" fill="rgba(255,255,255,0.12)" stroke="#e0a655" strokeWidth="2" />
      <text x="53" y="32" textAnchor="middle" fontSize="9" fontWeight="800" fill="#e0a655">
        ?
      </text>
    </svg>
  )
}

/**
 * Écran Charts, navigation à 2 niveaux : choix du mode (2 grandes boxes), puis la matrice en
 * Consultation (lecture seule, 169 mains colorées) ou en Quiz (case surlignée au hasard, réponse via les boutons du drill).
 */
export default function Charts() {
  const [mode, setMode] = useState(null) // null = choix du mode | 'consult' | 'quiz'
  const [spot, setSpot] = useState('open')
  const [contextKey, setContextKey] = useState(CONTEXTS_BY_SPOT.open[0].key)
  const [selected, setSelected] = useState(null)

  const [quizQueue, setQuizQueue] = useState([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState(null)
  const [quizDone, setQuizDone] = useState(false)

  function startQuiz(nextSpot = spot, nextContextKey = contextKey) {
    setQuizQueue(drawQuizQueue(nextSpot, nextContextKey))
    setQuizIndex(0)
    setQuizScore(0)
    setQuizAnswer(null)
    setQuizDone(false)
  }

  function enterMode(nextMode) {
    setMode(nextMode)
    setSelected(null)
    if (nextMode === 'quiz') startQuiz()
  }

  function handleSpotChange(nextSpot) {
    const nextContextKey = CONTEXTS_BY_SPOT[nextSpot][0].key
    setSpot(nextSpot)
    setContextKey(nextContextKey)
    setSelected(null)
    if (mode === 'quiz') startQuiz(nextSpot, nextContextKey)
  }

  function handleContextChange(key) {
    setContextKey(key)
    setSelected(null)
    if (mode === 'quiz') startQuiz(spot, key)
  }

  function getAction(notation) {
    return correctActionFor(spot, contextKey, notation, rangesOpenData, rangesDefenseData)
  }

  const quizNotation = quizQueue[quizIndex]

  function getQuizCellAction(notation) {
    if (notation !== quizNotation || !quizAnswer) return 'hidden'
    return quizAnswer.correctAction
  }

  function handleQuizAnswer(action) {
    if (quizAnswer) return
    const correctAction = getAction(quizNotation)
    const correct = action === correctAction
    setQuizAnswer({ userAction: action, correctAction, correct })
    if (correct) setQuizScore((s) => s + 1)
  }

  function handleQuizNext() {
    if (quizIndex + 1 >= QUIZ_LENGTH) {
      setQuizDone(true)
      return
    }
    setQuizIndex((i) => i + 1)
    setQuizAnswer(null)
  }

  if (mode === null) {
    return (
      <div className="screen with-nav">
        <div className="topbar">
          <b>Charts</b>
        </div>
        <p className="series-intro">Les ranges de référence, pour les consulter ou les apprendre.</p>

        <button type="button" className="series-box" onClick={() => enterMode('consult')}>
          <span className="sb-text">
            <span className="sb-title">Les grilles</span>
            <span className="sb-sub">Explore la matrice des 169 mains : ouvrir, défendre, répondre à un 3-bet.</span>
          </span>
          <ConsultVisual />
        </button>

        <button type="button" className="series-box" onClick={() => enterMode('quiz')}>
          <span className="sb-text">
            <span className="sb-title">Teste-toi</span>
            <span className="sb-sub">15 mains surlignées au hasard : tu choisis l'action, la matrice te corrige.</span>
          </span>
          <QuizVisual />
        </button>
      </div>
    )
  }

  const buttons = buttonsForSpot(spot)

  return (
    <div className="screen with-nav">
      <BackHeader title={mode === 'consult' ? 'Les grilles' : 'Teste-toi'} onBack={() => setMode(null)} />

      <div className="chart-tabs">
        {SPOTS.map((s) => (
          <button
            key={s}
            type="button"
            className={`chart-tab${spot === s ? ' on' : ''}`}
            onClick={() => handleSpotChange(s)}
          >
            {SPOT_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="chart-pills">
        {CONTEXTS_BY_SPOT[spot].map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`chart-pill${contextKey === opt.key ? ' on' : ''}`}
            onClick={() => handleContextChange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === 'consult' ? (
        <>
          <RangeMatrix
            getAction={getAction}
            frontierSet={EMPTY_SET}
            selected={selected}
            onCellTap={(notation) => setSelected(notation)}
          />

          <div className="chart-legend">
            {LEGEND_BY_SPOT[spot].map((action) => (
              <div className="chart-legend-item" key={action}>
                <span className="chart-legend-swatch" style={{ background: ACTION_COLOR[action] }} />
                {ACTION_LABEL[action]}
              </div>
            ))}
          </div>
        </>
      ) : quizDone ? (
        <div className="card light quiz-recap">
          <div className="quiz-recap-score">
            {quizScore}/{QUIZ_LENGTH}
          </div>
          <p>bonnes réponses</p>
          <button type="button" className="btn g" onClick={() => startQuiz()}>
            REJOUER
          </button>
          <button type="button" className="btn ghost" onClick={() => setMode(null)}>
            RETOUR AUX CHARTS
          </button>
        </div>
      ) : (
        <>
          <div className="chart-quiz-progress">
            <ProgressBar percent={((quizIndex + (quizAnswer ? 1 : 0)) / QUIZ_LENGTH) * 100} />
            <span>
              Main {quizIndex + 1}/{QUIZ_LENGTH} · Score {quizScore}
            </span>
          </div>

          <RangeMatrix getAction={getQuizCellAction} frontierSet={EMPTY_SET} selected={quizNotation} onCellTap={() => {}} />

          {quizAnswer && (
            <div className={`fb${quizAnswer.correct ? ' correct' : ''}`}>
              <h4>
                <Icon name={quizAnswer.correct ? 'check' : 'cross'} style={{ width: 16, height: 16 }} />
                {quizAnswer.correct ? 'Bien joué !' : 'Pas tout à fait…'}
              </h4>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                {quizNotation} → <span className="good">{ACTION_LABEL[quizAnswer.correctAction]}</span>
                {!quizAnswer.correct && (
                  <span style={{ color: 'var(--text-muted)' }}> (tu as répondu {ACTION_LABEL[quizAnswer.userAction]})</span>
                )}
              </div>
            </div>
          )}

          {quizAnswer ? (
            <button type="button" className="btn b" style={{ marginTop: 'auto', marginBottom: 14 }} onClick={handleQuizNext}>
              {quizIndex + 1 < QUIZ_LENGTH ? 'SUIVANT' : 'VOIR LE SCORE'}
            </button>
          ) : (
            <div className="answers" style={{ marginTop: 'auto' }}>
              {buttons.map((b) => (
                <button key={b.action} type="button" className={`btn ${b.cls}`} onClick={() => handleQuizAnswer(b.action)}>
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
