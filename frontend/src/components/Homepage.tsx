import React from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Homepage() {
  const navigate = useNavigate();
  const { session, signOut } = UserAuth();

  const handleSignOut = async (e) => {
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
      <div>
        <h2>Welcome, {session?.email}</h2>
      </div>
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col space-y-4 w-40">
          <button
            onClick={() => navigate("/gamemode")}
            className="w-full rounded-md border px-4 py-2"
          >
            Play
          </button>

          <button
            onClick={() => navigate("/shop")}
            className="w-full rounded-md border px-4 py-2"
          >
            Shop
          </button>

          <button
            onClick={() => navigate("/customise")}
            className="w-full rounded-md border px-4 py-2"
          >
            Customise
          </button>
        </div>
      </div>
      <div>
        <p
          onClick={handleSignOut}
          className="hover:cursor-pointer border inline-block px-4 py-3 mt-4"
        >
          Sign Out
        </p>
      </div>
    </>
  );
}

export default Homepage;
