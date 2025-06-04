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
      <div className="full-screen-component min-h-screen bg-[url('/Homepage.png')] bg-cover bg-no-repeat bg-center">
        <div className="h-screen flex flex-col items-center justify-center space-y-6">
          <h1 className="pt-4 text-3xl font-bold">mahjong.io</h1>
          <h2 className="text-2xl font-semibold">
            Welcome, {session?.user?.email}
          </h2>

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

          <p
            onClick={handleSignOut}
            className="rounded-md hover:cursor-pointer hover:font-semibold inline-block px-4"
          >
            Sign Out
          </p>
        </div>
      </div>
    </>
  );
}

export default Homepage;
