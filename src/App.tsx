import { GameProvider, useGame } from './state/GameContext'
import { useOrientationLock } from './lib/useOrientationLock'
import StartScreen from './screens/StartScreen'
import SelectFirstPlayerScreen from './screens/SelectFirstPlayerScreen'
import PlayerTableScreen from './screens/PlayerTableScreen'
import GeneralTableScreen from './screens/GeneralTableScreen'
import GameEndScreen from './screens/GameEndScreen'
import HistoryScreen from './screens/HistoryScreen'
import HistoryDetailScreen from './screens/HistoryDetailScreen'
import RulesScreen from './screens/RulesScreen'

function Router() {
  const { screen } = useGame()
  useOrientationLock(screen.name)

  switch (screen.name) {
    case 'start':
      return <StartScreen />
    case 'selectFirst':
      return <SelectFirstPlayerScreen />
    case 'player':
      return <PlayerTableScreen />
    case 'general':
      return <GeneralTableScreen />
    case 'end':
      return <GameEndScreen />
    case 'history':
      return <HistoryScreen />
    case 'historyDetail':
      return <HistoryDetailScreen id={screen.id} />
    case 'rules':
      return <RulesScreen from={screen.from} />
  }
}

function App() {
  return (
    <GameProvider>
      <Router />
    </GameProvider>
  )
}

export default App
