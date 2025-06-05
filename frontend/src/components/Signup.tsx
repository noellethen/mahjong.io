import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { session, signUpNewUser, signInWithGoogle } = UserAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signUpNewUser(email, password);

      if (!result.success) {
        setError(result.error.message || "Signup failed");
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
    }
  };

  return (
    <div>
      <h1 className="pt-4 text-3xl">mahjong.io</h1>
      <form onSubmit={handleSignUp} className="max-w-md m-auto pt-24">
        <h2 className="font-bold pb-2">Sign up</h2>
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
            placeholder="Set password"
            className="p-3 mt-6 bg-gray-950 hover:border hover:cursor-pointer"
            type="password"
            name=""
            id=""
          />
          <button type="submit" disabled={loading} className="mt-6 w-full">
            Sign Up
          </button>
          <div className="my-4 flex items-center">
            <hr className="flex-1 border-t-2 border-gray-400" />
            <span className="mx-4 text-gray-500">or</span>
            <hr className="flex-1 border-t-2 border-gray-400" />
          </div>
          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="w-full bg-red-500 text-white rounded"
          >
            Sign in with Google
          </button>
          {error && <p className="text-red-600 text-center pt-4">{error}</p>}
        </div>
        <p className="py-4">
          Already have an account? <Link to="/signin">Sign in!</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
