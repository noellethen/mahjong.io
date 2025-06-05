import { useEffect, useState } from "react";

type GameStateResponse = {
  bonus: string[];
  exposed: string[];
  hand: string[];
};

function Gamemode() {
  const [bonusTiles, setbonusTiles] = useState<string[]>([]);
  const [exposedTiles, setExposedTiles] = useState<string[]>([]);
  const [handTiles, setHandTiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/game_state")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<GameStateResponse>;
      })
      .then((data) => {
        setbonusTiles(data.bonus);
        setExposedTiles(data.exposed);
        setHandTiles(data.hand);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleTileClick = (tile: string) => {
    fetch("/api/select_tile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tile }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Tile sent to backend: ", data);

        setHandTiles((prevTiles) => prevTiles.filter((t) => t !== tile));
      })
      .catch((err) => {
        console.error("Error sending tile: ", err);
      });
  };

  if (loading) return <div>Loading game state...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6">
      {/* Top row: bonus tiles */}
      <div className="flex flex-row gap-3 items-center justify-center">
        <p>Bonus: </p>
        {bonusTiles.length > 0 ? (
          bonusTiles.map((tile, idx) => (
            <div
              key={`bonus-${idx}`}
              className="bg-gray-500 border-2 border-transparent hover:cursor-pointer text-white py-2 px-4 rounded-md transition-colors duration-300"
            >
              {tile}
            </div>
          ))
        ) : (
          <p>No bonus tiles</p> // You can display a message if the array is empty
        )}
      </div>

      {/* Middle row: exposed tiles */}
      <div className="flex flex-row gap-3 items-center justify-center">
        <p>Exposed: </p>
        {exposedTiles.length > 0 ? (
          exposedTiles.map((tile, idx) => (
            <div
              key={`exposed-${idx}`}
              className="bg-gray-500 border-2 border-transparent hover:cursor-pointer text-white py-2 px-4 rounded-md transition-colors duration-300"
            >
              {tile}
            </div>
          ))
        ) : (
          <p>No exposed tiles</p> // You can display a message if the array is empty
        )}
      </div>

      {/* Bottom row: player’s hand */}
      <div className="flex flex-row gap-3 items-center justify-center">
        <p>Hand: </p>
        {handTiles.map((tile, idx) => (
          <div
            key={`hand-${idx}`}
            className="bg-gray-500 border-2 border-transparent hover:cursor-pointer hover:border-blue-500 text-white py-2 px-4 rounded-md transition-colors duration-300"
            onClick={() => handleTileClick(tile)}
          >
            {tile}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gamemode;
