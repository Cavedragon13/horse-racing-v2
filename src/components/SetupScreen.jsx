import { useState } from 'react'
import { GAME_CONFIG } from '../utils/constants'
import { loadLeaderboard } from '../utils/leaderboard'
import { LeaderboardDisplay } from './Leaderboard'
import { HowToPlayModal, HowToPlayTeaser } from './HowToPlay'
import { useHowToPlayTeaser } from '../utils/useHowToPlayTeaser'

const LENGTH_OPTIONS = [
  { label: '5 Races', value: 5, sub: 'Quick' },
  { label: '10 Races', value: 10, sub: 'Standard' },
  { label: 'Until Bust', value: Infinity, sub: 'Endless' },
]

export default function SetupScreen({ onStart, savedData }) {
  const [name, setName] = useState(savedData?.playerName || '')
  const [numAI, setNumAI] = useState(1)
  const [totalRaces, setTotalRaces] = useState(10)
  const [leaderboard] = useState(() => loadLeaderboard())
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [teaserVisible, setTeaserVisible] = useHowToPlayTeaser(!showHowToPlay)

  const canStart = name.trim().length > 0

  const openHowToPlay = () => {
    setTeaserVisible(false)
    setShowHowToPlay(true)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950">
      {/* How to Play */}
      <button
        onClick={openHowToPlay}
        className="fixed top-4 right-4 z-30 flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-widest rounded-full px-4 py-2 transition-colors"
      >
        📖 How to Play
      </button>
      <HowToPlayModal open={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <HowToPlayTeaser
        visible={teaserVisible}
        onOpen={openHowToPlay}
        onDismiss={() => setTeaserVisible(false)}
      />

      {/* Raven hero */}
      <div className="relative mb-6 select-none">
        <img
          src="raven.png"
          alt="Bold Rainbow Raven"
          className="w-32 h-32 rounded-2xl object-cover shadow-2xl shadow-purple-500/20 ring-2 ring-purple-500/30"
        />
      </div>
      <h1 className="text-5xl font-black text-yellow-400 mb-1 tracking-tight">Horse Racing</h1>
      <p className="text-slate-400 mb-10 text-lg tracking-widest uppercase text-sm">Simulator v2</p>

      <div className="bg-slate-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-800">
        {/* Player name */}
        <div className="mb-6">
          <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canStart && onStart(name.trim(), numAI, totalRaces)}
            placeholder="Enter your name…"
            maxLength={20}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-lg border border-slate-700 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors placeholder-slate-600"
          />
        </div>

        {/* AI opponents */}
        <div className="mb-5">
          <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">
            AI Opponents
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => setNumAI(n)}
                className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all border ${
                  numAI === n
                    ? 'bg-yellow-500 text-slate-900 border-yellow-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Game length */}
        <div className="mb-6">
          <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest">
            Game Length
          </label>
          <div className="flex gap-2">
            {LENGTH_OPTIONS.map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => setTotalRaces(opt.value)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border flex flex-col items-center gap-0.5 ${
                  totalRaces === opt.value
                    ? 'bg-yellow-500 text-slate-900 border-yellow-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                <span>{opt.label}</span>
                <span className={`text-xs font-normal ${totalRaces === opt.value ? 'text-slate-700' : 'text-slate-600'}`}>
                  {opt.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Game info */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Starting funds</span>
            <span className="text-yellow-400 font-bold">{GAME_CONFIG.STARTING_BUX} 🪙</span>
          </div>
          {totalRaces === Infinity ? (
            <div className="flex justify-between text-slate-400">
              <span>Win condition</span>
              <span>Survive as long as possible</span>
            </div>
          ) : (
            <div className="flex justify-between text-slate-400">
              <span>Win condition</span>
              <span>Most 🪙 after {totalRaces} races</span>
            </div>
          )}
        </div>

        <button
          onClick={() => canStart && onStart(name.trim(), numAI, totalRaces)}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl font-black text-xl transition-all ${
            canStart
              ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-500/20'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          Start Tournament
        </button>
      </div>

      {savedData && (
        <p className="mt-5 text-slate-600 text-xs">
          Last session: <span className="text-slate-500">{savedData.playerName}</span> · {savedData.bux} 🪙
        </p>
      )}

      {/* Hall of Fame */}
      {leaderboard.length > 0 && (
        <div className="mt-6 w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
            <span className="text-base">🏆</span>
            <div className="text-slate-500 text-xs font-black uppercase tracking-widest">Hall of Fame</div>
          </div>
          <div className="p-3">
            <LeaderboardDisplay entries={leaderboard} />
          </div>
        </div>
      )}

      {/* Legal footer */}
      <div className="mt-8 max-w-md text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-1">
          <img src="seed13-logo.png" alt="Seed 13" className="w-8 h-8 rounded-md object-cover opacity-60" />
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Seed 13 Productions. All rights reserved.
          </p>
        </div>
        <p className="text-slate-700 text-xs leading-relaxed">
          For entertainment purposes only. This game does not involve real money, real wagering,
          or any form of gambling. No actual currency or items of value may be won or lost.
        </p>
        <p className="text-slate-700 text-xs leading-relaxed pt-1 border-t border-slate-800">
          If you or someone you know has a gambling problem,{' '}
          <a
            href="https://www.ncpgambling.org/help-treatment/national-helpline-1-800-522-4700/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 underline hover:text-slate-400 transition-colors"
          >
            help is available
          </a>
          . Call or text the National Problem Gambling Helpline:{' '}
          <a
            href="tel:+18005224700"
            className="text-slate-500 underline hover:text-slate-400 transition-colors"
          >
            1-800-522-4700
          </a>{' '}
          (24/7, free, confidential).
        </p>
      </div>
    </div>
  )
}
