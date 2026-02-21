import { useState } from 'react'
import { qualifiesForLeaderboard, loadLeaderboard } from '../utils/leaderboard'
import { LeaderboardDisplay, InitialsEntry } from './Leaderboard'

const MEDAL = ['🥇', '🥈', '🥉']

export default function GameOver({ players, onNewGame }) {
  const sorted = [...players].sort((a, b) => b.bux - a.bux)
  const human = players.find(p => p.isHuman)
  const humanRank = sorted.findIndex(p => p.id === human.id) + 1
  const winner = sorted[0]

  const rankEmoji = humanRank === 1 ? '🏆' : humanRank === 2 ? '🥈' : '🎖️'
  const rankMsg =
    humanRank === 1
      ? 'You won the tournament!'
      : humanRank === 2
      ? 'Runner-up! So close.'
      : `You finished #${humanRank}.`

  const qualifies = qualifiesForLeaderboard(human.bux)
  const [board, setBoard] = useState(() => loadLeaderboard())
  const [initialsSubmitted, setInitialsSubmitted] = useState(false)

  const handleBoardDone = (newBoard) => {
    setBoard(newBoard)
    setInitialsSubmitted(true)
    onNewGame()
  }

  // Show initials entry if they made the top 10 and haven't submitted yet
  if (qualifies && !initialsSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="bg-slate-900 rounded-2xl border border-yellow-600/50 w-full max-w-sm p-6 shadow-2xl shadow-yellow-500/10">
          <InitialsEntry score={human.bux} onDone={handleBoardDone} />
        </div>
        <div className="mt-4 text-slate-700 text-xs">{rankMsg}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="text-8xl mb-4 select-none">{rankEmoji}</div>
      <h1 className="text-4xl font-black text-white mb-1">Tournament Over!</h1>
      <p className="text-slate-400 text-center mb-2">{rankMsg}</p>
      {!winner.isHuman && (
        <p className="text-slate-500 text-sm mb-6">{winner.name} wins with {winner.bux}🪙</p>
      )}
      {winner.isHuman && (
        <p className="text-green-400 text-sm mb-6 font-bold">Final balance: {human.bux}🪙</p>
      )}

      {/* Final standings */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-sm overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-slate-800">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Final Standings</div>
        </div>
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-5 py-4 ${
              i < sorted.length - 1 ? 'border-b border-slate-800' : ''
            } ${p.isHuman ? 'bg-yellow-500/5' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{MEDAL[i] || `#${i + 1}`}</span>
              <div>
                <div className={`font-bold ${p.isHuman ? 'text-yellow-400' : 'text-white'}`}>
                  {p.name}{p.isHuman ? ' (you)' : ''}
                </div>
                <div className="text-slate-600 text-xs">
                  {p.wins} win{p.wins !== 1 ? 's' : ''} · +{p.totalWon || 0} / −{p.totalLost || 0}
                </div>
              </div>
            </div>
            <div className="text-yellow-400 font-black text-lg">{p.bux}🪙</div>
          </div>
        ))}
      </div>

      {/* Hall of Fame */}
      {board.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-sm overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-slate-800">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Hall of Fame</div>
          </div>
          <div className="p-3">
            <LeaderboardDisplay entries={board} />
          </div>
        </div>
      )}

      <button
        onClick={onNewGame}
        className="w-full max-w-sm py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black text-xl rounded-xl transition-all shadow-lg shadow-yellow-500/20"
      >
        Play Again
      </button>
    </div>
  )
}
