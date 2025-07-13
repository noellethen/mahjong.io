import type { MouseEvent } from "react";
import { useState } from "react";                   
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";     

function Homepage() {
  const navigate = useNavigate();
  const { session, signOut } = UserAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [showOtherGames, setShowOtherGames] = useState(false);
  const [showSkins, setShowSkins] = useState(false);

  const handlePlay = async (numHumans: number) => {
    try {
      const res = await fetch("/api/game_state");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!data.waiting && data.needed === undefined) {
        console.log("Existing game detected - calling rejoin API");
        await fetch("/api/rejoin", { method: "POST" });
        console.log("Game state reset for rejoin");
      } else {
        console.log("No existing game - proceeding with fresh start");
      }

      if (data.winner !== undefined || data.draw) {
        await fetch("/api/reset", { method: "POST" });
        console.log("Game was finished—resetting before new round.");
      }
    } catch (err) {
      console.error("Error starting game:", err);
    } finally {
      navigate("/gamemode", { state: { numHumans } });
    }
  };

  const handleSignOut = async (e: MouseEvent<HTMLParagraphElement>) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="full-screen-component min-h-screen bg-[url('/Homepage.png')] bg-cover bg-no-repeat bg-center">
        <div className="h-screen flex flex-col items-center justify-center space-y-6">
          <h1 className="pt-4 text-3xl font-bold">mahjong.io</h1>
          <h2 className="text-2xl font-semibold">
            Welcome, {session?.user?.email}
          </h2>

          <div className="flex flex-col space-y-4 w-40">
            <button
              onClick={() => setShowPicker(true)}
              className="w-full rounded-md border px-4 py-2"
              style={{ backgroundColor: "goldenrod" }}
            >
              Play
            </button>

            <button
              onClick={() => setShowSkins(true)}
              className="w-full rounded-md border px-4 py-2"
              style={{ backgroundColor: "goldenrod" }}
            >
              Skins
            </button>

            <button
              onClick={() => setShowOtherGames(true)}
              className="w-full rounded-md border px-4 py-2"
              style={{ backgroundColor: "goldenrod" }}
            >
              Game Modes
            </button>
          </div>

          <p
            onClick={handleSignOut}
            className="rounded-md hover:cursor-pointer hover:font-semibold inline-block px-4"
          >
            Sign Out
          </p>
        </div>
      </div>

      {showPicker && (
       <div
         className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
         onClick={() => setShowPicker(false)}
       >
         <div
           className="bg-black p-6 rounded-lg shadow-lg"
           onClick={e => e.stopPropagation()}
         >
            <h2 className="text-xl font-semibold mb-4">
              How many human players?
            </h2>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setShowPicker(false);     
                    handlePlay(n);            
                  }}
                  className="px-4 py-2 border rounded-md"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showOtherGames && (
       <div
         className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
         onClick={() => setShowOtherGames(false)}
       >
         <div
           className="bg-black p-6 rounded-lg shadow-lg"
           onClick={e => e.stopPropagation()}
         >
            <h2 className="text-xl font-semibold mb-4">
              Choose Game Mode
            </h2>
            <div
              className="flex flex-col space-y-2 w-40 mx-auto"   
            >
              <button
                onClick={() => {
                  setShowOtherGames(false);
                  navigate("/tutorial");
                }}
                className="w-full rounded-md border px-4 py-2"
                style={{ backgroundColor: "goldenrod" }}
              >
                Tutorial
              </button>
              <button
                onClick={() => {
                  setShowOtherGames(false);
                  navigate("/quiz");
                }}
                className="w-full rounded-md border px-4 py-2"
                style={{ backgroundColor: "goldenrod" }}
              >
                Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {showSkins && (
       <div
         className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
         onClick={() => setShowSkins(false)}
       >
         <div
           className="bg-black p-6 rounded-lg shadow-lg"
           onClick={e => e.stopPropagation()}
         >
            <h2 className="text-xl font-semibold mb-4">
              What would you like to do?
            </h2>
            <div
              className="flex flex-col space-y-2 w-40 mx-auto"   
            >
              <button
                onClick={() => {
                  setShowSkins(false);
                  navigate("/shop");
                }}
                className="w-full rounded-md border px-4 py-2"
                style={{ backgroundColor: "goldenrod" }}
              >
                Shop
              </button>
              <button
                onClick={() => {
                  setShowSkins(false);
                  navigate("/customise");
                }}
                className="w-full rounded-md border px-4 py-2"
                style={{ backgroundColor: "goldenrod" }}
              >
                Customise
              </button>
            </div>
          </div>
        </div>
      )} 
    </>
  );
}

export default Homepage;
