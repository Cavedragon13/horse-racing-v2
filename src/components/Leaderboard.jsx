import { useRef, useState } from 'react'
import { submitScore, loadLeaderboardWithRemote } from '../utils/leaderboard'

const RANK_COLOR = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

export function LeaderboardDisplay({ entries, highlightScore }) {
  if (entries.length === 0) {
    return (
      <div className="text-slate-600 text-center py-6 text-sm">
        No scores yet — be the first on the board!
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {entries.map((e, i) => {
        const isHighlight = highlightScore !== undefined && e.score === highlightScore
        return (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-1.5 rounded-lg font-mono ${
              isHighlight ? 'bg-yellow-500/15 ring-1 ring-yellow-500/30' : ''
            }`}
          >
            <span className={`text-sm w-6 text-right flex-shrink-0 ${RANK_COLOR[i] || 'text-slate-600'}`}>
              {i + 1}.
            </span>
            <span className={`font-black text-lg tracking-[0.2em] w-12 flex-shrink-0 ${
              isHighlight ? 'text-yellow-400' : RANK_COLOR[i] || 'text-slate-400'
            }`}>
              {e.initials.padEnd(3, ' ')}
            </span>
            <span className={`flex-1 text-right font-bold tabular-nums ${
              isHighlight ? 'text-yellow-400' : 'text-slate-300'
            }`}>
              {e.score.toLocaleString()}🪙
            </span>
            <span className="text-slate-700 text-xs w-16 text-right flex-shrink-0">
              {e.date}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function InitialsEntry({ score, onDone }) {
  const [letters, setLetters] = useState(['A', 'A', 'A'])
  const inputRefs = useRef([])
  const [submitted, setSubmitted] = useState(false)
  const [board, setBoard] = useState(null)

  const handleKey = (i, e) => {
    if (/^[A-Za-z]$/.test(e.key)) {
      e.preventDefault()
      const next = [...letters]
      next[i] = e.key.toUpperCase()
      setLetters(next)
      if (i < 2) inputRefs.current[i + 1]?.focus()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...letters]
      next[i] = 'A'
      setLetters(next)
      if (i > 0) inputRefs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = [...letters]
      const code = next[i].charCodeAt(0)
      next[i] = String.fromCharCode(code === 90 ? 65 : code + 1)
      setLetters(next)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = [...letters]
      const code = next[i].charCodeAt(0)
      next[i] = String.fromCharCode(code === 65 ? 90 : code - 1)
      setLetters(next)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    const initials = letters.join('')
    const localBoard = submitScore(initials, score)
    setBoard(localBoard)
    setSubmitted(true)
    // Pass localBoard so loadLeaderboardWithRemote skips re-reading localStorage
    const merged = await loadLeaderboardWithRemote(localBoard)
    setBoard(merged)
  }

  if (submitted && board) {
    return (
      <div>
        <div className="text-center mb-4">
          <div className="text-yellow-400 font-black text-xl tracking-widest mb-1">
            {letters.join('')} · {score.toLocaleString()}🪙
          </div>
          <div className="text-slate-500 text-xs">Score saved</div>
        </div>
        <LeaderboardDisplay entries={board} highlightScore={score} />
        <button
          onClick={() => onDone(board)}
          className="w-full mt-5 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black rounded-xl transition-all"
        >
          Play Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-5">
        <div className="text-4xl mb-2">🏆</div>
        <div className="text-yellow-400 font-black text-2xl tracking-widest animate-pulse">
          HIGH SCORE!
        </div>
        <div className="text-slate-400 text-sm mt-1">{score.toLocaleString()}🪙 — Enter your initials</div>
      </div>

      <div className="flex justify-center gap-4 mb-2">
        {letters.map((l, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el }}
            value={l}
            readOnly
            onKeyDown={e => handleKey(i, e)}
            onClick={() => inputRefs.current[i]?.focus()}
            autoFocus={i === 0}
            className="w-16 h-20 text-4xl font-black text-center bg-slate-800 border-2 border-yellow-500 rounded-xl text-yellow-400 cursor-pointer focus:outline-none focus:border-yellow-300 select-none caret-transparent"
          />
        ))}
      </div>
      <div className="text-slate-600 text-xs text-center mb-5">
        Type A–Z · ↑↓ to cycle · Enter to submit
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black text-lg rounded-xl transition-all"
      >
        Submit
      </button>
    </div>
  )
}
