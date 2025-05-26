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
    <div className="grid grid-cols-6 gap-2 p-4">
      {tiles.map((tile, i) => (
        <div
          key={i}
          className="border rounded p-2 flex items-center justify-center"
        >
          {tile}
        </div>
      ))}
    </div>
  )
}

export default Gameboard;