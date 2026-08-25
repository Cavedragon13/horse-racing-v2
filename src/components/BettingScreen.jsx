import { useState } from 'react'
import { GAME_CONFIG, LOAN_SHARK, BETTING_TYPES, PARLAY_BONUS } from '../utils/constants'
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

function buildBetOptions(maxBux) {
  if (maxBux <= 0) return []
  const steps = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
  return steps.filter(b => b < maxBux)
}

export default function BettingScreen({ gs, onRace, onLoan, onRepay, onForfeit }) {
  const { day, race, players, currentRace, dayStartBux, totalRaces } = gs
  const cumRace = (day - 1) * GAME_CONFIG.RACES_PER_DAY + race
  const { horses, type, distance, odds } = currentRace

  const human = players.find(p => p.isHuman)

  // Ticket: array of { betType, horseId, amount }
  const [ticket, setTicket] = useState([])
  const [selectedType, setSelectedType] = useState('WIN')
  const [selectedId, setSelectedId] = useState(null)
  const [betAmount, setBetAmount] = useState(0)

  const isBust = human.bux <= 0
  const canBorrow = maxLoanAvailable(human, dayStartBux)
  const hasLoan = (human.loanBalance || 0) > 0
  const showShark = hasLoan || isBust || human.bux < 25

  const totalTicketStake = ticket.reduce((s, l) => s + l.amount, 0)
  const remainingBux = human.bux - totalTicketStake
  const betOptions = buildBetOptions(remainingBux)

  const sorted = [...horses].sort((a, b) => odds[a.id] - odds[b.id])
  const selected = horses.find(h => h.id === selectedId)

  const ticketTypes = new Set(ticket.map(l => l.betType))
  const ticketHorseIds = new Set(ticket.map(l => l.horseId))

  // Types available to add (not yet in ticket)
  const availableTypes = Object.keys(BETTING_TYPES).filter(k => !ticketTypes.has(k))

  // Ensure selectedType is always valid
  const activeType = ticketTypes.has(selectedType)
    ? (availableTypes[0] || null)
    : selectedType

  const betConfig = BETTING_TYPES[activeType] || BETTING_TYPES.WIN
  const effectiveOdds = selected ? Math.max(betConfig.minOdds, odds[selectedId] * betConfig.rate) : 1
  const potentialWin = (selected && betAmount > 0) ? Math.floor(betAmount * effectiveOdds) : 0

  const canAddLeg = selected && betAmount > 0 && activeType && ticket.length < 3 && !ticketTypes.has(activeType)

  // Parlay info
  const parlayMult = ticket.length >= 2 ? (PARLAY_BONUS[ticket.length] || null) : null
  const ticketStraightPayout = ticket.reduce((sum, leg) => {
    const cfg = BETTING_TYPES[leg.betType] || BETTING_TYPES.WIN
    const eo = Math.max(cfg.minOdds, odds[leg.horseId] * cfg.rate)
    return sum + Math.floor(leg.amount * eo)
  }, 0)
  const parlayPayout = parlayMult ? Math.floor(ticketStraightPayout * parlayMult) : 0

  const addLeg = () => {
    if (!canAddLeg) return
    setTicket(prev => [...prev, { betType: activeType, horseId: selectedId, amount: betAmount }])
    setSelectedId(null)
    setBetAmount(0)
    // Advance selectedType to next available
    const nextAvail = availableTypes.filter(k => k !== activeType)
    if (nextAvail.length > 0) setSelectedType(nextAvail[0])
  }

  const removeLeg = (idx) => {
    setTicket(prev => prev.filter((_, i) => i !== idx))
  }

  const handleRace = () => {
    if (ticket.length > 0) {
      onRace(ticket)
    } else {
      onRace([])
    }
  }

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
            const isInTicket = ticketHorseIds.has(horse.id)
            const isFav = idx === 0
            return (
              <div
                key={horse.id}
                onClick={() => {
                  if (isInTicket) return
                  setSelectedId(isSelected ? null : horse.id)
                  setBetAmount(0)
                }}
                className={`rounded-xl border transition-all ${
                  isInTicket
                    ? 'border-green-700 bg-green-950/20 cursor-default'
                    : isSelected
                    ? 'border-yellow-500 bg-yellow-500/8 cursor-pointer'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-600 cursor-pointer'
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
                      {isInTicket && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                          ON TICKET
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

            {/* Ticket legs */}
            {ticket.length > 0 && (
              <div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                  Your Ticket
                </div>
                <div className="space-y-1.5">
                  {ticket.map((leg, i) => {
                    const legHorse = horses.find(h => h.id === leg.horseId)
                    const cfg = BETTING_TYPES[leg.betType] || BETTING_TYPES.WIN
                    const eo = Math.max(cfg.minOdds, odds[leg.horseId] * cfg.rate)
                    const payout = Math.floor(leg.amount * eo)
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700">
                        <span className="text-xs font-black text-yellow-400 w-6 flex-shrink-0">{cfg.shortLabel}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-semibold truncate">{legHorse?.name}</div>
                          <div className="text-slate-500 text-xs">{leg.amount}🪙 @ {eo.toFixed(1)}x → {payout}🪙</div>
                        </div>
                        <button
                          onClick={() => removeLeg(i)}
                          className="text-slate-600 hover:text-red-400 text-sm transition-colors flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Parlay info */}
                {parlayMult && (
                  <div className="mt-2 p-2.5 rounded-lg bg-purple-950/50 border border-purple-700/50">
                    <div className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-0.5">
                      🎲 Parlay ×{parlayMult}
                    </div>
                    <div className="text-slate-400 text-xs">
                      If all {ticket.length} hit: <span className="text-purple-300 font-bold">{parlayPayout}🪙</span>
                      <span className="text-slate-600"> (straight: {ticketStraightPayout}🪙)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add leg section */}
            {!isBust && availableTypes.length > 0 && (
              <div>
                {/* Bet type tabs */}
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                  {ticket.length === 0 ? 'Bet Type' : 'Add Another Leg'}
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {Object.entries(BETTING_TYPES).map(([key, cfg]) => {
                    const alreadyAdded = ticketTypes.has(key)
                    const active = activeType === key && !alreadyAdded
                    return (
                      <button
                        key={key}
                        onClick={() => { if (!alreadyAdded) setSelectedType(key) }}
                        disabled={alreadyAdded}
                        className={`py-2 rounded-xl border flex flex-col items-center transition-all ${
                          alreadyAdded
                            ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                            : active
                            ? 'bg-yellow-500 border-yellow-400 text-slate-900'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span className="font-black text-sm">{cfg.label}</span>
                        <span className={`text-xs leading-none mt-0.5 ${active ? 'text-slate-700' : alreadyAdded ? 'text-slate-600' : 'text-slate-500'}`}>
                          {cfg.positions === 1 ? '1st only' : cfg.positions === 2 ? 'Top 2' : 'Top 3'}
                        </span>
                        {selected && !alreadyAdded && (
                          <span className={`font-bold text-xs mt-1 ${active ? 'text-slate-800' : 'text-yellow-400'}`}>
                            {Math.max(cfg.minOdds, odds[selected.id] * cfg.rate).toFixed(1)}x
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Selected horse */}
                {selected ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-yellow-500/30 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ backgroundColor: selected.color }}
                    >
                      {selected.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">{selected.name}</div>
                      <div className="text-slate-500 text-xs">Win odds: {odds[selected.id]}x</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-slate-600 text-sm mb-3">
                    {isBust ? 'Borrow from the shark to play' : '← Select a horse'}
                  </div>
                )}

                {/* Bet amount */}
                {selected && (
                  <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
                      Amount
                      {totalTicketStake > 0 && (
                        <span className="text-slate-600 font-normal ml-2">({remainingBux}🪙 left)</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                      {betOptions.map(amt => (
                        <button
                          key={amt}
                          onClick={() => setBetAmount(betAmount === amt ? 0 : amt)}
                          className={`py-2 rounded-lg font-bold text-sm transition-all ${
                            betAmount === amt
                              ? 'bg-yellow-500 text-slate-900'
                              : 'bg-slate-800 text-white hover:bg-slate-700'
                          }`}
                        >
                          {amt}
                        </button>
                      ))}
                      {remainingBux > 0 && (
                        <button
                          onClick={() => setBetAmount(betAmount === remainingBux ? 0 : remainingBux)}
                          className={`py-2 rounded-lg font-bold text-xs transition-all col-span-3 ${
                            betAmount === remainingBux
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          All In ({remainingBux}🪙)
                        </button>
                      )}
                    </div>
                    {betAmount > 0 && selected && (
                      <div className="text-xs text-slate-600 text-center mb-2">
                        net +{potentialWin - betAmount}🪙
                      </div>
                    )}
                    <button
                      onClick={addLeg}
                      disabled={!canAddLeg}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                        canAddLeg
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {canAddLeg
                        ? `Add ${BETTING_TYPES[activeType]?.label} · ${selected.name} · ${betAmount}🪙`
                        : 'Pick horse + amount'}
                    </button>
                  </div>
                )}
              </div>
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
              onClick={handleRace}
              disabled={ticket.length === 0}
              className={`w-full py-3.5 rounded-xl font-black text-lg transition-all ${
                ticket.length > 0
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-500/20'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              {ticket.length === 0
                ? 'Build your ticket'
                : ticket.length === 1
                ? `Race! · Wagering ${totalTicketStake}🪙`
                : `Race Parlay! · ${totalTicketStake}🪙 → up to ${parlayPayout}🪙`}
            </button>
            <button
              onClick={() => onRace([])}
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
