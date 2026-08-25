import { fetchRemoteLeaderboard, insertRemoteScore } from './supabase'

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
  // Fire-and-forget remote insert — does not block
  insertRemoteScore(initials, score)
  return top10
}

// Async: merges remote top-10 with local cache, returns merged array.
// Pass localData to skip re-reading localStorage (e.g. right after submitScore).
// Falls back to local data silently if Supabase is unavailable.
export async function loadLeaderboardWithRemote(localData) {
  const local = localData ?? loadLeaderboard()
  const remote = await fetchRemoteLeaderboard()
  if (remote.length === 0) return local
  // Deduplicate by initials+score, keep top-10 by score DESC
  const seen = new Set()
  const merged = [...remote, ...local]
    .filter(e => {
      const k = `${e.initials}:${e.score}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  try { localStorage.setItem(KEY, JSON.stringify(merged)) } catch (_) {}
  return merged
}
