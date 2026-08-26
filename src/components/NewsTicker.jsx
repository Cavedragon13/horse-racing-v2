function TickerItem({ item }) {
  if (item.type === 'tip') {
    const idx = item.text.indexOf(item.horseName)
    const before = idx >= 0 ? item.text.slice(0, idx) : item.text
    const after = idx >= 0 ? item.text.slice(idx + item.horseName.length) : ''
    return (
      <span className="mx-8 inline-flex items-center gap-2">
        <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest">Tip</span>
        <span>
          {before}
          {idx >= 0 && <span className="text-yellow-400 font-bold">{item.horseName}</span>}
          {after}
        </span>
      </span>
    )
  }
  return <span className="mx-8">{item.text}</span>
}

function TickerSegment({ items, hidden = false }) {
  return (
    <span className="ticker-segment inline-flex" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <TickerItem key={i} item={item} />
      ))}
    </span>
  )
}

export default function NewsTicker({ items }) {
  if (!items || items.length === 0) return null

  return (
    <div className="bg-slate-900 border-b border-slate-800 overflow-hidden select-none flex-shrink-0">
      <div className="flex items-stretch">
        <div className="flex-shrink-0 flex items-center gap-1.5 bg-yellow-500 text-slate-900 text-xs font-black uppercase tracking-widest px-3 z-10">
          📰 Track Report
        </div>
        <div className="flex-1 overflow-hidden py-1.5">
          <div className="ticker-track flex whitespace-nowrap font-mono text-xs text-slate-400">
            <TickerSegment items={items} />
            <TickerSegment items={items} hidden />
          </div>
        </div>
      </div>
    </div>
  )
}
