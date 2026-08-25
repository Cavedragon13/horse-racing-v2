# Horse Racing Simulator v2

A browser-based horse racing sim by Seed 13 Productions. Bet Win/Place/Show and parlay
tickets against up to 3 AI opponents across a run of races, using play-money 🪙 only —
no real wagering.

Live: <https://cavedragon13.github.io/horse-racing-v2/>

## Features

- Win / Place / Show betting with parlay tickets (up to 3 legs, ×2/×5 bonus for a clean sweep)
- AI opponents with their own betting behavior
- A loan shark for when you go bust, with per-race vig
- Persistent Hall of Fame leaderboard (localStorage + optional Supabase sync)
- In-app "How to Play" reference

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run deploy   # publish dist/ to GitHub Pages
```

Built with React 19 + Vite + Tailwind CSS.

## Disclaimer

For entertainment purposes only. No real money, wagering, or gambling is involved.
