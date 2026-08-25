import {
  RACE_CONFIG, STAT_WEIGHTS, GAME_CONFIG, COME_FROM_BEHIND,
  HORSE_COLORS, HORSE_NUMBERS, AI_BETTING, HEALTH_MODIFIERS,
  STAT_RANGES, BETTING_CONFIG, BETTING_TYPES, PARLAY_BONUS, RACE_PHASES, PLAYER_DATA_KEY, LOAN_SHARK,
} from './constants.js';

const HORSE_NAMES = [
  'Thunder Bolt', 'Silver Wind', 'Golden Arrow', 'Dark Star',
  'Lucky Charm', 'Iron Will', 'Swift Shadow', 'Red Fury',
  'Blue Moon', 'Storm Chaser', 'Desert Rose', 'Midnight Sun',
  'Wild Spirit', 'Copper King', 'Jade Runner', 'Steel Heart',
  'Fire Dancer', 'Ocean Wave', 'Forest Flash', 'Mountain Peak',
  'Crystal Clear', 'Diamond Rush', 'Emerald Isle', 'Sunset Rider',
  'Dawn Breaker', 'Twilight Star', 'Scarlet Fox', 'Arctic Wolf',
  'Neon Dream', 'Blazing Trail', 'Shadow Dancer', 'Glory Run',
  'Rapid Fire', 'Silver Lining', 'Golden Gate', 'Brave Heart',
  'Wind Rider', 'Sun Dancer', 'Moon Shadow', 'Sky Blazer',
  'River Rush', 'Valley Run', 'Peak Climber', 'Sea Breeze',
  'Noble Quest', 'Star Gazer', 'Earth Shaker', 'Copper Flash',
  'Midnight Blaze', 'Desert Wind',
];

const JOCKEY_NAMES = [
  'J. Santos', 'M. Garcia', 'T. Williams', 'R. Johnson',
  'A. Martinez', 'D. Lee', 'K. Brown', 'P. Taylor',
  'S. Chen', 'O. Diaz', 'F. Kim', 'B. Nguyen',
];

const AI_NAMES = ['Dusty Trail', 'Lucky Pete', 'Big Money', 'The Gambler'];

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function generateHorse(usedNames = new Set(), usedNumbers = new Set()) {
  const availableNames = HORSE_NAMES.filter(n => !usedNames.has(n));
  const name = availableNames.length > 0 ? pick(availableNames) : `Horse #${randInt(100, 999)}`;

  let number, attempts = 0;
  do {
    number = randInt(HORSE_NUMBERS.MIN, HORSE_NUMBERS.MAX);
    attempts++;
  } while (usedNumbers.has(number) && attempts < 100);

  return {
    id: `h-${Math.random().toString(36).substr(2, 9)}`,
    name,
    number,
    color: HORSE_COLORS[Math.floor(Math.random() * HORSE_COLORS.length)],
    jockey: pick(JOCKEY_NAMES),
    stats: {
      topSpeed: randInt(STAT_RANGES.MIN, STAT_RANGES.MAX),
      stamina:  randInt(STAT_RANGES.MIN, STAT_RANGES.MAX),
      sprint:   randInt(STAT_RANGES.MIN, STAT_RANGES.MAX),
      pace:     randInt(STAT_RANGES.MIN, STAT_RANGES.MAX),
      gate:     randInt(STAT_RANGES.MIN, STAT_RANGES.MAX),
    },
    health: randInt(1, 10),
  };
}

export function generateRace() {
  const type = pick(RACE_CONFIG.TYPES);
  const distRange = RACE_CONFIG.DISTANCES[type.toUpperCase()];
  const distance = randInt(distRange.MIN, distRange.MAX);
  const numHorses = randInt(RACE_CONFIG.HORSES_PER_RACE.MIN, RACE_CONFIG.HORSES_PER_RACE.MAX);

  const usedNames = new Set();
  const usedNumbers = new Set();
  const horses = [];

  for (let i = 0; i < numHorses; i++) {
    const horse = generateHorse(usedNames, usedNumbers);
    usedNames.add(horse.name);
    usedNumbers.add(horse.number);
    horses.push(horse);
  }

  return { type, distance, horses };
}

export function calculateOdds(horses, raceType) {
  const weights = STAT_WEIGHTS[raceType.toUpperCase()];
  const scores = {};

  horses.forEach(horse => {
    let score = Object.entries(weights).reduce(
      (sum, [stat, w]) => sum + horse.stats[stat] * w, 0
    );
    if (horse.health <= HEALTH_MODIFIERS.POOR_HEALTH_THRESHOLD) score *= 0.85;
    else if (horse.health === HEALTH_MODIFIERS.PERFECT_HEALTH) score *= 1.05;
    scores[horse.id] = score;
  });

  const maxScore = Math.max(...Object.values(scores));
  const odds = {};

  horses.forEach(horse => {
    const norm = scores[horse.id] / maxScore;
    const base = BETTING_CONFIG.BASE_ODDS + (1 - norm) * 8;
    const rf = rand(BETTING_CONFIG.ODDS_RANDOM_FACTOR.MIN, BETTING_CONFIG.ODDS_RANDOM_FACTOR.MAX);
    odds[horse.id] = Math.max(BETTING_CONFIG.MIN_ODDS, +(base * rf).toFixed(1));
  });

  return odds;
}

export function initRaceState(horses, raceType) {
  const weights = STAT_WEIGHTS[raceType.toUpperCase()];
  const positions = {};
  const speeds = {};

  horses.forEach(horse => {
    positions[horse.id] = 0;
    const weighted = Object.entries(weights).reduce(
      (sum, [stat, w]) => sum + horse.stats[stat] * w, 0
    );
    let healthMod = 1.0;
    if (horse.health <= HEALTH_MODIFIERS.POOR_HEALTH_THRESHOLD) healthMod = 0.88;
    else if (horse.health === HEALTH_MODIFIERS.PERFECT_HEALTH) healthMod = 1.05;
    speeds[horse.id] = (weighted / 10) * 0.0065 * healthMod;
  });

  return {
    positions,
    speeds,
    finished: [],
    dnf: [],
    tick: 0,
    comeFromBehind: { usedThisRace: 0, activeHorse: null, endTick: null },
    done: false,
  };
}

export function tickRace(state, horses) {
  if (state.done) return state;

  const newPositions = { ...state.positions };
  const newFinished = [...state.finished];
  const newDnf = [...state.dnf];
  let cfb = { ...state.comeFromBehind };
  const tick = state.tick + 1;

  const unfinished = horses.filter(h => !newFinished.includes(h.id));

  // Trigger come-from-behind (at most once per race, ~0.3% chance per tick)
  if (!cfb.activeHorse && cfb.usedThisRace < 1 && unfinished.length > 2) {
    const leadPos = Math.max(...unfinished.map(h => newPositions[h.id]));
    if (leadPos > COME_FROM_BEHIND.START_RANGE.MIN && Math.random() < 0.003) {
      const byPos = unfinished
        .map(h => ({ id: h.id, pos: newPositions[h.id] }))
        .sort((a, b) => a.pos - b.pos);
      const backHalf = byPos.slice(0, Math.ceil(byPos.length / 2));
      const chosen = backHalf[Math.floor(Math.random() * backHalf.length)];
      const remaining = 1 - chosen.pos;
      const durationTicks = Math.floor((remaining * COME_FROM_BEHIND.MAX_DURATION_RATIO) / state.speeds[chosen.id]);
      cfb = { usedThisRace: 1, activeHorse: chosen.id, endTick: tick + durationTicks };
    }
  }

  if (cfb.activeHorse && tick > cfb.endTick) {
    cfb = { ...cfb, activeHorse: null };
  }

  horses.forEach(horse => {
    if (newFinished.includes(horse.id)) return;

    const progress = newPositions[horse.id];
    let speed = state.speeds[horse.id] * rand(0.85, 1.15);

    if (progress < RACE_PHASES.GATE_PHASE) {
      speed *= 0.7 + (horse.stats.gate / 10) * 0.5;
    } else if (progress > RACE_PHASES.SPRINT_PHASE) {
      speed *= 0.8 + (horse.stats.sprint / 10) * 0.4;
    } else {
      speed *= 0.9 + (horse.stats.pace / 10) * 0.2;
    }

    if (cfb.activeHorse === horse.id) speed *= 2.0;

    const newPos = Math.min(1.0, progress + speed);
    newPositions[horse.id] = newPos;
    if (newPos >= 1.0) newFinished.push(horse.id);
  });

  // After the top 3 have placed, instantly finish all remaining horses (no DNF)
  if (newFinished.length >= 3) {
    horses.forEach(horse => {
      if (!newFinished.includes(horse.id)) {
        newPositions[horse.id] = 1.0;
        newFinished.push(horse.id);
      }
    });
  }

  const done = newFinished.length === horses.length;
  return { ...state, positions: newPositions, finished: newFinished, dnf: newDnf, tick, comeFromBehind: cfb, done };
}

export function createPlayer(name, isHuman = true) {
  return {
    id: `p-${Math.random().toString(36).substr(2, 9)}`,
    name, bux: GAME_CONFIG.STARTING_BUX, isHuman,
    wins: 0, totalWon: 0, totalLost: 0,
    loanBalance: 0,
  };
}

// Returns how many bux the player can still borrow today
export function maxLoanAvailable(player, dayStartBux) {
  const cap = Math.max(LOAN_SHARK.MIN_LOAN, Math.floor(dayStartBux * LOAN_SHARK.MAX_LOAN_FACTOR));
  return Math.max(0, cap - (player.loanBalance || 0));
}

export function takeLoan(player, amount) {
  return {
    ...player,
    bux: player.bux + amount,
    loanBalance: (player.loanBalance || 0) + amount,
  };
}

export function repayLoan(player, amount) {
  const actual = Math.min(amount, player.loanBalance || 0, player.bux);
  return {
    ...player,
    bux: player.bux - actual,
    loanBalance: (player.loanBalance || 0) - actual,
  };
}

// Accrue vig on outstanding balance — called between each race
export function accrueVig(player) {
  if (!player.loanBalance || player.loanBalance <= 0) return player;
  const vig = Math.ceil(player.loanBalance * LOAN_SHARK.VIG_RATE);
  return { ...player, loanBalance: player.loanBalance + vig };
}

export function createAIPlayer(index) {
  return { ...createPlayer(AI_NAMES[index] || `AI #${index + 1}`, false), isAI: true };
}

export function makeAIBet(player, horses, odds) {
  if (player.bux <= 0) return null;
  const sorted = [...horses].sort((a, b) => odds[a.id] - odds[b.id]);
  const roll = Math.random();
  let target;
  if (roll < AI_BETTING.FAVORITE_CHANCE) target = sorted[0];
  else if (roll < AI_BETTING.FAVORITE_CHANCE + AI_BETTING.MIDDLE_CHANCE) target = sorted[Math.floor(sorted.length / 2)];
  else target = sorted[sorted.length - 1];

  const maxBet = Math.max(1, Math.floor(player.bux * AI_BETTING.MAX_BET_RATIO));
  const increments = [1, 5, 10, 25].filter(b => b <= maxBet);
  const amount = increments.length > 0 ? pick(increments) : 1;
  return { horseId: target.id, amount };
}

// bets[playerId] is an array of legs: [{ horseId, amount, betType }, ...]
// finishOrder: array of horse IDs in finishing order (1st, 2nd, 3rd, ...)
export function applyBetResults(players, bets, finishOrder, odds) {
  return players.map(player => {
    const raw = bets[player.id];
    if (!raw) return player;

    // Normalize: support both legacy single-object and new array format
    const legs = Array.isArray(raw) ? raw : [raw];

    let straightPayout = 0;
    let totalStake = 0;
    let allWon = true;

    legs.forEach(leg => {
      const betType = (leg.betType || 'WIN').toUpperCase();
      const config = BETTING_TYPES[betType] || BETTING_TYPES.WIN;
      const horseIdx = finishOrder.indexOf(leg.horseId);
      const won = horseIdx >= 0 && horseIdx < config.positions;
      totalStake += leg.amount;
      if (won) {
        const effectiveOdds = Math.max(config.minOdds, odds[leg.horseId] * config.rate);
        straightPayout += Math.floor(leg.amount * effectiveOdds);
      } else {
        allWon = false;
      }
    });

    const parlayMult = (allWon && legs.length >= 2) ? (PARLAY_BONUS[legs.length] || 1) : 1;
    const finalPayout = Math.floor(straightPayout * parlayMult);
    const buxChange = finalPayout - totalStake;

    return {
      ...player,
      bux: Math.max(0, player.bux + buxChange),
      wins: player.wins + (allWon ? 1 : 0),
      totalWon: (player.totalWon || 0) + finalPayout,
      totalLost: (player.totalLost || 0) + Math.max(0, totalStake - finalPayout),
    };
  });
}

export function savePlayerData(playerName, bux) {
  try { localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify({ playerName, bux, savedAt: Date.now() })); } catch (_) {}
}

export function loadPlayerData() {
  try { const d = localStorage.getItem(PLAYER_DATA_KEY); return d ? JSON.parse(d) : null; } catch (_) { return null; }
}

export function clearPlayerData() {
  try { localStorage.removeItem(PLAYER_DATA_KEY); } catch (_) {}
}
