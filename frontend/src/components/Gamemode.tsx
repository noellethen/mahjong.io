import { useEffect, useState } from "react";

type GameStateResponse = {
  bonus: string[];
  exposed: string[];
  hand: string[];
  current_turn: number;
  discarded_tile: string;
  drawn_tile: string;
};

function Gamemode() {
  const [bonusTiles, setbonusTiles] = useState<string[]>([]);
  const [exposedTiles, setExposedTiles] = useState<string[]>([]);
  const [handTiles, setHandTiles] = useState<string[]>([]);
  const [discardedTiles, setDiscardedTiles] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [discardedTile, setDiscardedTile] = useState<string[]>([]);
  const [drawnTile, setDrawnTile] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch("/api/game_state")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<GameStateResponse>;
        })
        .then((data) => {
          setbonusTiles(data.bonus);
          setExposedTiles(data.exposed);
          setHandTiles(data.hand);
          setCurrentTurn(data.current_turn);

          if (data.discarded_tile) {
            setDiscardedTiles((prev) => [...prev, data.discarded_tile]);
          }

          if (data.drawn_tile && drawnTile != data.drawn_tile) {
            setDrawnTile(data.drawn_tile);
          }
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [drawnTile]);

  const handleTileClick = (tile: string, idx: number) => {
    if (currentTurn !== 0) {
      return;
    }

    fetch("/api/discard_tile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tile, idx }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Tile sent to backend: ", data);

        setDiscardedTiles((prev) => [...prev, data.discarded_tile]);
        setHandTiles((prev) => {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        });

        setCurrentTurn(data.current_turn);
      })
      .catch((err) => {
        console.error("Error sending tile: ", err);
      });
  };

  if (loading) return <div>Loading game state...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="full-screen-component h-screen flex flex-col items-center justify-center space-y-6">
      <div className="text-xl font-bold text-white py-10 ">
        Player {currentTurn + 1}'s turn
      </div>

      {discardedTiles.length > 0 && (
        <div className="absolute flex items-center justify-center flex-wrap text-xl text-white pb-25 max-w-md">
          <div className="flex gap-3 flex-wrap justify-center">
            {discardedTiles.map((tile, idx) => (
              <div
                key={`discarded-${idx}`}
                className="bg-gray-500 border-2 border-transparent text-white py-2 px-4 rounded-md transition-colors duration-300"
              >
                {tile}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto text-xl font-bold text-white">Player 1 (东):</div>

      {/* Top row: bonus tiles */}
      <div className="flex flex-row gap-3 items-center justify-center">
        <p>Bonus: </p>
        {bonusTiles.length > 0 ? (
          bonusTiles.map((tile, idx) => (
            <div
              key={`bonus-${idx}`}
              className="bg-gray-500 border-2 border-transparent text-white py-2 px-4 rounded-md transition-colors duration-300"
            >
              {tile}
            </div>
          ))
        ) : (
          <p>No bonus tiles</p>
        )}
      </div>

      {/* Middle row: exposed tiles */}
      <div className="flex flex-row gap-3 items-center justify-center">
        <p>Exposed: </p>
        {exposedTiles.length > 0 ? (
          exposedTiles.map((tile, idx) => (
            <div
              key={`exposed-${idx}`}
              className="bg-gray-500 border-2 border-transparent text-white py-2 px-4 rounded-md transition-colors duration-300"
            >
              {tile}
            </div>
          ))
        ) : (
          <p>No exposed tiles</p>
        )}
      </div>

      {/* Bottom row: player’s hand */}
      <div className="flex flex-row gap-3 items-center justify-center pb-10">
        <p>Hand: </p>
        {handTiles.map((tile, idx) => (
          <div
            key={`hand-${idx}`}
            className="bg-gray-500 border-2 border-transparent hover:cursor-pointer hover:border-blue-500 text-white py-2 px-4 rounded-md transition-colors duration-300"
            onClick={() => handleTileClick(tile, idx)}
          >
            {tile}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gamemode;
