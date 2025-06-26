import { useEffect, useState } from "react";
import {io, Socket} from "socket.io-client";
import { useLocation} from "react-router-dom";
import { Link } from "react-router-dom";

type PlayerInfo = {
  id: number;
  bonus: string[];
  exposed: string[][];
};

type HumanPlayerInfo = {
  player_id: number;
  bonus: string[];
  exposed: string[][];
  hand: string[];
  possiblePong: string[];
  possibleChi: string[][];
};

type GameStateResponse = {
  players: HumanPlayerInfo[];
  all_players: PlayerInfo[];
  current_turn: number;
  discarded_tile: string | null;
  drawn_tile: string | null;
  discard_pile: string[];  
  winner?: number;
  tai?: number;
  draw?: boolean;
  waiting?: boolean;
  needed?: number;
};

function Gamemode() {
  const { state } = useLocation();   
  const [playerId, setPlayerId] = useState<number | null>(null);
  
  useEffect(() => {
    const socket: Socket = io("http://localhost:5000");
    console.log("Emitting join-game with:", state.numHumans);
    socket.emit("join-game", { numHumans: state.numHumans });

    socket.on("game-update", (payload) => {
      console.log("Received game-update:", payload);
    });

    socket.on("player-assigned", (data) => {
      console.log("Received player-assigned:", data);
      setPlayerId(data.player_id);
    });

    return () => {
      socket.disconnect();
    };
  }, [state.numHumans]);
  
  const [handTiles, setHandTiles] = useState<string[]>([]);
  const [discardPile, setDiscardPile] = useState<string[]>([]);  
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [drawnTile, setDrawnTile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [possiblePong, setPossiblePong] = useState<string[]>([]);
  const [possibleChi, setPossibleChi] = useState<string[][]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const [tai, setTai] = useState<number | null>(null);
  const [draw, setDraw] = useState<boolean>(false);
  const [players, setPlayers] = useState<HumanPlayerInfo[]>([]);
  const [waiting, setWaiting] = useState<boolean>(false);
  const [needed, setNeeded] = useState<number>(0);
  const [waitingForChiPong, setWaitingForChiPong] = useState<boolean>(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch("/api/game_state")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<GameStateResponse>;
        })
        .then((data) => {
          if (data.waiting) {
            setWaiting(true);
            setNeeded(data.needed || 0);
            return;
          }          
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
          
          setWaiting(false);
          setPlayers(data.players);
          
          let currentPlayerData = null;
          
          if (playerId !== null) {
            currentPlayerData = data.players.find(p => p.player_id === playerId);
          }
          
          if (currentPlayerData) {
            setHandTiles(currentPlayerData.hand);
            setPossiblePong(currentPlayerData.possiblePong);
            setPossibleChi(currentPlayerData.possibleChi);
            const hasChiPongOptions = currentPlayerData.possiblePong.length > 0 || currentPlayerData.possibleChi.length > 0;
            setWaitingForChiPong(hasChiPongOptions);
            
            if (playerId) {
              console.log(`Player ${playerId} data:`, {
                hand: currentPlayerData.hand,
                possiblePong: currentPlayerData.possiblePong,
                possibleChi: currentPlayerData.possibleChi,
                currentTurn: data.current_turn,
                isMyTurn: data.current_turn === playerId - 1,
                waitingForChiPong: hasChiPongOptions
              });
            }
          }
          
          setCurrentTurn(data.current_turn);
          setDiscardPile(data.discard_pile || []);

          if (data.drawn_tile && data.drawn_tile !== drawnTile) {
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
  }, [drawnTile, playerId]);

  const doPong = async (tile: string) => {
    try {
      const res = await fetch("/api/pong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tile, player_id: playerId }),
      });
      const upd = await res.json();
      setHandTiles(upd.hand);
      setPossiblePong([]);
      setWaitingForChiPong(false);
    } catch (err) {
      console.error(err);
    }
  };

  const doNoPong = async () => {
    try {
      await fetch("/api/pass_pong", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId }),
      });
      setPossiblePong([]);
      setWaitingForChiPong(false);
    } catch (err) {
      console.error(err);
    }
  };

  const doChi = async (meld: string[]) => {
    try {
      const res = await fetch("/api/chi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiles: meld, player_id: playerId }),
      });
      const upd = await res.json();
      setHandTiles(upd.hand);
      setPossibleChi([]);
      setWaitingForChiPong(false);
    } catch (err) {
      console.error("Error performing Chi:", err);
    }
  };

  const doNoChi = async () => {
    try {
      await fetch("/api/pass_chi", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId }),
      });
      setPossibleChi([]);
      setWaitingForChiPong(false);
    } catch (err) {
      console.error("Error passing Chi:", err);
    }
  };

  const handleTileClick = (tile: string, idx: number) => {
    if (
      currentTurn !== (playerId ? playerId - 1 : 0) ||
      possiblePong.length > 0 ||
      possibleChi.length > 0 ||
      waitingForChiPong  
    ) {
      console.log("Cannot discard:", {
        currentTurn,
        playerId,
        isMyTurn: currentTurn === (playerId ? playerId - 1 : 0),
        hasPong: possiblePong.length > 0,
        hasChi: possibleChi.length > 0,
        waitingForChiPong
      });
      return;
    }

    fetch("/api/discard_tile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tile, player_id: playerId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if ((data as any).winner !== undefined) {
          setWinner((data as any).winner);
          setTai((data as any).tai);
          return;
        }
        console.log("Tile sent to backend: ", data);
        setHandTiles((prev) => {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        });
        setCurrentTurn(data.current_turn);
        
        if (data.message && data.message.includes("waiting for Chi/Pong")) {
          console.log("Pong/Chi possible - fetching game state for options");
          setWaitingForChiPong(true); 
          setTimeout(() => {
            fetch("/api/game_state")
              .then((res) => res.json())
              .then((gameData) => {
                if (gameData.players) {
                  const currentPlayerData = gameData.players.find((p: any) => p.player_id === playerId);
                  if (currentPlayerData) {
                    setPossiblePong(currentPlayerData.possiblePong || []);
                    setPossibleChi(currentPlayerData.possibleChi || []);
                    console.log("Updated Pong/Chi options:", {
                      pong: currentPlayerData.possiblePong,
                      chi: currentPlayerData.possibleChi
                    });
                  }
                }
              })
              .catch((err) => console.error("Error fetching game state:", err));
          }, 100); 
        }
      })
      .catch((err) => {
        console.error("Error sending tile: ", err);
      });
  };

  type PlayerType = {
    player_id: number;
    bonus: string[];
    exposed: string[][];
    hand: string[];
  };

  function getPlayerOrder(players: PlayerType[], currentPlayerId: number): PlayerType[] {
    if (!players || players.length === 0) return [];
    const fullPlayers: PlayerType[] = [];
    for (let i = 1; i <= 4; i++) {
      const player = players.find(p => p.player_id === i);
      if (player) {
        fullPlayers.push(player);
      } else {
        fullPlayers.push({
          player_id: i,
          bonus: [],
          exposed: [],
          hand: []
        });
      }
    }
    const currentPlayerIndex = currentPlayerId - 1;
    const rotated: PlayerType[] = [];
    for (let i = 0; i < 4; i++) {
      const index = (currentPlayerIndex + i) % 4;
      rotated.push(fullPlayers[index]);
    }
    
    return rotated;
  }

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
  
  if (waiting) {
    return (
      <div className="h-screen w-full flex flex-col bg-black-900 text-white">
        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4">Waiting for Players</h1>
          <p className="text-2xl">Need {needed} more player(s) to start</p>
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

  if (playerId === null) {
    return (
      <div className="h-screen w-full flex flex-col bg-black-900 text-white">
        <div className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4">Connecting...</h1>
          <p className="text-2xl">Waiting for player assignment</p>
        </div>
      </div>
    );
  }
  const orderedPlayers = getPlayerOrder(players as PlayerType[], playerId);
  console.log("Player data:", {
    playerId,
    players: players as PlayerType[],
    orderedPlayers: orderedPlayers.map((p, i) => ({ index: i, player_id: p.player_id, exposed: p.exposed }))
  });

  return (
    <div className="full-screen-component relative h-screen flex flex-col items-center justify-center space-y-6">
      {/* Player 4 (left) - should be orderedPlayers[3] */}
      <div
        className="absolute left-2 top-1/2 flex flex-row space-x-1"
        style={{ transform: "translateY(-50%) rotate(90deg)" }}
      >
        {orderedPlayers[3] && orderedPlayers[3].bonus.concat(...orderedPlayers[3].exposed).map((t: string, i: number) => (
          <div key={i}>
            <img
              src={`/tiles/${t}.png`}
              alt={t}
              className="h-[min(8vmin,3rem)] w-auto object-contain transition-transform duration-200 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Player 2 (right) - should be orderedPlayers[1] */}
      <div
        className="absolute right-2 top-1/2 flex flex-row space-x-1"
        style={{ transform: "translateY(-50%) rotate(270deg)" }}
      >
        {orderedPlayers[1] && orderedPlayers[1].bonus.concat(...orderedPlayers[1].exposed).map((t: string, i: number) => (
          <div key={i}>
            <img
              src={`/tiles/${t}.png`}
              alt={t}
              className="h-[min(8vmin,3rem)] w-auto object-contain transition-transform duration-200 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Player 3 (top) - should be orderedPlayers[2] */}
      <div className="mb-4 flex space-x-1" style={{ transform: "rotate(180deg)" }}>
        {orderedPlayers[2] && orderedPlayers[2].bonus.concat(...orderedPlayers[2].exposed).map((t: string, i: number) => (
          <div key={i}>
            <img
              src={`/tiles/${t}.png`}
              alt={t}
              className="h-[min(8vmin,3rem)] w-auto object-contain transition-transform duration-200 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Player turn */}
      <div className="text-xl font-bold text-white pt-10 pb-2">
        Player {currentTurn + 1}'s turn
        {playerId && currentTurn === playerId - 1 && " (Your turn!)"}
        {playerId && (
          <div className="text-sm text-gray-300 mt-1">
            You are Player {playerId}
            {currentTurn === playerId - 1 && " - Click a tile to discard"}
            {currentTurn !== playerId - 1 && " - Waiting for other players"}
          </div>
        )}
      </div>

      {/* Discard pile */}
      {discardPile.length > 0 && (
        <div className="absolute text-xl text-white pb-20 max-w-screen-lg">
          <div className="grid grid-cols-12 gap-x-1 gap-y-1 justify-center">
            {discardPile.map((tile: string, idx: number) => (
              <div key={`discarded-${idx}`}>
                <img
                  src={`/tiles/${tile}.png`}
                  alt={tile}
                  className="h-10 w-auto object-contain transition-transform duration-200 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-center space-x-6 px-4 py-2 bg-black-800 w-full">
        <div className="text-xl font-bold text-white">
          Player {playerId || 1} {playerId ? "(You)" : ""}:
        </div>
        {/* Pong / Chi buttons */}
        {possiblePong.length > 0 && (
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
        {possibleChi.length > 0 && (
          <div className="chi-options flex items-center space-x-2">
            <span className="font-semibold text-white">Chi?</span>
            {possibleChi.map((meld: string[], i: number) => (
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
      <div className="flex flex-row gap-3 items-center justify-center">
        <p>Bonus / Exposed: </p>
        {orderedPlayers[0]?.bonus.concat(...orderedPlayers[0]?.exposed).map((t: string, idx: number) => (
          <div key={`meld-${idx}`}>
            <img
              src={`/tiles/${t}.png`}
              alt={t}
              className="h-[min(8vmin,3rem)] w-auto object-contain transition-transform duration-200 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Player's hand */}
      <div className="flex flex-row gap-3 items-center justify-center pb-6">
        <p>Hand: </p>
        {handTiles.map((tile: string, idx: number) => (
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
