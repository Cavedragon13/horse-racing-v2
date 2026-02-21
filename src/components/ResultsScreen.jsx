import { GAME_CONFIG, LOAN_SHARK, BETTING_TYPES } from '../utils/constants'
import { maxLoanAvailable } from '../utils/gameLogic'

const MEDAL = ['🥇', '🥈', '🥉']
const BET_TYPE_LABEL = { WIN: 'Win', PLACE: 'Place', SHOW: 'Show' }

export default function ResultsScreen({ gs, onNext, onForfeit }) {
  const { lastResult, players, day, race, gameOver, dayStartBux, totalRaces } = gs
  const { finishOrder, dnf = [], horses, odds, bets, raceDay, raceNum, raceType, raceDistance } = lastResult
  const cumRaceNum = (raceDay - 1) * GAME_CONFIG.RACES_PER_DAY + raceNum

  const human = players.find(p => p.isHuman)
  const humanBet = bets[human.id]
  const humanBetHorse = humanBet ? horses.find(h => h.id === humanBet.horseId) : null

  // Resolve win/place/show result
  const betType = (humanBet?.betType || 'WIN').toUpperCase()
  const betConfig = BETTING_TYPES[betType] || BETTING_TYPES.WIN
  const orderedFinishers = finishOrder.filter(id => !dnf.includes(id))
  const winnerId = orderedFinishers[0]
  const winner = horses.find(h => h.id === winnerId)
  const horsePosition = humanBet ? orderedFinishers.indexOf(humanBet.horseId) : -1
  const humanWon = humanBet && horsePosition >= 0 && horsePosition < betConfig.positions
  const effectiveOdds = humanWon ? Math.max(betConfig.minOdds, odds[humanBet.horseId] * betConfig.rate) : 0
  const payout = humanWon ? Math.floor(humanBet.amount * effectiveOdds) : 0
  const net = humanWon ? payout - humanBet.amount : -(humanBet?.amount || 0)

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
              return finishOrder.map((id, i) => {
                const horse = horses.find(h => h.id === id)
                const isBet = humanBet?.horseId === id
                const isDnf = dnf.includes(id)
                const placeIdx = isDnf ? -1 : placedFinishers.indexOf(id)
                const totalBet = Object.values(bets).filter(b => b.horseId === id).reduce((s, b) => s + b.amount, 0)
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
                      {isBet && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold ml-1">
                          {BET_TYPE_LABEL[betType]}
                        </span>
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
                {humanBet && (
                  <div className="text-slate-400 text-sm mb-3">
                    {humanBetHorse?.name} {humanWon ? 'came in!' : "didn't place"}
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
                className={`rounded-2xl p-5 border text-center ${
                  !humanBet
                    ? 'bg-slate-900 border-slate-800'
                    : humanWon
                    ? 'bg-green-950/50 border-green-700'
                    : 'bg-red-950/30 border-red-900'
                }`}
              >
                {!humanBet ? (
                  <div className="text-slate-500">No bet placed</div>
                ) : (
                  <>
                    <div className="text-slate-500 text-xs mb-1 uppercase tracking-widest">
                      {BET_TYPE_LABEL[betType]} bet · {humanBetHorse?.name}
                    </div>
                    <div className={`text-4xl font-black mb-1 ${humanWon ? 'text-green-400' : 'text-red-400'}`}>
                      {humanWon ? `+${payout}` : `-${humanBet.amount}`} 🪙
                    </div>
                    <div className="text-slate-400 text-sm">
                      {humanWon
                        ? `Finished ${horsePosition === 0 ? '1st' : horsePosition === 1 ? '2nd' : '3rd'} · net +${net}🪙`
                        : horsePosition >= 0
                          ? `Finished ${horsePosition + 1}${['st','nd','rd'][horsePosition] || 'th'} — needed top ${betConfig.positions}`
                          : `${humanBetHorse?.name} didn't finish`}
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
