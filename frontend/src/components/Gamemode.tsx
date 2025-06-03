import { useEffect, useState } from "react";

type GameStateResponse = {
  exposed: string[];
  hand: string[];
};

function Gamemode() {
  const [exposedTiles, setExposedTiles] = useState<string[]>([]);
  const [handTiles, setHandTiles]       = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/game_state")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<GameStateResponse>;
      })
      .then((data) => {
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

  if (loading) return <div>Loading game state...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Top row: exposed tiles */}
      <div className="flex flex-row gap-3 items-center justify-center">
        {exposedTiles.map((tile, idx) => (
          <div
            key={`exposed-${idx}`}
            className="border border-gray-800 rounded-md px-3 py-2 text-center"
          >
            {tile}
          </div>
        ))}
      </div>

      {/* Bottom row: player’s hand */}
      <div className="flex flex-row gap-3 items-center justify-center">
        {handTiles.map((tile, idx) => (
          <div
            key={`hand-${idx}`}
            className="border border-gray-800 rounded-md px-3 py-2 text-center"
          >
            {tile}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gamemode;
