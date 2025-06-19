import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type GameStateResponse = {
  bonus: string[];
  exposed: string[][];
  hand: string[];
  current_turn: number;
  discarded_tile: string | null;
  drawn_tile: string | null;
  possiblePong?: string[];
  possibleChi?: string[][];
  winner?: number;
  tai?: number;
  draw?: boolean;
};

function Gamemode() {
  const [bonusTiles, setBonusTiles] = useState<string[]>([]);
  const [exposedTiles, setExposedTiles] = useState<string[][]>([]);
  const [handTiles, setHandTiles] = useState<string[]>([]);
  const [discardedTiles, setDiscardedTiles] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [drawnTile, setDrawnTile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [possiblePong, setPossiblePong] = useState<string[]>([]);
  const [possibleChi, setPossibleChi] = useState<string[][]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const [tai, setTai] = useState<number | null>(null);
  const [draw, setDraw]     = useState<boolean>(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch("/api/game_state")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<GameStateResponse>;
        })
        .then((data) => {
          if (data.winner !== undefined) {
            setWinner(data.winner);
            setTai(data.tai || 0);
            clearInterval(intervalId);
            return;
          }
          if (data.draw) {
            setDraw(true);
            clearInterval(intervalId);
            return;
          }
          setBonusTiles(data.bonus);
          setExposedTiles(data.exposed);
          setHandTiles(data.hand);
          setCurrentTurn(data.current_turn);

          if (data.discarded_tile) {
            setDiscardedTiles((prev) => [...prev, data.discarded_tile]);
          }

          if (data.drawn_tile && data.drawn_tile !== drawnTile) {
            setDrawnTile(data.drawn_tile);
          }
          setPossiblePong(data.possiblePong ?? []);
          setPossibleChi(data.possibleChi || []);
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

  const doPong = async (tile: string) => {
    try {
      const res = await fetch("/api/pong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tile }),
      });
      const upd = await res.json();
      setHandTiles(upd.hand);
      setExposedTiles(upd.exposed);
      setDiscardedTiles((prev) => prev.slice(0, -1)); // remove stolen tile
      setPossiblePong([]);
    } catch (err) {
      console.error(err);
    }
  };

  const doNoPong = async () => {
    try {
      await fetch("/api/pass_pong", { method: "POST" });
      setPossiblePong([]);
    } catch (err) {
      console.error(err);
    }
  };

  const doChi = async (meld: string[]) => {
    try {
      const res = await fetch("/api/chi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiles: meld }),
      });
      const upd = await res.json();
      setHandTiles(upd.hand);
      setExposedTiles(upd.exposed);
      setDiscardedTiles((prev) => prev.slice(0, -1));
      setPossibleChi([]);
    } catch (err) {
      console.error("Error performing Chi:", err);
    }
  };

  const doNoChi = async () => {
    try {
      await fetch("/api/pass_chi", { method: "POST" });
      setPossibleChi([]);
    } catch (err) {
      console.error("Error passing Chi:", err);
    }
  };

  const handleTileClick = (tile: string, idx: number) => {
    if (
      currentTurn !== 0 ||
      possiblePong.length > 0 ||
      possibleChi.length > 0
    ) {
      return;
    }

    fetch("/api/discard_tile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tile, idx }),
    })
      .then((res) => res.json())
      .then((data) => {
        if ((data as any).winner !== undefined) {
          setWinner((data as any).winner);
          setTai((data as any).tai);
          return;
        }
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
  if (winner !== null) {
    return (
      <div className="h-screen w-full flex flex-col bg-black-900 text-white">
        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4">
            Player {winner} Wins!
          </h1>
          <p className="text-2xl">with {tai} Tai</p>
        </div>
        <div className="w-full mx-auto mb-6 flex justify-end px-4">
          <Link
            to="/homepage"
            className="!text-white visited:!text-white hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }
  if (draw) {
    return (
      <div>
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black-900 text-white">
          <h1 className="text-5xl font-bold mb-4">No Winner</h1>
          <p className="text-2xl">The wall is exhausted.</p>
        </div>
        <div className="w-full mx-auto mb-6 flex justify-end px-4">
            <Link
              to="/homepage"
              className="!text-white visited:!text-white hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
      </div>
    );
  }

  const tileUrl = (tile: string) => `/tiles/${tile}.png`;

  if (loading) return <div>Loading game state...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="full-screen-component h-screen flex flex-col items-center justify-center space-y-6">
      <div className="text-xl font-bold text-white py-10 ">
        Player {currentTurn + 1}'s turn
      </div>
      {currentTurn === 0 && possiblePong.length > 0 && (
        <div className="flex space-x-2 mb-4">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={() => doPong(possiblePong[0])}
          >
            Pong {possiblePong[0]}
          </button>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded"
            onClick={doNoPong}
          >
            No Pong
          </button>
        </div>
      )}
      {currentTurn === 0 && !possiblePong.length && possibleChi.length > 0 && (
        <div className="chi-options flex space-x-2 mb-4">
          <span className="font-semibold text-white">Chi?</span>
          {possibleChi.map((meld, i) => (
            <button
              key={i}
              className="px-3 py-1 bg-green-600 text-white rounded shadow hover:bg-green-700"
              onClick={() => doChi(meld)}
            >
              {meld.join(" ")}
            </button>
          ))}
          <button
            className="px-3 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700"
            onClick={doNoChi}
          >
            No
          </button>
        </div>
      )}

      {discardedTiles.length > 0 && (
        <div className="absolute flex items-center justify-center flex-wrap text-xl text-white pb-25 max-w-md">
          <div className="flex gap-3 flex-wrap justify-center">
            {discardedTiles.map((tile, idx) => (
              <div key={`discarded-${idx}`}>
                <img
                  src={tileUrl(tile)}
                  alt={tile}
                  className="w-15 h-16 object-contain transition-transform duration-200 hover:scale-105"
                />
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
            <div key={`bonus-${idx}`}>
              <img
                src={tileUrl(tile)}
                alt={tile}
                className="w-15 h-16 object-contain transition-transform duration-200 hover:scale-105"
              />
            </div>
          ))
        ) : (
          <p>No bonus tiles</p>
        )}
      </div>

      {/* Middle row: exposed tiles (Error 4) */}
      <div className="flex flex-row gap-3 items-center justify-center">
        <p>Exposed: </p>
        {exposedTiles.length > 0 ? (
          exposedTiles.map((meld, i) => (
            <div key={i} className="flex gap-2">
              {meld.map((tile, k) => (
                <div key={`${i}-${k}`}>
                  <img
                    src={tileUrl(tile)}
                    alt={tile}
                    className="w-15 h-16 object-contain transition-transform duration-200 hover:scale-105"
                  />
                </div>
              ))}
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
            onClick={() => handleTileClick(tile, idx)}
            className="hover:cursor-pointer"
          >
            <img
              src={tileUrl(tile)}
              alt={tile}
              className="w-15 h-16 object-contain transition-transform duration-200 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gamemode;
