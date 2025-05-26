import { useEffect, useState } from "react";

function Gameboard() {
    const [tiles, setTiles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/game_state')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res.json() as Promise<string[]>
        })
        .then(data => setTiles(data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }, [])

    if (loading) return <div>Loading game state...</div>
    if (error)   return <div className="text-red-500">Error: {error}</div>

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',           // space between tiles
        alignItems: 'center',  // vertically center each tile
      }}
    >
      {tiles.map((tile, idx) => (
        <div
          key={idx}
          style={{
            border: '1px solid #333',
            borderRadius: '4px',
            padding: '8px',
            textAlign: 'center',
          }}
        >
          {tile}
        </div>
      ))}
    </div>
  )
}

export default Gameboard;