import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type PlayerInfo = {
  id: number;
  bonus: string[];
  exposed: string[][];
  hand_count: number;
};

type GameStateResponse = {
  players: PlayerInfo[];
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
  const [players, setPlayers] = useState<PlayerInfo[]>([]);

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
          
          setPlayers(data.players);
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
      <div className="h-screen w-full flex flex-col bg-black-900 text-white">
        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4">No Winner</h1>
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


  /*const tileUrl = (tile: string) => `/tiles/${tile}.png`;*/

  if (loading) return <div>Loading game state...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="full-screen-component relative h-screen flex flex-col items-center justify-center space-y-6">
      {/* Player 4 (left)*/}
      <div className="absolute inset-y-0 left-95 flex flex-col justify-center items-center space-y-4">
        <div className="flex flex-col space-y-1">
          {players[3]?.bonus.concat(...players[3]?.exposed).map((t, i) => (
            <div key={i}>
              <img
                src={`/tiles/${t}.png`}
                alt={t}
                className="h-[min(6vmin,2.5rem)] w-auto object-contain rotate-90 transition-transform duration-200 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-y-0 left-80 flex flex-col justify-center items-center space-y-4">
        <div className="flex flex-col">
          {Array.from({ length: players[3]?.hand_count ?? 0 }).map((_, i) => (
              <img
                key={`hidden-${i}`}
                src="/tiles/back_green.png"
                alt="Hidden tile"
                className="h-[min(6vmin,2.5rem)] w-auto object-contain justify-left rotate-90 transition-transform duration-200 hover:scale-105"
              />
          ))}
        </div>
      </div>

      {/* Player 2 (right) */}
      <div className="absolute inset-y-0 right-80 flex flex-col justify-center items-center space-y-4">
        <div className="flex flex-col">
          {Array.from({ length: players[1]?.hand_count ?? 0 }).map((_, i) => (
            <img
              key={`hidden-${i}`}
              src="/tiles/back_green.png"
              alt="Hidden tile"
              className="h-[min(6vmin,2.5rem)] w-auto object-contain rotate-270 transition-transform duration-200 hover:scale-105"
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-y-0 right-95 flex flex-col justify-center items-center space-y-4">
        <div className="flex flex-col pb-6">
          {players[1]?.bonus.concat(...players[1]?.exposed).map((t, i) => (
            <div key={i}>
              <img
                src={`/tiles/${t}.png`}
                alt={t}
                className="h-[min(6vmin,2.5rem)] w-auto object-contain rotate-270 transition-transform duration-200 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Player turn */}
      <div className="text-xl font-bold text-white pt-10 pb-2">
        Player {currentTurn + 1}'s turn
      </div>

      {/* Player 3 */}
      <div className="absolute top-19 inset-x-0 flex flex-col items-center justify-center space-y-4">
        <div className="flex">
          {Array.from({ length: players[2]?.hand_count ?? 0 }).map((_, i) => (
            <img
              key={`hidden-${i}`}
              src="/tiles/back_green.png"
              alt="Hidden tile"
              className="h-[min(6vmin,2.5rem)] w-auto object-contain rotate-180 transition-transform duration-200 hover:scale-105"
            />
          ))}
        </div>
        
        <div className="flex justify-center space-x-1">
          {players[2]?.bonus.concat(...players[2]?.exposed).map((t, i) => (
            <div key={i}>
              <img
                src={`/tiles/${t}.png`}
                alt={t}
                className="h-[min(6vmin,2.5rem)] w-auto object-contain rotate-180 transition-transform duration-200 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Discard pile */}
      {discardedTiles.length > 0 && (
        <div className="absolute text-xl text-white pb-10 max-w-screen-lg">
          <div className="grid grid-cols-12 space-y-1 justify-center">
            {discardedTiles.map((tile, idx) => (
              <div key={`discarded-${idx}`}>
                <img
                  src={`/tiles/${tile}.png`}
                  alt={tile}
                  className="h-8 w-auto object-contain transition-transform duration-200 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-center space-x-6 px-4 py-2 bg-black-800 w-full">
        <div className="text-xl font-bold text-white">Player 1 (东):</div>
        {/* Pong / Chi buttons */}
        {currentTurn === 0 && possiblePong.length > 0 && (
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => doPong(possiblePong[0])}
            >
              Pong {possiblePong[0]}
            </button>
            <button
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={doNoPong}
            >
              No Pong
            </button>
          </div>
        )}
        {currentTurn === 0 && !possiblePong.length && possibleChi.length > 0 && (
          <div className="chi-options flex items-center space-x-2">
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
      </div>

      {/* Player bonus + exposed */}
      <div className="flex flex-row items-center justify-center">
        {players[0]?.bonus.concat(...players[0]?.exposed).map((tile, idx) => (
          <div key={`meld-${idx}`}>
            <img
              src={`/tiles/${tile}.png`}
              alt={tile}
              className="h-[min(8vmin,3rem)] w-auto object-contain transition-transform duration-200 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Player’s hand */}
      <div className="flex flex-row items-center justify-center pb-6">
        {handTiles.map((tile, idx) => (
          <div
            key={`hand-${idx}`}
            onClick={() => handleTileClick(tile, idx)}
            className="hover:cursor-pointer"
          >
            <img
              src={`/tiles/${tile}.png`}
              alt={tile}
              className="h-[min(8vmin,3rem)] w-auto object-contain transition-transform duration-200 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gamemode;
