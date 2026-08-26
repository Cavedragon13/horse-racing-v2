// Flavor-only headlines: pure atmosphere, zero effect on odds or outcomes.
const FLAVOR_HEADLINES = [
  'Emberfield Downs card canceled after infield gopher union declares a work stoppage.',
  "Longshot 'Paperwork Error' wins at Salt Flat Downs by a nose, 40-1.",
  'Mt. Hood erupts overnight; West Coast tracks report smoke delay, not here though.',
  "Yellowstone caldera 'acting up,' say geologists. Concession stand still slinging hot dogs.",
  'Alien craft spotted circling the north grandstand; track officials unbothered.',
  "Local weatherman predicts 'a lot of weather' later this week.",
  'Groundhog sees shadow. Track shrugs, races continue as scheduled.',
  "Owner of yesterday's dead-last finisher insists horse was 'just getting warmed up.'",
  'Tote board technician swears the machine whispered a number to him. Ignored.',
  "Track cat spotted napping on the backstretch again; management calls it 'part of the show.'",
  'Rival circuit up north cancels card after infield sinkhole opens overnight.',
  'Scientists confirm: nobody actually understands how a photo finish camera works.',
  'Jockeys’ union votes unanimously to keep doing exactly what they were already doing.',
  'Grandstand vending machine achieves sentience, only dispenses lukewarm nachos.',
  'Meteor shower expected tonight; racing secretary unimpressed, card proceeds as planned.',
]

// Horse-tip templates: paired with a random horse from THIS race's field.
// Purely a betting-market flavor nudge — the underlying race simulation
// never reads odds, so a tip shortens the displayed price without touching
// the horse's actual chances. Sometimes it pans out, often it doesn't.
const TRACK_CONDITION_TIPS = [
  { condition: 'rain moving in this afternoon', reason: 'runs well on a sloppy track' },
  { condition: 'a bone-dry, fast track today', reason: 'loves a hard, fast surface' },
  { condition: 'gusty crosswinds down the backstretch', reason: "stays low and doesn't spook easy" },
  { condition: 'an early cold snap', reason: 'trains best in cold weather' },
  { condition: 'a packed, noisy grandstand today', reason: 'seems to feed off a loud crowd' },
  { condition: 'a slow, tiring track today', reason: 'has the stamina to grind out a late lead' },
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function rand(min, max) { return Math.random() * (max - min) + min }

// Returns { items, tip }. items is the ordered list of ticker entries for
// this race (0-2 of them); tip (or null) additionally carries the horseId
// and oddsMultiplier so the caller can shorten that horse's displayed odds.
export function pickRaceNews(horses) {
  const items = []
  let tip = null

  if (Math.random() < 0.6) {
    items.push({ type: 'flavor', text: pick(FLAVOR_HEADLINES) })
  }

  if (horses.length > 0 && Math.random() < 0.5) {
    const horse = pick(horses)
    const { condition, reason } = pick(TRACK_CONDITION_TIPS)
    tip = {
      type: 'tip',
      horseId: horse.id,
      horseName: horse.name,
      text: `Forecast calls for ${condition}. ${horse.name} ${reason}.`,
      oddsMultiplier: rand(0.8, 0.92),
    }
    items.push(tip)
  }

  // Keep the tip visually anchored: if both fired, put the tip first.
  items.sort((a, b) => (a.type === 'tip' ? -1 : 0) - (b.type === 'tip' ? -1 : 0))

  return { items, tip }
}
