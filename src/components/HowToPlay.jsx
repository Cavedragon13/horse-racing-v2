export function HowToPlayTeaser({ visible, onOpen, onDismiss }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 bg-slate-900 border border-yellow-500/40 rounded-full pl-4 pr-2 py-2 shadow-2xl shadow-black/40">
        <span className="text-sm text-slate-300">🐎 New to the track?</span>
        <button
          onClick={onOpen}
          className="text-sm font-bold text-slate-900 bg-yellow-500 hover:bg-yellow-400 rounded-full px-3 py-1.5 transition-colors"
        >
          How to Play
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-slate-500 hover:text-slate-300 w-7 h-7 flex items-center justify-center rounded-full transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-2">{title}</div>
      <div className="text-slate-300 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export function HowToPlayModal({ open, onClose }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-yellow-400">How to Play</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 hover:text-slate-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <Section title="Objective">
            <p>
              Start every tournament with 100🪙. Bet across a run of races and finish with more than
              you started — most 🪙 at the end wins. In <span className="text-slate-100 font-semibold">Until Bust</span> mode
              there's no finish line — just survive as long as you can.
            </p>
          </Section>

          <Section title="Placing a Bet">
            <p>Pick a horse from the list, choose a bet type, pick a stake, then add it to your ticket.</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                <div className="font-black text-white">Win</div>
                <div className="text-slate-500 text-xs mt-0.5">1st place only</div>
                <div className="text-slate-500 text-xs">full odds</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                <div className="font-black text-white">Place</div>
                <div className="text-slate-500 text-xs mt-0.5">top 2 finish</div>
                <div className="text-slate-500 text-xs">smaller odds</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                <div className="font-black text-white">Show</div>
                <div className="text-slate-500 text-xs mt-0.5">top 3 finish</div>
                <div className="text-slate-500 text-xs">smallest odds</div>
              </div>
            </div>
          </Section>

          <Section title="Parlay Tickets">
            <p>
              Add up to 3 legs to one ticket. Land <span className="text-purple-300 font-semibold">every</span> leg
              and the whole ticket pays a bonus multiplier — <span className="text-purple-300 font-semibold">×2</span> for
              2 legs, <span className="text-purple-300 font-semibold">×5</span> for 3. Miss one leg and the ticket
              still pays out on whichever legs did hit, just without the bonus.
            </p>
          </Section>

          <Section title="Odds & Horse Stats">
            <p>
              Odds update per race — favorites pay less, longshots pay more. Tap a horse on desktop, or expand it on
              mobile, to see its Speed, Stamina, Sprint, Pace, and Gate stats before you bet.
            </p>
          </Section>

          <Section title="🦈 The Loan Shark">
            <p>
              Run low on funds and the shark shows up. Borrow up to half of what you had at the start of the day —
              but every race you carry a balance, it grows by 25% vig. Pay it down before it snowballs.
            </p>
          </Section>

          <Section title="Winning">
            <p>
              After the last race, whoever's holding the most 🪙 takes the tournament. Your best runs land in the
              Hall of Fame on the title screen.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
