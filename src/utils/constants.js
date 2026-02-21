/**
 * Game Constants and Configuration
 * Central location for all game configuration values
 */

// Player data persistence key
export const PLAYER_DATA_KEY = 'horseRacingPlayerData';

// Game configuration
export const GAME_CONFIG = {
  MAX_GAME_DAYS: 5,
  RACES_PER_DAY: 10,
  MAX_PLAYERS: 4,
  STARTING_BUX: 100,
  MAX_RACE_TIME_SECONDS: 120,
  RACE_UPDATE_INTERVAL_MS: 100,
  NOTIFICATION_DURATION_MS: 3000,
};

// Come-from-behind system
export const COME_FROM_BEHIND = {
  MAX_PER_DAY: 3,
  CHANCE_PER_RACE: 0.15,
  BACK_TO_BACK_CHANCE: 0.1,
  START_RANGE: { MIN: 0.3, MAX: 0.7 },
  MAX_DURATION_RATIO: 0.5,
};

// Race configuration
export const RACE_CONFIG = {
  TYPES: ['Short', 'Medium', 'Long'],
  DISTANCES: {
    SHORT: { MIN: 5, MAX: 7 },
    MEDIUM: { MIN: 8, MAX: 10 },
    LONG: { MIN: 11, MAX: 14 },
  },
  HORSES_PER_RACE: { MIN: 5, MAX: 8 },
  BASE_FURLONG_TIME: 12, // seconds
  SPEED_MULTIPLIER: 15,
};

// Stat weights for different race types
export const STAT_WEIGHTS = {
  SHORT: {
    topSpeed: 0.4,
    stamina: 0.1,
    sprint: 0.3,
    pace: 0.1,
    gate: 0.1,
  },
  MEDIUM: {
    topSpeed: 0.3,
    stamina: 0.2,
    sprint: 0.2,
    pace: 0.2,
    gate: 0.1,
  },
  LONG: {
    topSpeed: 0.2,
    stamina: 0.4,
    sprint: 0.1,
    pace: 0.2,
    gate: 0.1,
  },
};

// Loan shark configuration
export const LOAN_SHARK = {
  VIG_RATE: 0.25,         // 25% vig per race on outstanding balance
  MAX_LOAN_FACTOR: 0.50,  // max loan = 50% of day-start bux
  MIN_LOAN: 10,           // minimum available even if dayStartBux is tiny
};

// Betting configuration
export const BETTING_CONFIG = {
  INCREMENTS: [1, 5, 10, 25, 'All'],
  TYPES: ['Winner'],
  BASE_ODDS: 3,
  MIN_ODDS: 1.1,
  ODDS_RANDOM_FACTOR: { MIN: 0.8, MAX: 1.2 },
};

// Win / Place / Show payout configuration
// rate: multiplier applied to the horse's Win odds to compute Place/Show payout
export const BETTING_TYPES = {
  WIN:   { label: 'Win',   shortLabel: 'W', rate: 1.00, minOdds: 1.1, positions: 1 },
  PLACE: { label: 'Place', shortLabel: 'P', rate: 0.45, minOdds: 1.2, positions: 2 },
  SHOW:  { label: 'Show',  shortLabel: 'S', rate: 0.25, minOdds: 1.1, positions: 3 },
};

// Jockey system
export const JOCKEY_CONFIG = {
  FAMILIAR_CHANCE: 0.2,
  UNFAMILIAR_CHANCE: 0.1,
  FAMILIAR_PROBABILITY: 0.5,
};

// Race phase timing
export const RACE_PHASES = {
  GATE_PHASE: 0.1,
  MIDDLE_PHASE: 0.4,
  SPRINT_PHASE: 0.8,
};

// Horse number range
export const HORSE_NUMBERS = {
  MIN: 1,
  MAX: 50,
};

// Color palette for horses
export const HORSE_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#d35400', '#27ae60', '#8e44ad', '#16a085',
  '#e67e22', '#2980b9', '#c0392b', '#7f8c8d', '#f1c40f',
];

// AI betting strategy weights
export const AI_BETTING = {
  FAVORITE_CHANCE: 0.4,
  MIDDLE_CHANCE: 0.4,
  LONGSHOT_CHANCE: 0.2,
  MAX_BET_RATIO: 0.5,
};

// Performance calculation
export const PERFORMANCE = {
  SPEED_PER_SECOND_DIVISOR: 12,
  RANDOM_FACTOR: { MIN: 0.9, MAX: 0.2 },
  MIN_SPEED: 0.1,
  PACE_VARIATION_FACTOR: 0.02,
};

// UI Configuration
export const UI_CONFIG = {
  TRACK_MARKERS_OPACITY: 0.3,
  HORSE_SIZE: 50,
  TRANSITION_DURATION: 300,
  MAX_RECENT_BETS: 5,
};

// Health modifiers
export const HEALTH_MODIFIERS = {
  POOR_HEALTH_THRESHOLD: 5,
  POOR_HEALTH_PENALTY: { MIN: -3, MAX: -1 },
  PERFECT_HEALTH: 10,
  PERFECT_HEALTH_BONUS: 1,
};

// Stat ranges
export const STAT_RANGES = {
  MIN: 1,
  MAX: 10,
};

export default {
  PLAYER_DATA_KEY,
  LOAN_SHARK,
  GAME_CONFIG,
  COME_FROM_BEHIND,
  RACE_CONFIG,
  STAT_WEIGHTS,
  BETTING_CONFIG,
  JOCKEY_CONFIG,
  RACE_PHASES,
  HORSE_NUMBERS,
  HORSE_COLORS,
  AI_BETTING,
  PERFORMANCE,
  UI_CONFIG,
  HEALTH_MODIFIERS,
  STAT_RANGES,
};