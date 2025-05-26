import Gameboard from "../components/Gameboard"

function GameModePage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
      }}
    >
      <Gameboard />
    </div>
  )
}

export default GameModePage
