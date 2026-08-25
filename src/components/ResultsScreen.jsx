import { GAME_CONFIG, LOAN_SHARK, BETTING_TYPES, PARLAY_BONUS } from '../utils/constants'
import { maxLoanAvailable } from '../utils/gameLogic'

const MEDAL = ['🥇', '🥈', '🥉']

export default function ResultsScreen({ gs, onNext, onForfeit }) {
  const { lastResult, players, day, race, gameOver, dayStartBux, totalRaces } = gs
  const { finishOrder, dnf = [], horses, odds, bets, raceDay, raceNum, raceType, raceDistance } = lastResult
  const cumRaceNum = (raceDay - 1) * GAME_CONFIG.RACES_PER_DAY + raceNum

  const human = players.find(p => p.isHuman)
  const rawBet = bets[human.id]
  // Normalize to array
  const humanTicket = rawBet ? (Array.isArray(rawBet) ? rawBet : [rawBet]) : null

  const orderedFinishers = finishOrder.filter(id => !dnf.includes(id))
  const winnerId = orderedFinishers[0]
  const winner = horses.find(h => h.id === winnerId)

  // Compute per-leg results
  const legResults = humanTicket ? humanTicket.map(leg => {
    const betType = (leg.betType || 'WIN').toUpperCase()
    const cfg = BETTING_TYPES[betType] || BETTING_TYPES.WIN
    const horseIdx = orderedFinishers.indexOf(leg.horseId)
    const won = horseIdx >= 0 && horseIdx < cfg.positions
    const effectiveOdds = won ? Math.max(cfg.minOdds, odds[leg.horseId] * cfg.rate) : 0
    const payout = won ? Math.floor(leg.amount * effectiveOdds) : 0
    return {
      ...leg,
      betType,
      cfg,
      horse: horses.find(h => h.id === leg.horseId),
      won,
      payout,
      position: horseIdx,
    }
  }) : []

  const allWon = legResults.length > 0 && legResults.every(l => l.won)
  const anyBet = legResults.length > 0
  const straightTotal = legResults.reduce((s, l) => s + l.payout, 0)
  const totalStake = legResults.reduce((s, l) => s + l.amount, 0)
  const parlayMult = (allWon && legResults.length >= 2) ? (PARLAY_BONUS[legResults.length] || 1) : 1
  const finalPayout = Math.floor(straightTotal * parlayMult)
  const net = finalPayout - totalStake

  const isBust = human.bux <= 0
  const canBorrow = maxLoanAvailable(human, dayStartBux || GAME_CONFIG.STARTING_BUX)
  const hasLoan = (human.loanBalance || 0) > 0
  const nextVig = hasLoan ? Math.ceil(human.loanBalance * LOAN_SHARK.VIG_RATE) : 0

  const isNewDay = race === 1 && !gameOver
  let nextLabel
  if (gameOver) nextLabel = 'Final Results →'
  else if (isBust) nextLabel = 'See Loan Shark →'
  else if (isNewDay) nextLabel = `Day ${day} — Race 1 →`
  else nextLabel = `Race ${race} →`

  const placeLabel = (idx) => ['1st', '2nd', '3rd'][idx] || `${idx + 1}th`

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="text-slate-500 text-sm">
          {totalRaces === Infinity ? `Race ${cumRaceNum}` : `Race ${cumRaceNum} / ${totalRaces}`} · {raceType} {raceDistance}f
        </div>
      </div>

      {/* Body — two columns */}
      <div className="flex-1 flex min-h-0">

        {/* Left: race results */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🏆</div>
            <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Winner</div>
            <div className="text-4xl font-black text-white">{winner?.name}</div>
            <div className="text-slate-500 mt-1">{odds[winnerId]}x odds</div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Race Results</div>
            </div>
            {(() => {
              const placedFinishers = finishOrder.filter(id => !dnf.includes(id))
              const betHorseIds = new Set((humanTicket || []).map(l => l.horseId))
              return finishOrder.map((id, i) => {
                const horse = horses.find(h => h.id === id)
                const isBet = betHorseIds.has(id)
                const isDnf = dnf.includes(id)
                const placeIdx = isDnf ? -1 : placedFinishers.indexOf(id)
                const totalBet = Object.values(bets).reduce((s, rawB) => {
                  const legs = Array.isArray(rawB) ? rawB : [rawB]
                  return s + legs.filter(b => b.horseId === id).reduce((ss, b) => ss + b.amount, 0)
                }, 0)
                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between px-5 py-3 ${
                      i < finishOrder.length - 1 ? 'border-b border-slate-800' : ''
                    } ${placeIdx === 0 ? 'bg-slate-800/30' : ''} ${isDnf ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {isDnf
                        ? <span className="text-xs font-black text-red-600 w-9">DNF</span>
                        : <span className="text-xl w-9">{MEDAL[placeIdx] || `#${placeIdx + 1}`}</span>
                      }
                      <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: horse?.color }} />
                      <span className={`font-semibold text-lg ${isBet ? 'text-yellow-400' : 'text-white'}`}>
                        {horse?.name}{isBet ? ' ⭐' : ''}
                      </span>
                      {isBet && humanTicket && (
                        <div className="flex gap-1">
                          {humanTicket.filter(l => l.horseId === id).map((l, li) => (
                            <span key={li} className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold">
                              {BETTING_TYPES[l.betType]?.shortLabel || l.betType}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">{odds[id]}x</div>
                      {totalBet > 0 && <div className="text-slate-600 text-xs">{totalBet}🪙 bet</div>}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>

        {/* Right: your result + standings + next */}
        <div className="w-80 flex-shrink-0 border-l border-slate-800 flex flex-col bg-slate-900/30">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Bust result card */}
            {isBust ? (
              <div className="rounded-2xl p-5 border text-center bg-red-950/40 border-red-800">
                <div className="text-5xl mb-2">💸</div>
                <div className="text-red-400 font-black text-2xl mb-1">BUSTED</div>
                {anyBet && (
                  <div className="text-slate-400 text-sm mb-3">
                    {allWon ? 'All legs hit, but balance is 0' : "Didn't place enough legs"}
                  </div>
                )}
                <div className="pt-3 border-t border-red-900/50 space-y-1">
                  <div className="text-slate-500 text-xs">Balance</div>
                  <div className="text-red-400 font-black text-2xl">0🪙</div>
                  {hasLoan && (
                    <>
                      <div className="text-slate-500 text-xs mt-2">Outstanding debt</div>
                      <div className="text-red-500 font-bold">{human.loanBalance}🪙</div>
                      <div className="text-orange-600 text-xs">Vig after next race: +{nextVig}🪙</div>
                    </>
                  )}
                  <div className={`text-xs mt-2 ${canBorrow > 0 ? 'text-amber-500' : 'text-slate-600'}`}>
                    {canBorrow > 0
                      ? `🦈 ${canBorrow}🪙 credit available from the shark`
                      : 'No credit remaining'}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`rounded-2xl p-4 border ${
                  !anyBet
                    ? 'bg-slate-900 border-slate-800'
                    : allWon
                    ? 'bg-green-950/50 border-green-700'
                    : legResults.some(l => l.won)
                    ? 'bg-blue-950/30 border-blue-800'
                    : 'bg-red-950/30 border-red-900'
                }`}
              >
                {!anyBet ? (
                  <div className="text-slate-500 text-center">No bet placed</div>
                ) : (
                  <>
                    {/* Per-leg breakdown */}
                    <div className="space-y-2 mb-3">
                      {legResults.map((leg, i) => (
                        <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${leg.won ? 'bg-green-900/30' : 'bg-red-900/20'}`}>
                          <span className={`text-xs font-black w-5 ${leg.won ? 'text-green-400' : 'text-red-400'}`}>
                            {leg.cfg.shortLabel}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-semibold truncate">{leg.horse?.name}</div>
                            <div className="text-slate-500 text-xs">
                              {leg.won
                                ? `${placeLabel(leg.position)} ✓`
                                : leg.position >= 0
                                ? `${placeLabel(leg.position)} — needed top ${leg.cfg.positions}`
                                : 'Did not finish'}
                            </div>
                          </div>
                          <div className={`text-sm font-bold flex-shrink-0 ${leg.won ? 'text-green-400' : 'text-red-400'}`}>
                            {leg.won ? `+${leg.payout}` : `-${leg.amount}`}🪙
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Parlay bonus */}
                    {allWon && legResults.length >= 2 && (
                      <div className="mb-3 p-2.5 rounded-lg bg-purple-950/50 border border-purple-600/50 text-center">
                        <div className="text-purple-300 font-black text-sm">🎲 PARLAY BONUS ×{parlayMult}</div>
                        <div className="text-xs text-slate-400">
                          {straightTotal}🪙 straight → <span className="text-purple-200 font-bold">{finalPayout}🪙</span>
                        </div>
                      </div>
                    )}

                    {/* Net summary */}
                    <div className="text-center pt-2 border-t border-slate-700/50">
                      <div className={`text-3xl font-black ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {net >= 0 ? `+${net}` : net}🪙
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">net result</div>
                    </div>
                  </>
                )}
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-slate-500 text-xs">Balance</div>
                  <div className="text-yellow-400 font-black text-2xl">{human.bux}🪙</div>
                  {hasLoan && (
                    <div className="text-red-500 text-xs mt-1">
                      Owes {human.loanBalance}🪙 · Vig after next race: +{nextVig}🪙
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Standings */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Standings</div>
              </div>
              {[...players].sort((a, b) => b.bux - a.bux).map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < players.length - 1 ? 'border-b border-slate-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 text-sm w-5">#{i + 1}</span>
                    <span className={`font-semibold ${p.isHuman ? 'text-yellow-400' : 'text-slate-300'}`}>
                      {p.name}{p.isHuman ? ' (you)' : ''}
                    </span>
                  </div>
                  <span className={`font-bold ${p.isHuman && p.bux === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {p.bux}🪙
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next / Forfeit */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <button
              onClick={onNext}
              className={`w-full py-4 font-black text-lg rounded-xl transition-all shadow-lg ${
                isBust
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                  : 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-yellow-500/20'
              }`}
            >
              {nextLabel}
            </button>
            {isBust && !gameOver && (
              <button
                onClick={onForfeit}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-semibold transition-all text-sm"
              >
                Forfeit Game
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
