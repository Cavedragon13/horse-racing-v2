const KEY = 'horseRacingLeaderboard'

export function loadLeaderboard() {
  try {
    const d = localStorage.getItem(KEY)
    return d ? JSON.parse(d) : []
  } catch (_) { return [] }
}

export function qualifiesForLeaderboard(score) {
  if (score <= 0) return false
  const entries = loadLeaderboard()
  return entries.length < 10 || score > entries[entries.length - 1].score
}

export function submitScore(initials, score) {
  const entries = loadLeaderboard()
  entries.push({
    initials: initials.toUpperCase().slice(0, 3),
    score,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
  })
  entries.sort((a, b) => b.score - a.score)
  const top10 = entries.slice(0, 10)
  try { localStorage.setItem(KEY, JSON.stringify(top10)) } catch (_) {}
  return top10
}
