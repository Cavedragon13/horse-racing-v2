import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (url && key) ? createClient(url, key) : null

export async function fetchRemoteLeaderboard() {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('horse_racing_leaderboard')
      .select('initials, score, scored_at')
      .order('score', { ascending: false })
      .limit(10)
    if (error) throw error
    return data.map(r => ({
      initials: r.initials.trim(),
      score: r.score,
      date: new Date(r.scored_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: '2-digit',
      }),
    }))
  } catch (_) {
    return []
  }
}

export async function insertRemoteScore(initials, score) {
  if (!supabase) return
  try {
    await supabase
      .from('horse_racing_leaderboard')
      .insert({ initials: initials.toUpperCase().slice(0, 3), score })
  } catch (_) {}
}
