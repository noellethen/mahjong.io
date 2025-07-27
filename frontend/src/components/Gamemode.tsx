import { useEffect, useState, useMemo } from "react";
import {io, Socket} from "socket.io-client";
import { useLocation} from "react-router-dom";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

type PlayerInfo = {
  id: number;
  bonus: string[];
  exposed: string[][];
  hand_count: number;
};

type HumanPlayerInfo = {
  player_id: number;
  bonus: string[];
  exposed: string[][];
  hand: string[];
  hand_count: number;
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

type SkinColor = 'green' | 'red' | 'orange' | 'yellow' | 'blue' | 'pink';

const BACKEND = import.meta.env.VITE_BACKEND_URL as string;

function Gamemode() {
  const { state } = useLocation();   
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [equippedSkin, setEquippedSkin] = useState<SkinColor>("green");

  const skinMap = useMemo<Record<SkinColor, string>>(() => ({
    green:  "/tiles/back_green.png",
    red:    "/designs/back_red.png",
    orange: "/designs/back_orange.png",
    yellow: "/designs/back_yellow.png",
    blue:   "/designs/back_blue.png",
    pink:   "/designs/back_pink.png",
  }), []);

  useEffect(() => {
    const loadSkin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("equipped_skin")
        .eq("id", user.id)
        .single();
      if (!error && data?.equipped_skin) {
        setEquippedSkin(data.equipped_skin);
      }
    };
    loadSkin();
  }, []);
  
  useEffect(() => {
    const socket: Socket = io(BACKEND, { transports: ["websocket"] });
    console.log("Emitting join-game with:", state.numHumans);
    
    fetch(`${BACKEND}/api/game_state`)
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.waiting && data.needed === undefined) {
          console.log("Existing game detected - calling rejoin API");
          await fetch(`${BACKEND}/api/rejoin`, { method: "POST" });
        } else {
          console.log("No existing game - proceeding with join");
        }
      })
      .then(() => {
        console.log("Joining game");
        socket.emit("join-game", { numHumans: state.numHumans });
      })
      .catch((err) => {
        console.error("Error checking game state:", err);
        socket.emit("join-game", { numHumans: state.numHumans });
      });

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
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([]);
  const [waiting, setWaiting] = useState<boolean>(false);
  const [needed, setNeeded] = useState<number>(0);
  const [waitingForChiPong, setWaitingForChiPong] = useState<boolean>(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch(`${BACKEND}/api/game_state`)
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
          setAllPlayers(data.all_players);
          
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
    }, 1000);

    return () => clearInterval(intervalId);
  }, [drawnTile, playerId]);

  const doPong = async (tile: string) => {
    try {
      const res = await fetch(`${BACKEND}/api/pong`, {
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
      await await fetch(`${BACKEND}/api/pass_pong`, { 
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
      const res = await fetch(`${BACKEND}/api/chi`, {
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
      await fetch(`${BACKEND}/api/pass_chi`, { 
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

    fetch(`${BACKEND}/api/discard_tile`, {
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
            fetch(`${BACKEND}/api/game_state`)
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

  type AllPlayerType = {
    id: number;
    bonus: string[];
    exposed: string[][];
    hand_count: number;
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

  function getAllPlayerOrder(allPlayers: AllPlayerType[], currentPlayerId: number): AllPlayerType[] {
    if (!allPlayers || allPlayers.length === 0) return [];
    const fullPlayers: AllPlayerType[] = [];
    for (let i = 1; i <= 4; i++) {
      const player = allPlayers.find(p => p.id === i);
      if (player) {
        fullPlayers.push(player);
      } else {
        fullPlayers.push({
          id: i,
          bonus: [],
          exposed: [],
          hand_count: 0
        });
      }
    }
    const currentPlayerIndex = currentPlayerId - 1;
    const rotated: AllPlayerType[] = [];
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
  const orderedAllPlayers = getAllPlayerOrder(allPlayers as AllPlayerType[], playerId);
  console.log("Player data:", {
    playerId,
    players: players as PlayerType[],
    allPlayers: allPlayers as AllPlayerType[],
    orderedPlayers: orderedPlayers.map((p, i) => ({ index: i, player_id: p.player_id, exposed: p.exposed })),
    orderedAllPlayers: orderedAllPlayers.map((p, i) => ({ index: i, id: p.id, exposed: p.exposed, hand_count: p.hand_count }))
  });

  return (
    <div className="full-screen-component relative h-screen flex flex-col items-center justify-center space-y-6" 
      style={{
        backgroundImage: `url('/designs/default_board.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Player 4 (left)*/}
      <div className="absolute inset-y-0 left-95 flex flex-col justify-center items-center space-y-4">
        <div className="flex flex-col space-y-1">
          {orderedAllPlayers[3] && orderedAllPlayers[3].bonus.concat(...orderedAllPlayers[3].exposed).map((t: string, i: number) => (
            <div key={i}>
              <img
                src={`/tiles/${t}.png`}
                alt={t}
                className="h-[min(6vmin,2.5rem)] w-auto object-contain drop-shadow rotate-90 transition-transform duration-200 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-y-0 left-80 flex flex-col justify-center items-center space-y-4">
        <div className="flex flex-col">
          {Array.from({ length: orderedAllPlayers[3]?.hand_count ?? 0 }).map((_, i) => (
              <img
                key={`hidden-${i}`}
                src={skinMap[equippedSkin]}
                alt="Hidden tile"
                className="h-[min(6vmin,2.5rem)] w-auto drop-shadow object-contain justify-left rotate-90 transition-transform duration-200 hover:scale-105"
              />
          ))}
        </div>
      </div>

      {/* Player 2 (right) */}
      <div className="absolute inset-y-0 right-80 flex flex-col justify-center items-center space-y-4">
        <div className="flex flex-col">
          {Array.from({ length: orderedAllPlayers[1]?.hand_count ?? 0 }).map((_, i) => (
            <img
              key={`hidden-${i}`}
              src={skinMap[equippedSkin]}
              alt="Hidden tile"
              className="h-[min(6vmin,2.5rem)] w-auto drop-shadow object-contain rotate-270 transition-transform duration-200 hover:scale-105"
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-y-0 right-95 flex flex-col justify-center items-center space-y-4">
        <div className="flex flex-col pb-6">
          {orderedAllPlayers[1] && orderedAllPlayers[1].bonus.concat(...orderedAllPlayers[1].exposed).map((t: string, i: number) => (
            <div key={i}>
              <img
                src={`/tiles/${t}.png`}
                alt={t}
                className="h-[min(6vmin,2.5rem)] w-auto object-contain drop-shadow rotate-270 transition-transform duration-200 hover:scale-105"
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
          {Array.from({ length: orderedAllPlayers[2]?.hand_count ?? 0 }).map((_, i) => (
            <img
              key={`hidden-${i}`}
              src={skinMap[equippedSkin]}
              alt="Hidden tile"
              className="h-[min(6vmin,2.5rem)] w-auto drop-shadow object-contain rotate-180 transition-transform duration-200 hover:scale-105"
            />
          ))}
        </div>
        
        <div className="flex justify-center space-x-1">
          {orderedAllPlayers[2] && orderedAllPlayers[2].bonus.concat(...orderedAllPlayers[2].exposed).map((t: string, i: number) => (
            <div key={i}>
              <img
                src={`/tiles/${t}.png`}
                alt={t}
                className="h-[min(6vmin,2.5rem)] w-auto drop-shadow object-contain rotate-180 transition-transform duration-200 hover:scale-105"
              />
            </div>
          ))}
        </div>
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
                  className="h-8 w-auto object-contain transition-transform duration-200 hover:scale-105"
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
        {orderedAllPlayers[0]?.bonus.concat(...orderedAllPlayers[0]?.exposed).map((t: string, idx: number) => (
          <div key={`meld-${idx}`}>
            <img
              src={`/tiles/${t}.png`}
              alt={t}
              className="h-[min(8vmin,3rem)] w-auto drop-shadow object-contain transition-transform duration-200 hover:scale-105"
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
              className="h-[min(8vmin,3rem)] w-auto object-contain drop-shadow transition-transform duration-200 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gamemode;
