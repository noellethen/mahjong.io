import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInUser(email, password);

      if (!result.success) {
        setError(result.error.message || "Signin failed");
        return;
      }

      navigate("/homepage");
    } catch (error) {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="pt-4 text-3xl">mahjong.io</h1>
      <form onSubmit={handleSignin} className="max-w-md m-auto pt-24">
        <h2 className="font-bold pb-2">Sign in</h2>
        <div className="flex flex-col py-4">
          <input
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="p-3 mt-6 bg-gray-950 hover:border hover:cursor-pointer"
            type="email"
            name=""
            id=""
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="p-3 mt-6 bg-gray-950 hover:border hover:cursor-pointer"
            type="password"
            name=""
            id=""
          />
          <button type="submit" disabled={loading} className="mt-6 w-full">
            Sign In
          </button>
          {error && <p className="text-red-600 text-center pt-4">{error}</p>}
        </div>
        <p>
          Don't have an account? <Link to="/signup">Sign up!</Link>
        </p>
      </form>
    </div>
  );
};

export default Signin;
