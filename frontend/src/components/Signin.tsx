import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, signInUser, signInWithGoogle } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/homepage");
    }
  }, [session, navigate]);

  const handleSignin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInUser(email, password);

      if (!result.success) {
        setError(result.error || "Signin failed");
        return;
      }

      navigate("/homepage");
    } catch (error) {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="pt-4 text-3xl">mahjong.io</h1>
      <form onSubmit={handleSignin} className="max-w-md m-auto pt-24">
        <h2 className="font-bold pb-2">Sign in</h2>
        <div className="flex flex-col">
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
            Sign in
          </button>
          {error && <p className="text-red-600 text-center pt-4">{error}</p>}
        </div>
        <div className="my-4 flex items-center">
          <hr className="flex-1 border-t-2 border-gray-400" />
          <span className="mx-4 text-gray-500">or</span>
          <hr className="flex-1 border-t-2 border-gray-400" />
        </div>
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full bg-red-500 text-black rounded flex items-center justify-center space-x-2"
          style={{ backgroundColor: "white" }}
        >
          <img src="/Google.png" alt="Google Logo" className="w-7 h-7" />
          <span>Sign in with Google</span>
        </button>
        <p className="py-4">
          Don't have an account? <Link to="/signup">Sign up!</Link>
        </p>
      </form>
    </div>
  );
};

export default Signin;
