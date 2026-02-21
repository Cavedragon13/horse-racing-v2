import { useState } from 'react'
import { GAME_CONFIG, LOAN_SHARK, BETTING_TYPES } from '../utils/constants'
import { maxLoanAvailable } from '../utils/gameLogic'

const STAT_LABEL = { topSpeed: 'Speed', stamina: 'Stamina', sprint: 'Sprint', pace: 'Pace', gate: 'Gate' }
const TYPE_COLOR = { Short: 'text-green-400', Medium: 'text-blue-400', Long: 'text-purple-400' }

function StatDots({ value, max = 10 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-sm ${
            i < value
              ? value >= 8 ? 'bg-green-500' : value >= 5 ? 'bg-yellow-500' : 'bg-red-500'
              : 'bg-slate-700'
          }`}
        />
      ))}
    </div>
  )
}

function LoanSharkPanel({ human, dayStartBux, onLoan, onRepay }) {
  const canBorrow = maxLoanAvailable(human, dayStartBux)
  const hasLoan = (human.loanBalance || 0) > 0
  const nextVig = hasLoan ? Math.ceil(human.loanBalance * LOAN_SHARK.VIG_RATE) : 0
  const maxRepay = Math.min(human.bux, human.loanBalance || 0)
  const repayOptions = [5, 10, 25, 50].filter(a => a < maxRepay)

  return (
    <div className={`rounded-xl border overflow-hidden ${hasLoan ? 'border-red-800' : 'border-slate-700'}`}>
      <div className={`px-4 py-2.5 flex items-center gap-2 ${hasLoan ? 'bg-red-950/60' : 'bg-slate-800/60'}`}>
        <span className="text-lg">🦈</span>
        <span className="text-xs font-black uppercase tracking-widest text-slate-300">The Loan Shark</span>
        {hasLoan && (
          <span className="ml-auto text-xs text-red-400 font-bold">
            Vig: {Math.round(LOAN_SHARK.VIG_RATE * 100)}%/race
          </span>
        )}
      </div>

      <div className="bg-slate-900 p-3 space-y-3">
        {hasLoan && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Outstanding</span>
              <span className="text-red-400 font-bold">{human.loanBalance}🪙</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Next vig (after this race)</span>
              <span className="text-orange-400 font-semibold">+{nextVig}🪙</span>
            </div>
          </div>
        )}

        {canBorrow > 0 && (
          <div>
            <div className="text-slate-500 text-xs mb-1.5">
              Credit available: <span className="text-slate-300 font-semibold">{canBorrow}🪙</span>
            </div>
            <button
              onClick={() => onLoan(canBorrow)}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-all"
            >
              Borrow {canBorrow}🪙
            </button>
          </div>
        )}

        {canBorrow === 0 && !hasLoan && (
          <div className="text-slate-600 text-xs text-center py-1">No credit available today</div>
        )}

        {hasLoan && maxRepay > 0 && (
          <div>
            <div className="text-slate-500 text-xs mb-1.5">Repay</div>
            <div className="flex flex-wrap gap-1.5">
              {repayOptions.map(amt => (
                <button
                  key={amt}
                  onClick={() => onRepay(amt)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all"
                >
                  {amt}🪙
                </button>
              ))}
              <button
                onClick={() => onRepay(maxRepay)}
                className="flex-1 py-1.5 bg-green-900 hover:bg-green-800 text-green-300 text-xs font-bold rounded-lg transition-all"
              >
                All ({maxRepay}🪙)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BettingScreen({ gs, onRace, onLoan, onRepay, onForfeit }) {
  const { day, race, players, currentRace, dayStartBux, totalRaces } = gs
  const cumRace = (day - 1) * GAME_CONFIG.RACES_PER_DAY + race
  const { horses, type, distance, odds } = currentRace

  const human = players.find(p => p.isHuman)
  const [selectedId, setSelectedId] = useState(null)
  const [betAmount, setBetAmount] = useState(0)
  const [betType, setBetType] = useState('WIN')

  const isBust = human.bux <= 0
  const canBorrow = maxLoanAvailable(human, dayStartBux)
  const hasLoan = (human.loanBalance || 0) > 0
  const showShark = hasLoan || isBust || human.bux < 25

  const sorted = [...horses].sort((a, b) => odds[a.id] - odds[b.id])
  const betOptions = [1, 5, 10, 25].filter(b => b <= human.bux)
  const selected = horses.find(h => h.id === selectedId)
  const canBet = selected && betAmount > 0
  const betConfig = BETTING_TYPES[betType] || BETTING_TYPES.WIN
  const effectiveOdds = selected ? Math.max(betConfig.minOdds, odds[selectedId] * betConfig.rate) : 1
  const potentialWin = canBet ? Math.floor(betAmount * effectiveOdds) : 0

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top header bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-slate-500 text-xs uppercase tracking-widest">
            {totalRaces === Infinity ? `Race ${cumRace}` : `Race ${cumRace} / ${totalRaces}`}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`font-bold text-xl ${TYPE_COLOR[type] || 'text-white'}`}>{type}</span>
            <span className="text-slate-500">— {distance} furlongs</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-4">
            {[...players].sort((a, b) => b.bux - a.bux).map((p, i) => (
              <div key={p.id} className={`text-sm ${p.isHuman ? 'text-yellow-400 font-bold' : 'text-slate-400'}`}>
                #{i + 1} {p.name} {p.bux}🪙
              </div>
            ))}
          </div>
          <div className="border-l border-slate-700 pl-6">
            <div className="text-slate-500 text-xs">Your balance</div>
            <div className={`font-black text-2xl leading-none ${isBust ? 'text-red-400' : 'text-yellow-400'}`}>
              {human.bux}🪙
            </div>
            {hasLoan && (
              <div className="text-red-500 text-xs mt-0.5">owes {human.loanBalance}🪙</div>
            )}
          </div>
        </div>
      </div>

      {/* Bust banner */}
      {isBust && (
        <div className="bg-red-950/80 border-b border-red-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💸</span>
            <div>
              <div className="text-red-400 font-black text-lg">You're Broke!</div>
              <div className="text-red-500 text-sm">
                {canBorrow > 0
                  ? 'See the shark in the sidebar to borrow, or forfeit.'
                  : 'No credit remaining. Watch the race or forfeit.'}
              </div>
            </div>
          </div>
          <button
            onClick={onForfeit}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm font-bold rounded-lg transition-all"
          >
            Forfeit Game
          </button>
        </div>
      )}

      {/* Two-column body */}
      <div className="flex-1 flex min-h-0">

        {/* Left: horse list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sorted.map((horse, idx) => {
            const isSelected = horse.id === selectedId
            const isFav = idx === 0
            return (
              <div
                key={horse.id}
                onClick={() => { setSelectedId(isSelected ? null : horse.id); setBetAmount(0) }}
                className={`rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-yellow-500 bg-yellow-500/8'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ backgroundColor: horse.color }}
                  >
                    {horse.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-lg">{horse.name}</span>
                      {isFav && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                          FAV
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-sm">
                      🏇 {horse.jockey} · ❤️ {horse.health}/10
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
                    {Object.entries(horse.stats).map(([stat, val]) => (
                      <div key={stat} className="text-center">
                        <div className="text-slate-600 text-xs mb-1">{STAT_LABEL[stat]}</div>
                        <StatDots value={val} />
                      </div>
                    ))}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-yellow-400 font-black text-2xl leading-none">{odds[horse.id]}x</div>
                    <div className="text-slate-600 text-xs">odds</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="lg:hidden px-3 pb-3 pt-1 border-t border-slate-800">
                    <div className="grid grid-cols-5 gap-3">
                      {Object.entries(horse.stats).map(([stat, val]) => (
                        <div key={stat}>
                          <div className="text-slate-500 text-xs mb-1">{STAT_LABEL[stat]}</div>
                          <StatDots value={val} />
                          <div className="text-slate-400 text-xs mt-0.5">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: bet panel */}
        <div className="w-72 flex-shrink-0 border-l border-slate-800 flex flex-col bg-slate-900/50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {selected ? (
              <div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
                  Betting on
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-yellow-500/30">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ backgroundColor: selected.color }}
                  >
                    {selected.number}
                  </div>
                  <div>
                    <div className="font-bold text-white">{selected.name}</div>
                    <div className="text-slate-500 text-xs">Win odds: {odds[selected.id]}x</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🐎</div>
                <div className="text-slate-500 text-sm">
                  {isBust ? 'Borrow from the shark to keep playing' : 'Select a horse to bet on'}
                </div>
              </div>
            )}

            {selected && !isBust && (
              <>
                {/* Win / Place / Show selector */}
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                    Bet type
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(BETTING_TYPES).map(([key, cfg]) => {
                      const eo = Math.max(cfg.minOdds, odds[selected.id] * cfg.rate)
                      const active = betType === key
                      return (
                        <button
                          key={key}
                          onClick={() => setBetType(key)}
                          className={`py-2 rounded-xl border flex flex-col items-center transition-all ${
                            active
                              ? 'bg-yellow-500 border-yellow-400 text-slate-900'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <span className="font-black text-sm">{cfg.label}</span>
                          <span className={`text-xs leading-none mt-0.5 ${active ? 'text-slate-700' : 'text-slate-500'}`}>
                            {cfg.positions === 1 ? '1st only' : cfg.positions === 2 ? 'Top 2' : 'Top 3'}
                          </span>
                          <span className={`font-bold text-xs mt-1 ${active ? 'text-slate-800' : 'text-yellow-400'}`}>
                            {eo.toFixed(1)}x
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bet amount */}
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                    Bet amount
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {betOptions.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setBetAmount(betAmount === amt ? 0 : amt)}
                        className={`py-2.5 rounded-lg font-bold transition-all ${
                          betAmount === amt
                            ? 'bg-yellow-500 text-slate-900'
                            : 'bg-slate-800 text-white hover:bg-slate-700'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                    {human.bux > 0 && (
                      <button
                        onClick={() => setBetAmount(betAmount === human.bux ? 0 : human.bux)}
                        className={`py-2.5 rounded-lg font-bold transition-all col-span-3 ${
                          betAmount === human.bux
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        All In ({human.bux}🪙)
                      </button>
                    )}
                  </div>
                  {canBet && (
                    <div className="text-sm text-slate-400 text-center">
                      Payout: <span className="text-green-400 font-bold">{potentialWin}🪙</span>
                      <span className="text-slate-600 ml-1">(net +{potentialWin - betAmount})</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {showShark && (
              <LoanSharkPanel
                human={human}
                dayStartBux={dayStartBux}
                onLoan={onLoan}
                onRepay={onRepay}
              />
            )}

            <div className="md:hidden">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Standings</div>
              {[...players].sort((a, b) => b.bux - a.bux).map((p, i) => (
                <div key={p.id} className="flex justify-between text-sm py-1">
                  <span className={p.isHuman ? 'text-yellow-400 font-bold' : 'text-slate-400'}>
                    #{i + 1} {p.name}
                  </span>
                  <span className="text-yellow-400 font-bold">{p.bux}🪙</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => canBet && onRace(selectedId, betAmount, betType)}
              disabled={!canBet}
              className={`w-full py-3.5 rounded-xl font-black text-lg transition-all ${
                canBet
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-500/20'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              {canBet ? `${betConfig.label} ${betAmount}🪙 → Race!` : 'Pick horse + amount'}
            </button>
            <button
              onClick={() => onRace(null, 0)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-semibold transition-all text-sm"
            >
              {isBust ? 'Watch Race (no bet)' : 'Skip Bet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
