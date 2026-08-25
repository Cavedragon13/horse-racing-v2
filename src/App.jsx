import { useState } from 'react'
import SetupScreen from './components/SetupScreen'
import BettingScreen from './components/BettingScreen'
import RaceTrack from './components/RaceTrack'
import ResultsScreen from './components/ResultsScreen'
import GameOver from './components/GameOver'
import { GAME_CONFIG } from './utils/constants'
import {
  generateRace, calculateOdds, createPlayer, createAIPlayer,
  makeAIBet, applyBetResults, savePlayerData, loadPlayerData, clearPlayerData,
  takeLoan, repayLoan, accrueVig,
} from './utils/gameLogic'
import './App.css'

function newRace() {
  const r = generateRace()
  return { ...r, odds: calculateOdds(r.horses, r.type) }
}

export default function App() {
  const [screen, setScreen] = useState('setup')
  const [gs, setGs] = useState(null)

  const handleStart = (playerName, numAI, totalRaces = 10) => {
    setGs({
      day: 1,
      race: 1,
      totalRaces,
      dayStartBux: GAME_CONFIG.STARTING_BUX,
      players: [
        createPlayer(playerName, true),
        ...Array.from({ length: numAI }, (_, i) => createAIPlayer(i)),
      ],
      currentRace: newRace(),
      currentBets: {},
      lastResult: null,
      gameOver: false,
    })
    setScreen('betting')
  }

  // ticket: array of { horseId, amount, betType } legs (or empty/null to skip)
  const startRace = (ticket) => {
    setGs(prev => {
      const human = prev.players.find(p => p.isHuman)
      const bets = {}
      if (ticket && ticket.length > 0) {
        bets[human.id] = ticket
      }
      prev.players.filter(p => !p.isHuman).forEach(ai => {
        const b = makeAIBet(ai, prev.currentRace.horses, prev.currentRace.odds)
        if (b) bets[ai.id] = [b]
      })
      return { ...prev, currentBets: bets }
    })
    setScreen('racing')
  }

  const handleRaceComplete = (finishOrder, dnf = []) => {
    setGs(prev => {
      const { players, currentBets, currentRace, day, race, totalRaces } = prev
      // Ordered finishers (no dnf in v2, but kept for safety)
      const orderedFinishers = finishOrder.filter(id => !dnf.includes(id))
      const updatedPlayers = applyBetResults(players, currentBets, orderedFinishers, currentRace.odds)
      const human = updatedPlayers.find(p => p.isHuman)
      savePlayerData(human.name, human.bux)

      const cumRace = (day - 1) * GAME_CONFIG.RACES_PER_DAY + race
      const isEndOfGame = totalRaces !== Infinity && cumRace >= totalRaces
      const isEndOfDay = race >= GAME_CONFIG.RACES_PER_DAY && !isEndOfGame
      const isNewDay = isEndOfDay

      return {
        ...prev,
        players: updatedPlayers,
        lastResult: {
          finishOrder,
          dnf,
          horses: currentRace.horses,
          odds: currentRace.odds,
          bets: currentBets,
          raceDay: day,
          raceNum: race,
          raceType: currentRace.type,
          raceDistance: currentRace.distance,
        },
        currentBets: {},
        day: isNewDay ? day + 1 : day,
        race: isEndOfDay ? 1 : race + 1,
        currentRace: isEndOfGame ? null : newRace(),
        gameOver: isEndOfGame,
        // Reset dayStartBux at the start of each new day
        dayStartBux: isNewDay ? human.bux : prev.dayStartBux,
      }
    })
    setScreen('results')
  }

  const handleNext = () => {
    if (gs.gameOver) {
      setScreen('game-over')
      return
    }
    // Accrue vig on outstanding loan before the next betting screen
    setGs(prev => ({
      ...prev,
      players: prev.players.map(p => p.isHuman ? accrueVig(p) : p),
    }))
    setScreen('betting')
  }

  const handleForfeit = () => {
    setGs(prev => ({ ...prev, gameOver: true }))
    setScreen('game-over')
  }

  const handleLoan = (amount) => {
    setGs(prev => ({
      ...prev,
      players: prev.players.map(p => p.isHuman ? takeLoan(p, amount) : p),
    }))
  }

  const handleRepay = (amount) => {
    setGs(prev => ({
      ...prev,
      players: prev.players.map(p => p.isHuman ? repayLoan(p, amount) : p),
    }))
  }

  const handleNewGame = () => {
    clearPlayerData()
    setGs(null)
    setScreen('setup')
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      {screen === 'setup' && (
        <SetupScreen onStart={handleStart} savedData={loadPlayerData()} />
      )}
      {screen === 'betting' && gs && (
        <BettingScreen
          gs={gs}
          onRace={startRace}
          onLoan={handleLoan}
          onRepay={handleRepay}
          onForfeit={handleForfeit}
        />
      )}
      {screen === 'racing' && gs && (
        <RaceTrack
          race={gs.currentRace}
          bets={gs.currentBets}
          players={gs.players}
          onComplete={handleRaceComplete}
        />
      )}
      {screen === 'results' && gs && (
        <ResultsScreen gs={gs} onNext={handleNext} onForfeit={handleForfeit} />
      )}
      {screen === 'game-over' && gs && (
        <GameOver players={gs.players} onNewGame={handleNewGame} />
      )}
    </div>
  )
}
