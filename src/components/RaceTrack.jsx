import { useState, useEffect, useRef } from 'react'
import { initRaceState, tickRace } from '../utils/gameLogic'
import { GAME_CONFIG } from '../utils/constants'

const MEDAL = ['🥇', '🥈', '🥉']
const TYPE_COLOR = { Short: '#4ade80', Medium: '#60a5fa', Long: '#c084fc' }

export default function RaceTrack({ race, bets, players, onComplete }) {
  const { horses, type, distance, odds } = race
  const [raceState, setRaceState] = useState(() => initRaceState(horses, type))
  const [cfbAlert, setCfbAlert] = useState(null)
  const intervalRef = useRef(null)
  const prevCFBRef = useRef(null)
  const completedRef = useRef(false)

  const human = players.find(p => p.isHuman)
  const humanBet = bets[human?.id]
  const betHorse = humanBet ? horses.find(h => h.id === humanBet.horseId) : null

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRaceState(prev => {
        if (prev.done) return prev
        const next = tickRace(prev, horses)

        const cfbId = next.comeFromBehind.activeHorse
        if (cfbId && cfbId !== prevCFBRef.current) {
          prevCFBRef.current = cfbId
          const h = horses.find(x => x.id === cfbId)
          setCfbAlert(h?.name || '?')
          setTimeout(() => setCfbAlert(null), 2500)
        }

        if (next.done && !completedRef.current) {
          completedRef.current = true
          clearInterval(intervalRef.current)
          setTimeout(() => onComplete(next.finished, next.dnf), 1800)
        }

        return next
      })
    }, GAME_CONFIG.RACE_UPDATE_INTERVAL_MS)

    return () => clearInterval(intervalRef.current)
  }, [horses, onComplete])

  // Sort lanes: leader on top
  const displayHorses = [...horses].sort(
    (a, b) => (raceState.positions[b.id] || 0) - (raceState.positions[a.id] || 0)
  )

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-widest">🏁 Race in progress</div>
          <div className="font-bold text-xl" style={{ color: TYPE_COLOR[type] || '#fff' }}>
            {type} · {distance} furlongs
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Standings during race */}
          <div className="hidden sm:flex items-center gap-3">
            {[...players].sort((a, b) => b.bux - a.bux).map((p, i) => (
              <div key={p.id} className={`text-sm ${p.isHuman ? 'text-yellow-400 font-bold' : 'text-slate-400'}`}>
                #{i + 1} {p.name} {p.bux}🪙
              </div>
            ))}
          </div>

          {betHorse && (
            <div className="text-right text-sm border-l border-slate-700 pl-6">
              <div className="text-slate-500 text-xs">Your bet</div>
              <div className="text-yellow-400 font-bold">{betHorse.name}</div>
              <div className="text-slate-400 text-xs">{humanBet.amount}🪙 @ {odds[humanBet.horseId]}x</div>
            </div>
          )}
        </div>
      </div>

      {/* CFB Alert */}
      {cfbAlert && (
        <div
          className="fixed top-20 left-1/2 z-50 bg-orange-500 text-white px-8 py-3 rounded-full font-black text-lg shadow-2xl alert-slide"
          style={{ transform: 'translateX(-50%)' }}
        >
          ⚡ Come From Behind: {cfbAlert}!
        </div>
      )}

      {/* Race lanes — full width, grow to fill all available height */}
      <div className="flex-1 flex flex-col p-3 gap-2 min-h-0">
        {displayHorses.map(horse => {
          const pos = raceState.positions[horse.id] || 0
          const finishIdx = raceState.finished.indexOf(horse.id)
          const isFinished = finishIdx >= 0
          const isDnf = raceState.dnf.includes(horse.id)
          const isBetHorse = humanBet?.horseId === horse.id
          const isCFB = raceState.comeFromBehind.activeHorse === horse.id
          const pct = 2 + pos * 89
          // Non-DNF finishers get medals — DNF horses don't count toward placement
          const placementIdx = isFinished && !isDnf
            ? raceState.finished.filter(id => !raceState.dnf.includes(id)).indexOf(horse.id)
            : -1

          return (
            <div
              key={horse.id}
              className={`flex-1 flex items-stretch rounded-xl overflow-hidden border min-h-0 ${
                isDnf ? 'border-slate-700 opacity-60' : isBetHorse ? 'border-yellow-500' : 'border-slate-800'
              }`}
            >
              {/* Left: horse info — fixed width */}
              <div className={`flex items-center gap-3 px-4 flex-shrink-0 w-56 ${isDnf ? 'bg-slate-900/50' : 'bg-slate-900'}`}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                  style={{ backgroundColor: horse.color }}
                >
                  {horse.number}
                </div>
                <div className="min-w-0">
                  <div className={`font-bold truncate ${isBetHorse ? 'text-yellow-400' : isDnf ? 'text-slate-500' : 'text-white'}`}>
                    {horse.name}{isBetHorse ? ' ⭐' : ''}
                  </div>
                  <div className="text-slate-500 text-xs truncate">{horse.jockey}</div>
                </div>
                {isCFB && (
                  <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold cfb-active flex-shrink-0 ml-auto">
                    CFB!
                  </span>
                )}
              </div>

              {/* Track — fills remaining width and full lane height */}
              <div className={`flex-1 relative lane-track ${isDnf ? 'bg-slate-900' : 'bg-emerald-950'}`}>
                <div
                  className="absolute top-0 bottom-0 w-px"
                  style={{
                    right: '7%',
                    background: 'repeating-linear-gradient(180deg, white 0px, white 5px, transparent 5px, transparent 10px)',
                    opacity: 0.3,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 select-none pointer-events-none"
                  style={{
                    left: `${pct}%`,
                    fontSize: 'clamp(1.5rem, 3vh, 2.5rem)',
                    lineHeight: 1,
                    transition: isFinished ? 'none' : `left ${GAME_CONFIG.RACE_UPDATE_INTERVAL_MS}ms linear`,
                    filter: isDnf ? 'grayscale(1) opacity(0.4)' : isCFB ? 'brightness(2) drop-shadow(0 0 10px orange)' : 'none',
                  }}
                >
                  🐎
                </div>
              </div>

              {/* Right: position — fixed width */}
              <div className={`flex items-center justify-center flex-shrink-0 w-16 border-l border-slate-800 ${isDnf ? 'bg-slate-900/50' : 'bg-slate-900'}`}>
                {isDnf ? (
                  <span className="text-xs font-black text-red-600">DNF</span>
                ) : placementIdx >= 0 ? (
                  <span className="text-2xl">{MEDAL[placementIdx] || `#${placementIdx + 1}`}</span>
                ) : (
                  <span className="text-slate-500 text-xs tabular-nums">{Math.round(pos * 100)}%</span>
                )}
              </div>
            </div>
          )
        })}

        {/* Live finish order */}
        {raceState.finished.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center gap-4">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest flex-shrink-0">
              Finish Order
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {raceState.finished.map((id, i) => {
                const h = horses.find(x => x.id === id)
                const isDnf = raceState.dnf.includes(id)
                const placedFinishers = raceState.finished.filter(fid => !raceState.dnf.includes(fid))
                const placeIdx = isDnf ? -1 : placedFinishers.indexOf(id)
                return (
                  <div key={id} className="flex items-center gap-1.5 text-sm">
                    {isDnf
                      ? <span className="text-red-600 font-black text-xs">DNF</span>
                      : <span>{MEDAL[placeIdx] || `#${placeIdx + 1}`}</span>
                    }
                    <span className={isDnf ? 'text-slate-600' : humanBet?.horseId === id ? 'text-yellow-400 font-bold' : 'text-slate-300'}>
                      {h?.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
