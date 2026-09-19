import { useState } from 'react'
import { Icon } from '../components/Icons'
import RangeMatrix, { ACTION_COLOR } from '../components/RangeMatrix'
import rangesOpenData from '../data/ranges-open-raise-9max-live.json'
import rangesDefenseData from '../data/ranges-defense-bb-et-vs-3bet.json'
import {
  SPOTS,
  SPOT_LABELS,
  POSITION_GROUPS,
  VS3BET_BUCKET,
  correctActionFor,
  getFrontierSet,
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

function drawQuizQueue(spot, contextKey) {
  const pool = candidatePool(spot, contextKey, rangesOpenData, rangesDefenseData)
  return Array.from({ length: QUIZ_LENGTH }, () => pool[Math.floor(Math.random() * pool.length)])
}

/** Écran Charts : consultation en lecture seule (169 mains colorées) + mode Quiz (surlignage aléatoire, réponse via les boutons du drill). */
export default function Charts() {
  const [mode, setMode] = useState('consult')
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

  function handleModeChange(nextMode) {
    setMode(nextMode)
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

  const frontierSet = getFrontierSet(spot, contextKey, rangesOpenData, rangesDefenseData)
  const vpip = spot === 'open' ? rangesOpenData.positions[contextKey].vpip_approx : null
  const buttons = buttonsForSpot(spot)

  return (
    <div className="screen with-nav">
      <div className="topbar">
        <b>Charts</b>
        {mode === 'consult' && vpip && <span className="chart-vpip">VPIP ~{vpip}</span>}
      </div>

      <div className="chart-tabs">
        <button type="button" className={`chart-tab${mode === 'consult' ? ' on' : ''}`} onClick={() => handleModeChange('consult')}>
          CONSULTATION
        </button>
        <button type="button" className={`chart-tab${mode === 'quiz' ? ' on' : ''}`} onClick={() => handleModeChange('quiz')}>
          QUIZ
        </button>
      </div>

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
            frontierSet={frontierSet}
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
            <div className="chart-legend-item">
              <span className="chart-legend-swatch chart-legend-frontier" />
              Main frontière
            </div>
          </div>

          <div className="chart-selection">
            {selected ? (
              <>
                <b>{selected}</b> → {ACTION_LABEL[getAction(selected)]}
                {frontierSet.has(selected) && ' · main frontière (priorité du drill)'}
              </>
            ) : (
              <span style={{ color: 'var(--gray)' }}>Tape une case pour voir la main et l'action.</span>
            )}
          </div>
        </>
      ) : quizDone ? (
        <div className="card quiz-recap">
          <div className="quiz-recap-score">
            {quizScore}/{QUIZ_LENGTH}
          </div>
          <p>bonnes réponses</p>
          <button type="button" className="btn g" onClick={() => startQuiz()}>
            REJOUER
          </button>
        </div>
      ) : (
        <>
          <div className="chart-quiz-progress">
            Main {quizIndex + 1}/{QUIZ_LENGTH} · Score {quizScore}
          </div>

          <RangeMatrix
            getAction={getQuizCellAction}
            frontierSet={new Set([quizNotation])}
            selected={null}
            onCellTap={() => {}}
          />

          {quizAnswer && (
            <div className={`fb${quizAnswer.correct ? ' correct' : ''}`}>
              <h4>
                <Icon name={quizAnswer.correct ? 'check' : 'cross'} style={{ width: 16, height: 16 }} />
                {quizAnswer.correct ? 'Bien joué !' : 'Pas tout à fait…'}
              </h4>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                {quizNotation} → <span className="good">{ACTION_LABEL[quizAnswer.correctAction]}</span>
                {!quizAnswer.correct && (
                  <span style={{ color: 'var(--gray)' }}> (tu as répondu {ACTION_LABEL[quizAnswer.userAction]})</span>
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
